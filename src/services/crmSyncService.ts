/**
 * CRM Sync Service
 *
 * Pushes portal data (profiles, loan applications, documents, financials)
 * to CRM tables via the existing hbf-api rest-query endpoint.
 *
 * CRM tables: crm_contacts, crm_opportunities, crm_activities, crm_sync_log
 */

import { restQuery } from './supabaseHttp';

// ── Types ──

export interface CrmContact {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_zip?: string;
  source?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CrmOpportunity {
  id?: string;
  contact_id?: string;
  user_id: string;
  application_id: string;
  loan_type: string;
  amount: number;
  status: string;
  stage?: string;
  business_name?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CrmActivity {
  id?: string;
  contact_id?: string;
  user_id: string;
  activity_type: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

interface CrmSyncLogEntry {
  entity_type: string;
  entity_id: string;
  action: string;
  status: 'success' | 'error';
  error_message?: string;
  synced_at?: string;
}

// ── Helpers ──

async function logSync(entry: CrmSyncLogEntry): Promise<void> {
  try {
    await restQuery('crm_sync_log', {
      method: 'POST',
      body: {
        ...entry,
        synced_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[CRM Sync] Failed to write sync log:', err);
  }
}

// ── Contact Sync ──

async function upsertContact(contact: CrmContact): Promise<void> {
  try {
    // Check if contact already exists for this user
    const p = new URLSearchParams();
    p.set('user_id', `eq.${contact.user_id}`);
    const { data: existing } = await restQuery<CrmContact[]>('crm_contacts', {
      params: p,
    });

    const now = new Date().toISOString();

    if (existing && Array.isArray(existing) && existing.length > 0) {
      // Update existing contact
      const updateParams = new URLSearchParams();
      updateParams.set('user_id', `eq.${contact.user_id}`);
      await restQuery('crm_contacts', {
        method: 'PATCH',
        params: updateParams,
        body: {
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          company_name: contact.company_name,
          company_address: contact.company_address,
          company_city: contact.company_city,
          company_state: contact.company_state,
          company_zip: contact.company_zip,
          updated_at: now,
        },
      });
    } else {
      // Create new contact
      await restQuery('crm_contacts', {
        method: 'POST',
        body: {
          ...contact,
          source: contact.source || 'borrower_portal',
          status: contact.status || 'active',
          created_at: now,
          updated_at: now,
        },
      });
    }

    await logSync({
      entity_type: 'contact',
      entity_id: contact.user_id,
      action: existing && Array.isArray(existing) && existing.length > 0 ? 'update' : 'create',
      status: 'success',
    });
  } catch (err) {
    console.error('[CRM Sync] Contact sync failed:', err);
    await logSync({
      entity_type: 'contact',
      entity_id: contact.user_id,
      action: 'upsert',
      status: 'error',
      error_message: err instanceof Error ? err.message : String(err),
    });
  }
}

// ── Opportunity Sync (Loan Applications) ──

async function upsertOpportunity(opp: CrmOpportunity): Promise<void> {
  try {
    const p = new URLSearchParams();
    p.set('application_id', `eq.${opp.application_id}`);
    const { data: existing } = await restQuery<CrmOpportunity[]>('crm_opportunities', {
      params: p,
    });

    const now = new Date().toISOString();

    if (existing && Array.isArray(existing) && existing.length > 0) {
      const updateParams = new URLSearchParams();
      updateParams.set('application_id', `eq.${opp.application_id}`);
      await restQuery('crm_opportunities', {
        method: 'PATCH',
        params: updateParams,
        body: {
          loan_type: opp.loan_type,
          amount: opp.amount,
          status: opp.status,
          stage: opp.stage,
          business_name: opp.business_name,
          notes: opp.notes,
          updated_at: now,
        },
      });
    } else {
      await restQuery('crm_opportunities', {
        method: 'POST',
        body: {
          ...opp,
          stage: opp.stage || mapStatusToStage(opp.status),
          created_at: now,
          updated_at: now,
        },
      });
    }

    await logSync({
      entity_type: 'opportunity',
      entity_id: opp.application_id,
      action: existing && Array.isArray(existing) && existing.length > 0 ? 'update' : 'create',
      status: 'success',
    });
  } catch (err) {
    console.error('[CRM Sync] Opportunity sync failed:', err);
    await logSync({
      entity_type: 'opportunity',
      entity_id: opp.application_id,
      action: 'upsert',
      status: 'error',
      error_message: err instanceof Error ? err.message : String(err),
    });
  }
}

// ── Activity Logging ──

async function logActivity(activity: CrmActivity): Promise<void> {
  try {
    await restQuery('crm_activities', {
      method: 'POST',
      body: {
        ...activity,
        created_at: new Date().toISOString(),
      },
    });

    await logSync({
      entity_type: 'activity',
      entity_id: activity.entity_id || activity.user_id,
      action: 'create',
      status: 'success',
    });
  } catch (err) {
    console.error('[CRM Sync] Activity log failed:', err);
    // Don't log sync failure for activity logging to avoid loops
  }
}

// ── Stage Mapping ──

function mapStatusToStage(status: string): string {
  const stageMap: Record<string, string> = {
    draft: 'prospecting',
    submitted: 'qualification',
    pending_review: 'qualification',
    under_review: 'needs_analysis',
    in_review: 'needs_analysis',
    documents_requested: 'needs_analysis',
    conditionally_approved: 'proposal',
    approved: 'negotiation',
    funded: 'closed_won',
    declined: 'closed_lost',
    withdrawn: 'closed_lost',
    cancelled: 'closed_lost',
  };
  return stageMap[status] || 'qualification';
}

// ── Public API ──

class CrmSyncService {
  /**
   * Sync a borrower profile to CRM contacts.
   */
  async syncProfile(profile: {
    user_id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    company_name?: string;
    company_address?: string;
    company_city?: string;
    company_state?: string;
    company_zip?: string;
  }): Promise<void> {
    await upsertContact({
      user_id: profile.user_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      company_name: profile.company_name,
      company_address: profile.company_address,
      company_city: profile.company_city,
      company_state: profile.company_state,
      company_zip: profile.company_zip,
    });
  }

  /**
   * Sync a loan application to CRM opportunities.
   */
  async syncLoanApplication(app: {
    application_id: string;
    user_id: string;
    loan_type: string;
    amount_requested: number;
    status: string;
    business_name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }): Promise<void> {
    // Also upsert the contact from application data
    if (app.first_name && app.last_name) {
      await upsertContact({
        user_id: app.user_id,
        first_name: app.first_name,
        last_name: app.last_name,
        phone: app.phone,
        company_name: app.business_name,
      });
    }

    await upsertOpportunity({
      user_id: app.user_id,
      application_id: app.application_id,
      loan_type: app.loan_type,
      amount: app.amount_requested,
      status: app.status,
      business_name: app.business_name,
    });

    await logActivity({
      user_id: app.user_id,
      activity_type: 'loan_application_sync',
      entity_type: 'loan_application',
      entity_id: app.application_id,
      description: `Loan application ${app.status}: ${app.loan_type} for $${app.amount_requested.toLocaleString()}`,
      metadata: {
        loan_type: app.loan_type,
        amount: app.amount_requested,
        status: app.status,
      },
    });
  }

  /**
   * Sync a loan status change to CRM.
   */
  async syncStatusChange(app: {
    application_id: string;
    user_id: string;
    loan_type: string;
    amount_requested: number;
    old_status: string;
    new_status: string;
    business_name?: string;
  }): Promise<void> {
    await upsertOpportunity({
      user_id: app.user_id,
      application_id: app.application_id,
      loan_type: app.loan_type,
      amount: app.amount_requested,
      status: app.new_status,
      stage: mapStatusToStage(app.new_status),
      business_name: app.business_name,
    });

    await logActivity({
      user_id: app.user_id,
      activity_type: 'status_change',
      entity_type: 'loan_application',
      entity_id: app.application_id,
      description: `Status changed from "${app.old_status}" to "${app.new_status}"`,
      metadata: {
        old_status: app.old_status,
        new_status: app.new_status,
        loan_type: app.loan_type,
      },
    });
  }

  /**
   * Log a document upload event to CRM activities.
   */
  async syncDocumentUpload(doc: {
    user_id: string;
    document_id: string;
    document_name: string;
    document_category: string;
    application_id?: string;
  }): Promise<void> {
    await logActivity({
      user_id: doc.user_id,
      activity_type: 'document_upload',
      entity_type: 'document',
      entity_id: doc.document_id,
      description: `Document uploaded: ${doc.document_name} (${doc.document_category})`,
      metadata: {
        document_name: doc.document_name,
        category: doc.document_category,
        application_id: doc.application_id,
      },
    });
  }

  /**
   * Log a financial data update (bank account or credit score) to CRM activities.
   */
  async syncFinancialUpdate(data: {
    user_id: string;
    type: 'bank_account' | 'credit_score';
    entity_id: string;
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await logActivity({
      user_id: data.user_id,
      activity_type: `${data.type}_update`,
      entity_type: data.type,
      entity_id: data.entity_id,
      description: data.description,
      metadata: data.metadata,
    });
  }

  /**
   * Get sync log for an entity.
   */
  async getSyncLog(entityType?: string, limit = 50): Promise<CrmSyncLogEntry[]> {
    const p = new URLSearchParams();
    if (entityType) p.set('entity_type', `eq.${entityType}`);
    p.set('order', 'synced_at.desc');
    p.set('limit', String(limit));
    const { data } = await restQuery<CrmSyncLogEntry[]>('crm_sync_log', { params: p });
    return data || [];
  }
}

export const crmSyncService = new CrmSyncService();
