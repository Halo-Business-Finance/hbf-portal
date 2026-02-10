/**
 * Central data API — single import for all components.
 *
 * To switch backends, change the provider import here.
 * e.g. swap `supabaseProvider` → `ibmProvider`
 */
export type { DataAPI, LoanApplication, BankAccount, CreditScore, BorrowerDocument } from './types';
import { supabaseProvider } from './supabaseProvider';

export const api = supabaseProvider;
