import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = `https://zosgzkpfgaaadadezpxo.supabase.co/functions/v1/ibm-database`;

async function callIbmDatabase(operation: string, query?: string, params?: unknown[]) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Authentication required. Please log in.');
  }

  const body: Record<string, unknown> = { operation };
  if (query) body.query = query;
  if (params?.length) body.params = params;

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2d6a3BmZ2FhYWRhZGV6cHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzAxMjgsImV4cCI6MjA2OTE0NjEyOH0.r2puMuMTlbLkXqceD7MfC630q_W0K-9GbI632BtFJOY',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export const ibmDatabaseService = {
  getStatus: () => callIbmDatabase('status'),
  getTables: () => callIbmDatabase('tables'),
  executeQuery: (query: string) => callIbmDatabase('query', query),
  executeMutation: (query: string, params?: unknown[]) => callIbmDatabase('mutate', query, params),
};
