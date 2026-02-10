import { supabase } from '@/integrations/supabase/client';

async function callIbmDatabase(operation: string, query?: string, params?: unknown[]) {
  const body: Record<string, unknown> = { operation };
  if (query) body.query = query;
  if (params?.length) body.params = params;

  try {
    const { data, error } = await supabase.functions.invoke('ibm-database', {
      body,
    });

    if (error) {
      // The supabase client wraps errors - try to extract the message
      const msg = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);
      throw new Error(msg || `${operation} request failed`);
    }

    // Handle case where data contains an error from the edge function
    if (data && typeof data === 'object' && 'error' in data) {
      throw new Error((data as { error: string }).error);
    }

    return data;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error(`${operation} request failed`);
  }
}

export const ibmDatabaseService = {
  getStatus: () => callIbmDatabase('status'),
  getTables: () => callIbmDatabase('tables'),
  executeQuery: (query: string) => callIbmDatabase('query', query),
  executeMutation: (query: string, params?: unknown[]) => callIbmDatabase('mutate', query, params),
  migrateToIbm: async (step: 'schema' | 'data' | 'full' = 'full') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Authentication required');
    
    const { data, error } = await supabase.functions.invoke('migrate-to-ibm', {
      body: { step },
    });
    
    if (error) throw new Error(error.message || 'Migration failed');
    if (data && typeof data === 'object' && 'error' in data) {
      throw new Error((data as { error: string }).error);
    }
    return data;
  },
};
