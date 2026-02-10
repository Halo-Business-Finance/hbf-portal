import { supabase } from '@/integrations/supabase/client';

async function callIbmDatabase(operation: string, query?: string, params?: unknown[]) {
  const body: Record<string, unknown> = { operation };
  if (query) body.query = query;
  if (params?.length) body.params = params;

  const { data, error } = await supabase.functions.invoke('ibm-database', {
    body,
  });

  if (error) {
    throw new Error(error.message || 'Request failed');
  }
  return data;
}

export const ibmDatabaseService = {
  getStatus: () => callIbmDatabase('status'),
  getTables: () => callIbmDatabase('tables'),
  executeQuery: (query: string) => callIbmDatabase('query', query),
  executeMutation: (query: string, params?: unknown[]) => callIbmDatabase('mutate', query, params),
};
