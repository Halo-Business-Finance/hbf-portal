/**
 * Supabase implementation of the DataAPI interfaces.
 * Uses direct HTTP via supabaseHttp helpers (no SDK dependency).
 */
import { restQuery } from '@/services/supabaseHttp';
import type {
  DataAPI,
  LoanApplicationsAPI,
  BankAccountsAPI,
  CreditScoresAPI,
  DocumentsAPI,
  LoanApplication,
  BankAccount,
} from './types';

const loanApplications: LoanApplicationsAPI = {
  async list(userId: string): Promise<LoanApplication[]> {
    const params = new URLSearchParams();
    params.set('user_id', `eq.${userId}`);
    params.set('order', 'created_at.desc');
    const { data } = await restQuery<LoanApplication[]>('loan_applications', { params });
    return data ?? [];
  },

  async listByStatus(userId: string, statuses: string[]): Promise<LoanApplication[]> {
    const params = new URLSearchParams();
    params.set('user_id', `eq.${userId}`);
    params.set('status', `in.(${statuses.join(',')})`);
    params.set('order', 'application_submitted_date.desc');
    const { data } = await restQuery<LoanApplication[]>('loan_applications', { params });
    return data ?? [];
  },

  async getById(id: string): Promise<LoanApplication | null> {
    const params = new URLSearchParams();
    params.set('id', `eq.${id}`);
    const { data } = await restQuery<LoanApplication[]>('loan_applications', { params });
    return data?.[0] ?? null;
  },

  async hasAny(userId: string): Promise<boolean> {
    const params = new URLSearchParams();
    params.set('user_id', `eq.${userId}`);
    params.set('select', 'id');
    params.set('limit', '1');
    const { data } = await restQuery<{ id: string }[]>('loan_applications', { params });
    return (data?.length ?? 0) > 0;
  },

  async delete(id: string): Promise<void> {
    const params = new URLSearchParams();
    params.set('id', `eq.${id}`);
    await restQuery('loan_applications', { method: 'DELETE', params });
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const params = new URLSearchParams();
    params.set('id', `eq.${id}`);
    await restQuery('loan_applications', { method: 'PATCH', params, body: { status } });
  },
};

const bankAccounts: BankAccountsAPI = {
  async listActive(userId: string): Promise<BankAccount[]> {
    const params = new URLSearchParams();
    params.set('user_id', `eq.${userId}`);
    params.set('status', 'eq.active');
    params.set('order', 'balance.desc');
    const { data } = await restQuery<BankAccount[]>('bank_accounts', { params });
    return data ?? [];
  },

  async listBalances(userId: string): Promise<{ balance: number }[]> {
    const params = new URLSearchParams();
    params.set('user_id', `eq.${userId}`);
    params.set('select', 'balance');
    const { data } = await restQuery<{ balance: number }[]>('bank_accounts', { params });
    return data ?? [];
  },
};

const creditScores: CreditScoresAPI = {
  async listScores(userId: string): Promise<{ score: number }[]> {
    const params = new URLSearchParams();
    params.set('user_id', `eq.${userId}`);
    params.set('select', 'score');
    const { data } = await restQuery<{ score: number }[]>('credit_scores', { params });
    return data ?? [];
  },
};

const documents: DocumentsAPI = {
  async listCategories(userId: string): Promise<{ document_category: string }[]> {
    const params = new URLSearchParams();
    params.set('user_id', `eq.${userId}`);
    params.set('select', 'document_category');
    const { data } = await restQuery<{ document_category: string }[]>('borrower_documents', { params });
    return data ?? [];
  },
};

export const supabaseProvider: DataAPI = {
  loanApplications,
  bankAccounts,
  creditScores,
  documents,
};
