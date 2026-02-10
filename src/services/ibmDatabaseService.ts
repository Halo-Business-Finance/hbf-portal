import { supabase } from '@/integrations/supabase/client';
import { authProvider } from '@/services/auth';

async function callIbmDatabase(operation: string, query?: string, params?: unknown[]) {
  const body: Record<string, unknown> = { operation };
  if (query) body.query = query;
  if (params?.length) body.params = params;

  try {
    const { data, error } = await supabase.functions.invoke('ibm-database', {
      body,
    });

    if (error) {
      const msg = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);
      throw new Error(msg || `${operation} request failed`);
    }

    if (data && typeof data === 'object' && 'error' in data) {
      throw new Error((data as { error: string }).error);
    }

    return data;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error(`${operation} request failed`);
  }
}

export interface MigrationProgress {
  type: 'progress' | 'table_progress' | 'error_detail' | 'complete' | 'error';
  message?: string;
  table?: string;
  rows?: number;
  skipped?: boolean;
  success?: boolean;
  step?: string;
  tablesCreated?: number;
  rowsInserted?: number;
  log?: string[];
  errors?: string[];
  error?: string;
}

export interface RowCountComparison {
  table: string;
  supabase: number;
  ibm: number;
  match: boolean;
}

export const ibmDatabaseService = {
  getStatus: () => callIbmDatabase('status'),
  getTables: () => callIbmDatabase('tables'),
  executeQuery: (query: string) => callIbmDatabase('query', query),
  executeMutation: (query: string, params?: unknown[]) => callIbmDatabase('mutate', query, params),
  compareRowCounts: () => callIbmDatabase('compare_counts') as Promise<{ comparison: RowCountComparison[] }>,

  migrateToIbm: async (
    step: 'schema' | 'data' | 'full' = 'full',
    onProgress?: (event: MigrationProgress) => void
  ): Promise<MigrationProgress> => {
    const { data: sessionData } = await authProvider.getSession();
    if (!sessionData?.session?.access_token) throw new Error('Authentication required');

    const response = await fetch(
      `https://zosgzkpfgaaadadezpxo.supabase.co/functions/v1/migrate-to-ibm`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2d6a3BmZ2FhYWRhZGV6cHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzAxMjgsImV4cCI6MjA2OTE0NjEyOH0.r2puMuMTlbLkXqceD7MfC630q_W0K-9GbI632BtFJOY',
        },
        body: JSON.stringify({ step }),
      }
    );

    if (!response.ok && !response.body) {
      throw new Error(`Migration failed with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: MigrationProgress | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event: MigrationProgress = JSON.parse(line);
          onProgress?.(event);

          if (event.type === 'complete' || event.type === 'error') {
            finalResult = event;
          }
        } catch {
          // Skip malformed lines
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const event: MigrationProgress = JSON.parse(buffer);
        onProgress?.(event);
        if (event.type === 'complete' || event.type === 'error') {
          finalResult = event;
        }
      } catch { /* skip */ }
    }

    if (!finalResult) {
      throw new Error('Migration stream ended without a final result');
    }

    if (finalResult.type === 'error') {
      throw new Error(finalResult.error || 'Migration failed');
    }

    return finalResult;
  },
};
