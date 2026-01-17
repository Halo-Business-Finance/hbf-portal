import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configurations per action
const RATE_LIMITS: Record<string, { maxRequests: number; windowSeconds: number }> = {
  'send': { maxRequests: 50, windowSeconds: 60 },              // 50 per minute
  'send-bulk': { maxRequests: 10, windowSeconds: 60 },         // 10 per minute (admin only)
  'get-templates': { maxRequests: 30, windowSeconds: 60 },     // 30 per minute
  'application-status-change': { maxRequests: 100, windowSeconds: 60 }, // 100 per minute
  'loan-funded': { maxRequests: 20, windowSeconds: 60 },       // 20 per minute (admin only)
  'send-external': { maxRequests: 30, windowSeconds: 60 },     // 30 per minute (admin only)
};

interface RateLimitResult {
  allowed: boolean;
  remaining_requests: number;
  reset_at: string;
  current_count: number;
}

interface NotificationData {
  type: 'email' | 'sms' | 'system';
  recipient: string;
  template: string;
  data: any;
  applicationId?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Actions that require admin role
const ADMIN_ONLY_ACTIONS = ['loan-funded', 'send-external', 'send-bulk'];

async function checkRateLimit(
  supabase: any,
  identifier: string,
  endpoint: string,
  config: { maxRequests: number; windowSeconds: number }
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      _identifier: identifier,
      _endpoint: endpoint,
      _max_requests: config.maxRequests,
      _window_seconds: config.windowSeconds
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiting fails
      return { allowed: true, remaining_requests: 1, reset_at: new Date().toISOString(), current_count: 0 };
    }

    const result = data?.[0] || { allowed: true, remaining_requests: 1, reset_at: new Date().toISOString(), current_count: 0 };
    return result;
  } catch (error) {
    console.error('Rate limit check exception:', error);
    return { allowed: true, remaining_requests: 1, reset_at: new Date().toISOString(), current_count: 0 };
  }
}

