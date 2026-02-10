/**
 * Supabase implementation of the DataAPI interfaces.
 * This is the current provider — will be swapped to IBM provider later.
 */
import { supabase } from '@/integrations/supabase/client';
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
    const { data, error } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LoanApplication[];
  },

  async listByStatus(userId: string, statuses: string[]): Promise<LoanApplication[]> {
    const { data, error } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('user_id', userId)
      .in('status', statuses as any)
      .order('application_submitted_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LoanApplication[];
  },

  async getById(id: string): Promise<LoanApplication | null> {
    const { data, error } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as LoanApplication | null;
  },

  async hasAny(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('loan_applications')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    return (data?.length ?? 0) > 0;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('loan_applications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('loan_applications')
      .update({ status } as any)
      .eq('id', id);
    if (error) throw error;
  },
};

const bankAccounts: BankAccountsAPI = {
  async listActive(userId: string): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('balance', { ascending: false });
    if (error) throw error;
    return (data ?? []) as BankAccount[];
  },

  async listBalances(userId: string): Promise<{ balance: number }[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('balance')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as { balance: number }[];
  },
};

const creditScores: CreditScoresAPI = {
  async listScores(userId: string): Promise<{ score: number }[]> {
    const { data, error } = await supabase
      .from('credit_scores')
      .select('score')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as { score: number }[];
  },
};

const documents: DocumentsAPI = {
  async listCategories(userId: string): Promise<{ document_category: string }[]> {
    const { data, error } = await supabase
      .from('borrower_documents')
      .select('document_category')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as { document_category: string }[];
  },
};

export const supabaseProvider: DataAPI = {
  loanApplications,
  bankAccounts,
  creditScores,
  documents,
};
