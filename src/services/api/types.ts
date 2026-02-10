/**
 * Centralized API types — backend-agnostic interfaces.
 * Components import from here; the concrete provider (Supabase / IBM) implements them.
 */

export interface LoanApplication {
  id: string;
  user_id: string;
  loan_type: string;
  amount_requested: number | null;
  application_number: string | null;
  status: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip: string | null;
  years_in_business: number | null;
  loan_details: unknown;
  application_started_date: string | null;
  application_submitted_date: string | null;
  funded_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  account_name: string;
  institution: string;
  balance: number;
  is_business: boolean;
  status: string;
  account_type: string;
  currency: string;
  account_number: string;
  external_id: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditScore {
  id: string;
  user_id: string;
  score: number;
  bureau: string;
  score_date: string;
  report_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BorrowerDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  document_category: string;
  description: string | null;
  version_number: number;
  parent_document_id: string | null;
  is_latest_version: boolean;
  uploaded_at: string;
  updated_at: string;
}

// -- Service interfaces --

export interface LoanApplicationsAPI {
  list(userId: string): Promise<LoanApplication[]>;
  listByStatus(userId: string, statuses: string[]): Promise<LoanApplication[]>;
  getById(id: string): Promise<LoanApplication | null>;
  hasAny(userId: string): Promise<boolean>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: string): Promise<void>;
}

export interface BankAccountsAPI {
  listActive(userId: string): Promise<BankAccount[]>;
  listBalances(userId: string): Promise<{ balance: number }[]>;
}

export interface CreditScoresAPI {
  listScores(userId: string): Promise<{ score: number }[]>;
}

export interface DocumentsAPI {
  listCategories(userId: string): Promise<{ document_category: string }[]>;
}

/** Top-level API facade used by components */
export interface DataAPI {
  loanApplications: LoanApplicationsAPI;
  bankAccounts: BankAccountsAPI;
  creditScores: CreditScoresAPI;
  documents: DocumentsAPI;
}