function createRateLimitResponse(resetAt: string, endpoint: string): Response {
  const retryAfter = Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded',
      message: `Too many requests for ${endpoint}. Please try again later.`,
      retryAfter: retryAfter > 0 ? retryAfter : 60
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter > 0 ? retryAfter : 60),
        'X-RateLimit-Reset': resetAt
      } 
    }
  );
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token to validate their identity
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Create service role client for privileged operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get client IP for rate limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // Rate limit identifier
    const rateLimitIdentifier = user.id;

    // Validation schema for request body
    const requestSchema = z.object({
      action: z.enum(['send', 'send-bulk', 'get-templates', 'application-status-change', 'loan-funded', 'send-external']),
      notificationData: z.any().optional()
    });

    const notificationDataSchema = z.object({
      type: z.enum(['email', 'sms', 'system']).optional(),
      recipient: z.string().max(255).optional(),
      template: z.string().max(100).optional(),
      data: z.any().optional(),
      applicationId: z.string().uuid().optional(),
      notifications: z.array(z.any()).optional(),
      eventType: z.string().max(100).optional(),
      title: z.string().max(255).optional(),
      message: z.string().max(1000).optional(),
      applicantEmail: z.string().email().max(255).optional(),
      applicantName: z.string().max(200).optional(),
      newStatus: z.string().max(50).optional(),
      applicationNumber: z.string().max(100).optional(),
      loanNumber: z.string().max(100).optional(),
      loanAmount: z.number().min(0).max(1000000000).optional(),
      loanType: z.string().max(100).optional(),
      monthlyPayment: z.number().min(0).max(10000000).optional(),
      interestRate: z.number().min(0).max(100).optional(),
      termMonths: z.number().int().min(1).max(600).optional(),
      userId: z.string().uuid().optional()
    });

    const body = await req.json();
    const requestValidation = requestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          details: requestValidation.error.format()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, notificationData } = requestValidation.data;

    // ========== SERVER-SIDE RATE LIMITING ==========
    const rateLimitConfig = RATE_LIMITS[action] || { maxRequests: 60, windowSeconds: 60 };
    const rateLimitResult = await checkRateLimit(
      supabase,
      rateLimitIdentifier,
      `notification-service:${action}`,
      rateLimitConfig
    );

    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for ${rateLimitIdentifier} on action ${action}`);
      
      // Log rate limit violation to audit
      try {
        await supabase.rpc('log_audit_event', {
          _user_id: user.id,
          _action: 'RATE_LIMIT_EXCEEDED',
          _resource_type: 'notification',
          _resource_id: null,
          _ip_address: clientIp,
          _user_agent: req.headers.get('user-agent'),
          _details: {
            endpoint: 'notification-service',
            action,
            identifier: rateLimitIdentifier,
            currentCount: rateLimitResult.current_count
          }
        });
      } catch (auditError) {
        console.error('Failed to log rate limit audit:', auditError);
      }

      return createRateLimitResponse(rateLimitResult.reset_at, action);
    }

    // Add rate limit headers to all responses
    const rateLimitHeaders = {
      'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
      'X-RateLimit-Remaining': String(rateLimitResult.remaining_requests),
      'X-RateLimit-Reset': rateLimitResult.reset_at
    };

    console.log(`Rate limit check passed for ${rateLimitIdentifier}: ${rateLimitResult.remaining_requests} remaining`);

    // ========== AUTHORIZATION - Check admin role for sensitive actions ==========
    if (ADMIN_ONLY_ACTIONS.includes(action)) {
      const { data: roleCheck, error: roleError } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (roleError || !roleCheck) {
        console.error('Admin role check failed for user:', user.id, 'Action:', action);
        return new Response(
          JSON.stringify({ error: 'Forbidden - admin role required for this action' }),
          { status: 403, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Admin role verified for user:', user.id);
    }

    // Validate notificationData if present
    if (notificationData) {
      const dataValidation = notificationDataSchema.safeParse(notificationData);
      if (!dataValidation.success) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid notification data',
            details: dataValidation.error.format()
          }),
          { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log the action for audit purposes
    console.log(`User ${user.id} executing action: ${action}`);

    switch (action) {
      case 'send':
        return await sendNotification(notificationData, rateLimitHeaders);
      
      case 'send-bulk':
        return await sendBulkNotifications(notificationData.notifications, rateLimitHeaders);
      
      case 'get-templates':
        return await getEmailTemplates(rateLimitHeaders);

      case 'application-status-change':
        return await handleApplicationStatusChange(supabase, notificationData, rateLimitHeaders);

      case 'loan-funded':
        return await handleLoanFunded(supabase, notificationData, rateLimitHeaders);

      case 'send-external':
        return await sendExternalNotifications(supabase, notificationData, rateLimitHeaders);

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in notification-service:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendNotification(notificationData: NotificationData, rateLimitHeaders: Record<string, string>): Promise<Response> {
  try {
    console.log(`Sending ${notificationData.type} notification to ${notificationData.recipient}`);

    switch (notificationData.type) {
      case 'email':
        return await sendEmail(notificationData, rateLimitHeaders);
      case 'sms':
        return await sendSMS(notificationData, rateLimitHeaders);
      case 'system':
        return await createSystemNotification(notificationData, rateLimitHeaders);
      default:
        throw new Error('Invalid notification type');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to send notification'
      }),
      { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function sendEmail(notificationData: NotificationData, rateLimitHeaders: Record<string, string>): Promise<Response> {
  try {
    const template = getEmailTemplate(notificationData.template, notificationData.data);
    
    console.log('EMAIL NOTIFICATION:');
    console.log('To:', notificationData.recipient);
    console.log('Subject:', template.subject);
    console.log('Content:', template.text);
    
    const emailLog = {
      timestamp: new Date().toISOString(),
      recipient: notificationData.recipient,
      template: notificationData.template,
      subject: template.subject,
      status: 'sent',
      application_id: notificationData.applicationId
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email notification sent successfully',
        emailLog
      }),
      { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to send email'
      }),
      { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function sendSMS(notificationData: NotificationData, rateLimitHeaders: Record<string, string>): Promise<Response> {
  try {
    const message = getSMSTemplate(notificationData.template, notificationData.data);
    
    console.log('SMS NOTIFICATION:');
    console.log('To:', notificationData.recipient);
    console.log('Message:', message);
    
    const smsLog = {
      timestamp: new Date().toISOString(),
      recipient: notificationData.recipient,
      template: notificationData.template,
      message: message,
      status: 'sent',
      application_id: notificationData.applicationId
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SMS notification sent successfully',
        smsLog
      }),
      { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to send SMS'
      }),
      { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function createSystemNotification(notificationData: NotificationData, rateLimitHeaders: Record<string, string>): Promise<Response> {
  console.log('SYSTEM NOTIFICATION:', notificationData);
  
  return new Response(
    JSON.stringify({
      success: true,
      message: 'System notification created successfully'
    }),
    { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleApplicationStatusChange(supabase: any, notificationData: any, rateLimitHeaders: Record<string, string>): Promise<Response> {
  try {
    const { applicationId, newStatus, applicantEmail, applicantName, applicationNumber } = notificationData;

    const emailNotification: NotificationData = {
      type: 'email',
      recipient: applicantEmail,
      template: `application_${newStatus}`,
      data: {
        applicantName,
        applicationNumber,
        newStatus,
        timestamp: new Date().toISOString()
      },
      applicationId
    };

    return await sendNotification(emailNotification, rateLimitHeaders);

  } catch (error) {
    console.error('Error handling application status change:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to handle application status change'
      }),
      { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleLoanFunded(supabase: any, notificationData: any, rateLimitHeaders: Record<string, string>): Promise<Response> {
  try {
    const { applicantEmail, applicantName, loanNumber, loanAmount, loanType, monthlyPayment, interestRate, termMonths, userId } = notificationData;

    console.log('Sending loan funded notification to:', applicantEmail);

    // Send to external webhooks (Slack/Discord)
    try {
      await sendExternalNotifications(supabase, {
        eventType: 'loan_funded',
        title: '🎉 Loan Funded',
        message: `${loanType} loan of ${formatCurrency(loanAmount)} has been funded for ${applicantName}`,
        data: {
          loanAmount: formatCurrency(loanAmount),
          loanType,
          applicantName,
          loanNumber,
          monthlyPayment: formatCurrency(monthlyPayment),
          interestRate: `${interestRate.toFixed(2)}%`,
          termMonths: `${termMonths} months`
        }
      }, rateLimitHeaders);
    } catch (error) {
      console.error('Error sending to external webhooks:', error);
    }

    // Create in-app notification
    if (userId) {
      try {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Loan Funded Successfully!',
            message: `Your ${loanType} loan of ${formatCurrency(loanAmount)} has been approved and funded. Monthly payment: ${formatCurrency(monthlyPayment)}`,
            type: 'success',
            action_url: '/existing-loans',
            metadata: {
              loanNumber,
              loanAmount,
              loanType,
              monthlyPayment,
              interestRate,
              termMonths,
            },
          });

        if (notifError) {
          console.error('Error creating in-app notification:', notifError);
        } else {
          console.log('In-app notification created successfully for user:', userId);
        }
      } catch (error) {
        console.error('Error creating in-app notification:', error);
      }
    }

    // Send email notification
    const emailNotification: NotificationData = {
      type: 'email',
      recipient: applicantEmail,
      template: 'loan_funded',
      data: {
        applicantName,
        loanNumber,
        loanAmount: formatCurrency(loanAmount),
        loanType,
        monthlyPayment: formatCurrency(monthlyPayment),
        interestRate: interestRate.toFixed(2),
        termMonths,
        timestamp: new Date().toISOString()
      }
    };

    return await sendNotification(emailNotification, rateLimitHeaders);

  } catch (error) {
    console.error('Error handling loan funded notification:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to send loan funded notification'
      }),
      { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

async function sendExternalNotifications(supabase: any, notificationData: any, rateLimitHeaders: Record<string, string>): Promise<Response> {
  try {
    const { eventType, title, message, data } = notificationData;

    // Get all active webhooks for this event type
    const { data: webhooks, error } = await supabase
      .from('external_notification_webhooks')
      .select('*')
      .eq('is_active', true)
      .contains('event_types', [eventType]);

    if (error) {
      console.error('Error fetching webhooks:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch webhooks' }),
        { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhooks || webhooks.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active webhooks for this event type' }),
        { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const webhook of webhooks) {
      try {
        const payload = webhook.platform === 'slack' 
          ? formatSlackMessage(title, message, data)
          : formatDiscordMessage(title, message, data);

        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        results.push({
          webhook: webhook.name,
          platform: webhook.platform,
          success: response.ok,
          status: response.status,
        });

        console.log(`Sent notification to ${webhook.platform} webhook: ${webhook.name}`, response.ok);
      } catch (error) {
        console.error(`Error sending to ${webhook.platform} webhook ${webhook.name}:`, error);
        results.push({
          webhook: webhook.name,
          platform: webhook.platform,
          success: false,
          error: 'Failed to send'
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sendExternalNotifications:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function formatSlackMessage(title: string, message: string, data: any) {
  const fields = [];
  
  if (data) {
    if (data.loanAmount) fields.push({ type: 'mrkdwn', text: `*Amount:*\n${data.loanAmount}` });
    if (data.loanType) fields.push({ type: 'mrkdwn', text: `*Type:*\n${data.loanType}` });
    if (data.applicantName) fields.push({ type: 'mrkdwn', text: `*Applicant:*\n${data.applicantName}` });
    if (data.applicationNumber) fields.push({ type: 'mrkdwn', text: `*Application #:*\n${data.applicationNumber}` });
  }

  return {
    text: `${title}: ${message}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      },
      ...(fields.length > 0 ? [{
        type: 'section',
        fields: fields
      }] : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Sent from Heritage Business Funding | ${new Date().toLocaleString()}`
          }
        ]
      }
    ]
  };
}

