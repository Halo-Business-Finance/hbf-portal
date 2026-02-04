import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbSegment {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  'applications': 'Loan Applications',
  'documents': 'My Documents',
  'bank-accounts': 'Bank Accounts',
  'existing-loans': 'Existing Loans',
  'credit-reports': 'Credit Reports',
  'credit-score-simulator': 'Credit Score Simulator',
  'notifications': 'Notifications',
  'notification-preferences': 'Notification Preferences',
  'calculator': 'Loan Calculator',
  'support': 'Support',
  'change-password': 'Change Password',
  'change-email': 'Change Email',
  'two-factor-auth': 'Two Factor Authentication',
  'admin': 'Admin',
  'dashboard': 'Dashboard',
  'all-applications': 'All Applications',
  'analytics': 'Analytics',
  'loan-products': 'Loan Products',
  'user-management': 'User Management',
  'support-tickets': 'Support Tickets',
  'system-settings': 'System Settings',
  'export-data': 'Export Data',
  'database-management': 'Database Management',
  'api-integrations': 'API Integrations',
  'payment-management': 'Payment Management',
  'existing-loans-management': 'Existing Loans Management',
  'security-audit': 'Security Audit',
  'review': 'Application Review',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on home page
  if (pathSegments.length === 0) {
    return null;
  }

  const breadcrumbs: BreadcrumbSegment[] = [
    { label: 'Home', path: '/' }
  ];

  // Build breadcrumb trail
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip dynamic IDs (UUIDs) in breadcrumbs
    if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      breadcrumbs.push({
        label: 'Details',
        path: currentPath
      });
    } else {
      breadcrumbs.push({
        label: routeLabels[segment] || segment.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        path: currentPath
      });
    }
  });

  return (
    <div className="border-b bg-muted/30">
      <div className="max-w-7xl mx-auto px-[30px] sm:px-6 lg:px-[34px] py-2">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              
              return (
                <div key={crumb.path} className="flex items-center">
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link 
                          to={crumb.path}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          {index === 0 && <Home className="h-4 w-4" />}
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  )}
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};
