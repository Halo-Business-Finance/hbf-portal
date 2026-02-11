/**
 * IBM Cloud implementation of the DataAPI interfaces.
 * Routes all queries through the ibm-data-api edge function,
 * which connects directly to IBM PostgreSQL.
 */
import { authProvider } from '@/services/auth';
import type {
  DataAPI,
  LoanApplicationsAPI,
  BankAccountsAPI,
  CreditScoresAPI,
  DocumentsAPI,
  LoanApplication,
  BankAccount,
} from './types';

import { edgeFunctionUrl, SUPABASE_ANON_KEY as ANON_KEY } from '@/config/supabase';

const EDGE_FUNCTION_URL = edgeFunctionUrl('ibm-data-api');

/** Call the ibm-data-api edge function with the current user's auth token. */
async function callIbmApi<T>(body: Record<string, unknown>): Promise<T> {
  const { data: sessionData } = await authProvider.getSession();
  const session = sessionData?.session;
  if (!session?.access_token) throw new Error('Not authenticated');

  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || `IBM API error (${res.status})`);
  return data as T;
}

const loanApplications: LoanApplicationsAPI = {
  async list(userId: string): Promise<LoanApplication[]> {
    const res = await callIbmApi<{ data: LoanApplication[] }>({
      entity: 'loan_applications',
      action: 'list',
    });
    return res.data ?? [];
  },

  async listByStatus(userId: string, statuses: string[]): Promise<LoanApplication[]> {
    const res = await callIbmApi<{ data: LoanApplication[] }>({
      entity: 'loan_applications',
      action: 'list_by_status',
      statuses,
    });
    return res.data ?? [];
  },

  async getById(id: string): Promise<LoanApplication | null> {
    const res = await callIbmApi<{ data: LoanApplication | null }>({
      entity: 'loan_applications',
      action: 'get_by_id',
      id,
    });
    return res.data ?? null;
  },

  async hasAny(userId: string): Promise<boolean> {
    const res = await callIbmApi<{ data: boolean }>({
      entity: 'loan_applications',
      action: 'has_any',
    });
    return res.data ?? false;
  },

  async delete(id: string): Promise<void> {
    await callIbmApi({ entity: 'loan_applications', action: 'delete', id });
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await callIbmApi({ entity: 'loan_applications', action: 'update_status', id, status });
  },
};

const bankAccounts: BankAccountsAPI = {
  async listActive(userId: string): Promise<BankAccount[]> {
    const res = await callIbmApi<{ data: BankAccount[] }>({
      entity: 'bank_accounts',
      action: 'list_active',
    });
    return res.data ?? [];
  },

  async listBalances(userId: string): Promise<{ balance: number }[]> {
    const res = await callIbmApi<{ data: { balance: number }[] }>({
      entity: 'bank_accounts',
      action: 'list_balances',
    });
    return res.data ?? [];
  },
};

const creditScores: CreditScoresAPI = {
  async listScores(userId: string): Promise<{ score: number }[]> {
    const res = await callIbmApi<{ data: { score: number }[] }>({
      entity: 'credit_scores',
      action: 'list_scores',
    });
    return res.data ?? [];
  },
};

const documents: DocumentsAPI = {
  async listCategories(userId: string): Promise<{ document_category: string }[]> {
    const res = await callIbmApi<{ data: { document_category: string }[] }>({
      entity: 'documents',
      action: 'list_categories',
    });
    return res.data ?? [];
  },
};

export const ibmProvider: DataAPI = {
  loanApplications,
  bankAccounts,
  creditScores,
  documents,
};
