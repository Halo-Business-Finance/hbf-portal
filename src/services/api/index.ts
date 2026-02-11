/**
 * Central data API — single import for all components.
 *
 * Primary: IBM PostgreSQL provider (via ibm-data-api edge function)
 * Fallback: Supabase provider kept in supabaseProvider.ts
 */
export type { DataAPI, LoanApplication, BankAccount, CreditScore, BorrowerDocument } from './types';
import { ibmProvider } from './ibmProvider';

export const api = ibmProvider;
