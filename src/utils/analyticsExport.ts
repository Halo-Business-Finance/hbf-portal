/**
 * Analytics Export Utilities
 * Generates CSV and PDF reports for analytics data
 */

interface AnalyticsData {
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  fundedApplications: number;
  totalAmountRequested: number;
  totalAmountFunded: number;
  averageLoanAmount: number;
  applicationsByType: { name: string; value: number }[];
  applicationsByStatus: { name: string; value: number }[];
  monthlyTrend: { month: string; applications: number; funded: number }[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const escapeCSV = (value: string | number): string => {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportAnalyticsToCSV = (analytics: AnalyticsData) => {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString('en-US');

  // Header
  lines.push('HALO BUSINESS FINANCE - ANALYTICS REPORT');
  lines.push(`Generated on: ${date}`);
  lines.push('');

  // Key Metrics
  lines.push('KEY METRICS');
  lines.push('Metric,Value');
  lines.push(`Total Applications,${analytics.totalApplications}`);
  lines.push(`Approved Applications,${analytics.approvedApplications}`);
  lines.push(`Rejected Applications,${analytics.rejectedApplications}`);
  lines.push(`Pending Applications,${analytics.pendingApplications}`);
  lines.push(`Funded Applications,${analytics.fundedApplications}`);
  lines.push(`Total Amount Requested,${escapeCSV(formatCurrency(analytics.totalAmountRequested))}`);
  lines.push(`Total Amount Funded,${escapeCSV(formatCurrency(analytics.totalAmountFunded))}`);
  lines.push(`Average Loan Amount,${escapeCSV(formatCurrency(analytics.averageLoanAmount))}`);
  
  const approvalRate = analytics.totalApplications > 0 
    ? ((analytics.approvedApplications / analytics.totalApplications) * 100).toFixed(1) 
    : '0';
  const fundingRate = analytics.totalApplications > 0 
    ? ((analytics.fundedApplications / analytics.totalApplications) * 100).toFixed(1) 
    : '0';
  lines.push(`Approval Rate,${approvalRate}%`);
  lines.push(`Funding Rate,${fundingRate}%`);
  lines.push('');

  // Applications by Status
  lines.push('APPLICATIONS BY STATUS');
  lines.push('Status,Count');
  analytics.applicationsByStatus.forEach(item => {
    lines.push(`${escapeCSV(item.name)},${item.value}`);
  });
  lines.push('');

  // Applications by Type
  lines.push('APPLICATIONS BY LOAN TYPE');
  lines.push('Loan Type,Count');
  analytics.applicationsByType.forEach(item => {
    lines.push(`${escapeCSV(item.name)},${item.value}`);
  });
  lines.push('');

  // Monthly Trend
  lines.push('MONTHLY TREND (LAST 6 MONTHS)');
  lines.push('Month,Applications,Funded');
  analytics.monthlyTrend.forEach(item => {
    lines.push(`${item.month},${item.applications},${item.funded}`);
  });

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const exportAnalyticsToPDF = (analytics: AnalyticsData) => {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const approvalRate = analytics.totalApplications > 0 
    ? ((analytics.approvedApplications / analytics.totalApplications) * 100).toFixed(1) 
    : '0';
  const fundingRate = analytics.totalApplications > 0 
    ? ((analytics.fundedApplications / analytics.totalApplications) * 100).toFixed(1) 
    : '0';

  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to download the PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Report - ${date}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 900px;
          margin: 0 auto;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #1e3a5f;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #1e3a5f;
          margin: 0 0 5px 0;
          font-size: 28px;
        }
        .header h2 {
          color: #666;
          margin: 0;
          font-weight: normal;
          font-size: 18px;
        }
        .header .date {
          color: #999;
          font-size: 14px;
          margin-top: 10px;
        }
        .section {
          margin: 30px 0;
          page-break-inside: avoid;
        }
        .section h3 {
          color: #1e3a5f;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
          font-size: 18px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .metric-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .metric-card .value {
          font-size: 28px;
          font-weight: bold;
          color: #1e3a5f;
        }
        .metric-card .label {
          font-size: 12px;
          color: #64748b;
          margin-top: 5px;
          text-transform: uppercase;
        }
        .metric-card.success .value { color: #16a34a; }
        .metric-card.warning .value { color: #d97706; }
        .metric-card.info .value { color: #7c3aed; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background: #f1f5f9;
          font-weight: 600;
          color: #475569;
          font-size: 12px;
          text-transform: uppercase;
        }
        td {
          color: #334155;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          background: #f8fafc;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        .summary-row .label {
          color: #64748b;
        }
        .summary-row .value {
          font-weight: 600;
          color: #1e3a5f;
        }
        .footer {
          text-align: center;
          color: #999;
          font-size: 12px;
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        @media print {
          body { padding: 20px; }
          .metrics-grid { grid-template-columns: repeat(4, 1fr); }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>HALO BUSINESS FINANCE</h1>
        <h2>Analytics Report</h2>
        <div class="date">Generated on ${date}</div>
      </div>

      <div class="section">
        <h3>Key Performance Metrics</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="value">${analytics.totalApplications}</div>
            <div class="label">Total Applications</div>
          </div>
          <div class="metric-card success">
            <div class="value">${analytics.approvedApplications}</div>
            <div class="label">Approved</div>
          </div>
          <div class="metric-card warning">
            <div class="value">${analytics.pendingApplications}</div>
            <div class="label">Pending Review</div>
          </div>
          <div class="metric-card info">
            <div class="value">${analytics.fundedApplications}</div>
            <div class="label">Funded</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Financial Summary</h3>
        <div class="summary-row">
          <span class="label">Total Amount Requested</span>
          <span class="value">${formatCurrency(analytics.totalAmountRequested)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Total Amount Funded</span>
          <span class="value" style="color: #16a34a;">${formatCurrency(analytics.totalAmountFunded)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Average Loan Amount</span>
          <span class="value">${formatCurrency(analytics.averageLoanAmount)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Approval Rate</span>
          <span class="value">${approvalRate}%</span>
        </div>
        <div class="summary-row">
          <span class="label">Funding Rate</span>
          <span class="value" style="color: #7c3aed;">${fundingRate}%</span>
        </div>
      </div>

      <div class="section">
        <h3>Applications by Status</h3>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.applicationsByStatus.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.value}</td>
                <td>${analytics.totalApplications > 0 ? ((item.value / analytics.totalApplications) * 100).toFixed(1) : 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Applications by Loan Type</h3>
        <table>
          <thead>
            <tr>
              <th>Loan Type</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.applicationsByType.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.value}</td>
                <td>${analytics.totalApplications > 0 ? ((item.value / analytics.totalApplications) * 100).toFixed(1) : 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Monthly Application Trend</h3>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Applications</th>
              <th>Funded</th>
              <th>Conversion Rate</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.monthlyTrend.map(item => `
              <tr>
                <td>${item.month}</td>
                <td>${item.applications}</td>
                <td>${item.funded}</td>
                <td>${item.applications > 0 ? ((item.funded / item.applications) * 100).toFixed(1) : 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>This is a computer-generated report from Halo Business Finance.</p>
        <p>For questions, please contact support.</p>
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
