import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security: HTML escape function to prevent XSS injection
function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Security: Validate URL format and protocol
function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS for security
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Security: Validate email format
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { recipientEmail, documentName, shareableLink, senderName, documentId } = await req.json();

    // SECURITY: Validate all required inputs
    if (!recipientEmail || !documentName || !shareableLink || !senderName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate email format
    if (!validateEmail(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid recipient email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate URL format and protocol
    if (!validateUrl(shareableLink)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shareable link - must be HTTPS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate input lengths to prevent abuse
    if (senderName.length > 100 || documentName.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Input exceeds maximum allowed length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify document ownership before allowing email sharing
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      console.error('Service role key not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Query to verify the user owns the document they're trying to share
    let ownershipQuery = supabaseAdmin
      .from('borrower_documents')
      .select('id, file_name')
      .eq('user_id', user.id);
    
    // If documentId is provided, use it for more precise matching
    if (documentId) {
      ownershipQuery = ownershipQuery.eq('id', documentId);
    } else {
      // Fallback to matching by document name (less secure but maintains backwards compatibility)
      ownershipQuery = ownershipQuery.eq('file_name', documentName);
    }
    
    const { data: document, error: docError } = await ownershipQuery.maybeSingle();

    if (docError) {
      console.error('Document ownership check failed:', docError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify document ownership' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!document) {
      console.warn(`Unauthorized document share attempt by user ${user.id} for document: ${documentId || documentName}`);
      return new Response(
        JSON.stringify({ error: 'Document not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Document ownership verified: ${document.id} belongs to user ${user.id}`);

    // Check if Microsoft 365 credentials are configured
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
    const senderEmail = Deno.env.get('MICROSOFT_SENDER_EMAIL');

    if (!clientId || !clientSecret || !tenantId || !senderEmail) {
      return new Response(
        JSON.stringify({ 
          error: 'Microsoft 365 credentials not configured. Please add MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, and MICROSOFT_SENDER_EMAIL in your project secrets.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get access token from Microsoft
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Microsoft 365' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token } = await tokenResponse.json();

    // SECURITY: Sanitize all user inputs before inserting into HTML to prevent XSS
    const safeSenderName = escapeHtml(senderName.substring(0, 100));
    const safeDocumentName = escapeHtml(documentName.substring(0, 255));
    // For the URL, we validate it above but also escape for the HTML attribute
    const safeShareableLink = escapeHtml(shareableLink);

    // Send email via Microsoft Graph API with sanitized inputs
    const emailBody = {
      message: {
        subject: `${safeSenderName} shared a document with you: ${safeDocumentName}`,
        body: {
          contentType: 'HTML',
          content: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0078d4;">Document Shared With You</h2>
                <p><strong>${safeSenderName}</strong> has shared a document with you.</p>
                <p><strong>Document:</strong> ${safeDocumentName}</p>
                <p style="margin: 30px 0;">
                  <a href="${safeShareableLink}" 
                     style="background-color: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    View Document
                  </a>
                </p>
                <p style="color: #666; font-size: 14px;">
                  <em>Note: This link will expire based on the sharing settings.</em>
                </p>
              </body>
            </html>
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: recipientEmail,
            },
          },
        ],
      },
      saveToSentItems: true,
    };

    const sendResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailBody),
      }
    );

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      console.error('Send email error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
