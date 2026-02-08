/**
 * Generates a PDF for a loan application
 * Note: This is a basic HTML-to-print implementation
 * For production, consider using jsPDF or pdfmake
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * when inserting user-controlled content into HTML templates.
 */
function escapeHtml(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

interface ApplicationData {
  application_number: string;
  loan_type: string;
  amount_requested: number;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  business_name: string;
  business_address: string;
  business_city: string;
  business_state: string;
  business_zip: string;
  years_in_business: number;
  application_started_date: string;
  application_submitted_date: string;
  loan_details: any;
}

export const generateApplicationPDF = (application: ApplicationData) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLoanTypeDisplay = (loanType: string) => {
    const types: Record<string, string> = {
      refinance: 'Refinance of Property',
      bridge_loan: 'Bridge Loan',
      purchase: 'Purchase of Property',
      franchise: 'Franchise Loan',
      factoring: 'Factoring Loan',
      working_capital: 'Working Capital Loan'
    };
    return types[loanType] || loanType;
  };

  // Create a new window with the application details
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to download the PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Loan Application ${application.application_number}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #003366;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #003366;
          margin: 0;
        }
        .header p {
          color: #666;
          margin: 5px 0;
        }
        .section {
          margin: 30px 0;
        }
        .section h2 {
          color: #003366;
          border-bottom: 1px solid #ccc;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .field {
          display: flex;
          margin: 10px 0;
          padding: 10px;
          background: #f9f9f9;
        }
        .field-label {
          font-weight: bold;
          width: 200px;
          color: #333;
        }
        .field-value {
          flex: 1;
          color: #666;
        }
        .status {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-draft { background: #f0f0f0; color: #666; }
        .status-submitted { background: #e8f5e9; color: #2e7d32; }
        .status-under_review { background: #fff3e0; color: #e65100; }
        .status-approved { background: #e8f5e9; color: #1b5e20; }
        .status-rejected { background: #ffebee; color: #c62828; }
        .status-funded { background: #e3f2fd; color: #0d47a1; }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Halo Business Finance</h1>
        <p>Loan Application</p>
        <p style="font-size: 14px; color: #999;">Application Number: ${escapeHtml(application.application_number)}</p>
      </div>

      <div class="section">
        <h2>Application Status</h2>
        <div class="field">
          <div class="field-label">Status:</div>
          <div class="field-value">
            <span class="status status-${escapeHtml(application.status)}">${escapeHtml(application.status?.replace('_', ' '))}</span>
          </div>
        </div>
        <div class="field">
          <div class="field-label">Application Type:</div>
          <div class="field-value">${escapeHtml(getLoanTypeDisplay(application.loan_type))}</div>
        </div>
        <div class="field">
          <div class="field-label">Requested Amount:</div>
          <div class="field-value">${formatCurrency(application.amount_requested)}</div>
        </div>
      </div>

      <div class="section">
        <h2>Applicant Information</h2>
        <div class="field">
          <div class="field-label">Name:</div>
          <div class="field-value">${escapeHtml(application.first_name)} ${escapeHtml(application.last_name)}</div>
        </div>
        <div class="field">
          <div class="field-label">Email:</div>
          <div class="field-value">${escapeHtml(application.email) || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="field-label">Phone:</div>
          <div class="field-value">${escapeHtml(application.phone) || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <h2>Business Information</h2>
        <div class="field">
          <div class="field-label">Business Name:</div>
          <div class="field-value">${escapeHtml(application.business_name)}</div>
        </div>
        <div class="field">
          <div class="field-label">Address:</div>
          <div class="field-value">
            ${escapeHtml(application.business_address)}<br>
            ${escapeHtml(application.business_city)}, ${escapeHtml(application.business_state)} ${escapeHtml(application.business_zip)}
          </div>
        </div>
        <div class="field">
          <div class="field-label">Years in Business:</div>
          <div class="field-value">${application.years_in_business} years</div>
        </div>
      </div>

      <div class="section">
        <h2>Important Dates</h2>
        <div class="field">
          <div class="field-label">Application Started:</div>
          <div class="field-value">${formatDate(application.application_started_date)}</div>
        </div>
        ${application.application_submitted_date ? `
          <div class="field">
            <div class="field-label">Application Submitted:</div>
            <div class="field-value">${formatDate(application.application_submitted_date)}</div>
          </div>
        ` : ''}
      </div>

      <div class="section">
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd;">
          This is a computer-generated document. For questions, please contact Halo Business Finance support.
        </p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