function formatDiscordMessage(title: string, message: string, data: any) {
  const fields = [];
  
  if (data) {
    if (data.loanAmount) fields.push({ name: 'Amount', value: data.loanAmount, inline: true });
    if (data.loanType) fields.push({ name: 'Type', value: data.loanType, inline: true });
    if (data.applicantName) fields.push({ name: 'Applicant', value: data.applicantName, inline: true });
    if (data.applicationNumber) fields.push({ name: 'Application #', value: data.applicationNumber, inline: true });
  }

  return {
    embeds: [{
      title,
      description: message,
      color: 0x00d26a,
      fields: fields.length > 0 ? fields : undefined,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Heritage Business Funding'
      }
    }]
  };
}

async function sendBulkNotifications(notifications: NotificationData[], rateLimitHeaders: Record<string, string>): Promise<Response> {
  try {
    const results = await Promise.all(
      notifications.map(notification => sendNotification(notification, rateLimitHeaders))
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bulk notifications processed',
        resultsCount: results.length
      }),
      { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to send bulk notifications' }),
      { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getEmailTemplates(rateLimitHeaders: Record<string, string>): Promise<Response> {
  const templates = {
    application_submitted: {
      subject: 'Application Received - Heritage Business Funding',
      description: 'Sent when a new application is submitted'
    },
    application_under_review: {
      subject: 'Application Under Review - Heritage Business Funding',
      description: 'Sent when application moves to review stage'
    },
    application_approved: {
      subject: 'Congratulations! Your Application is Approved',
      description: 'Sent when application is approved'
    },
    application_rejected: {
      subject: 'Application Update - Heritage Business Funding',
      description: 'Sent when application is declined'
    },
    loan_funded: {
      subject: 'Your Loan Has Been Funded!',
      description: 'Sent when loan is funded'
    },
    document_required: {
      subject: 'Document Required - Heritage Business Funding',
      description: 'Sent when additional documents are needed'
    },
    payment_reminder: {
      subject: 'Payment Reminder - Heritage Business Funding',
      description: 'Sent before payment due date'
    },
    welcome: {
      subject: 'Welcome to Heritage Business Funding',
      description: 'Sent to new users'
    }
  };

  return new Response(
    JSON.stringify({ templates }),
    { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
  );
}

function getEmailTemplate(templateName: string, data: any): EmailTemplate {
  const templates: Record<string, (data: any) => EmailTemplate> = {
    application_submitted: (data) => ({
      subject: 'Application Received - Heritage Business Funding',
      html: `<h1>Thank you, ${data.applicantName}!</h1><p>Your application #${data.applicationNumber} has been received.</p>`,
      text: `Thank you, ${data.applicantName}! Your application #${data.applicationNumber} has been received.`
    }),
    application_under_review: (data) => ({
      subject: 'Application Under Review - Heritage Business Funding',
      html: `<h1>Hello, ${data.applicantName}</h1><p>Your application #${data.applicationNumber} is now under review.</p>`,
      text: `Hello, ${data.applicantName}. Your application #${data.applicationNumber} is now under review.`
    }),
    application_approved: (data) => ({
      subject: 'Congratulations! Your Application is Approved',
      html: `<h1>Great news, ${data.applicantName}!</h1><p>Your application #${data.applicationNumber} has been approved!</p>`,
      text: `Great news, ${data.applicantName}! Your application #${data.applicationNumber} has been approved!`
    }),
    application_rejected: (data) => ({
      subject: 'Application Update - Heritage Business Funding',
      html: `<h1>Hello, ${data.applicantName}</h1><p>We regret to inform you that your application #${data.applicationNumber} was not approved.</p>`,
      text: `Hello, ${data.applicantName}. We regret to inform you that your application #${data.applicationNumber} was not approved.`
    }),
    loan_funded: (data) => ({
      subject: 'Your Loan Has Been Funded!',
      html: `<h1>Congratulations, ${data.applicantName}!</h1><p>Your ${data.loanType} loan of ${data.loanAmount} has been funded!</p>`,
      text: `Congratulations, ${data.applicantName}! Your ${data.loanType} loan of ${data.loanAmount} has been funded!`
    }),
    welcome: (data) => ({
      subject: 'Welcome to Heritage Business Funding',
      html: `<h1>Welcome, ${data.userName}!</h1><p>Thank you for joining Heritage Business Funding.</p>`,
      text: `Welcome, ${data.userName}! Thank you for joining Heritage Business Funding.`
    }),
    application_reminder: (data) => ({
      subject: 'Complete Your Application - Heritage Business Funding',
      html: `<h1>Hello, ${data.userName}</h1><p>You have an incomplete application from ${data.daysAgo} days ago.</p>`,
      text: `Hello, ${data.userName}. You have an incomplete application from ${data.daysAgo} days ago.`
    })
  };

  const templateFn = templates[templateName] || templates.welcome;
  return templateFn(data);
}

function getSMSTemplate(templateName: string, data: any): string {
  const templates: Record<string, (data: any) => string> = {
    application_submitted: (data) => 
      `Heritage Business Funding: Your application #${data.applicationNumber} has been received. We'll be in touch soon!`,
    application_approved: (data) => 
      `Heritage Business Funding: Great news! Your application #${data.applicationNumber} has been approved! Log in for details.`,
    loan_funded: (data) => 
      `Heritage Business Funding: Your ${data.loanType} loan of ${data.loanAmount} has been funded! Check your account for details.`,
  };

  const templateFn = templates[templateName] || (() => `Heritage Business Funding notification`);
  return templateFn(data);
}
