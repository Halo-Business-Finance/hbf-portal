import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, FileText, Bell, ChevronDown, Grid3X3, HelpCircle, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { LoanCalculatorDialog } from '@/components/LoanCalculatorDialog';
import { LoanTypeSelector } from '@/components/dashboard/LoanTypeSelector';
import { userNotificationService, Notification } from '@/services/userNotificationService';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    authenticated,
    loading,
    signOut
  } = useAuth();
  const {
    isAdmin
  } = useUserRole();
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [loanSelectorOpen, setLoanSelectorOpen] = useState(false);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  useEffect(() => {
    if (authenticated) {
      loadNotifications();
      loadLastLogin();
      const unsubscribe = userNotificationService.subscribeToNotifications(() => {
        loadNotifications();
      });
      return unsubscribe;
    }
  }, [authenticated]);

  const loadLastLogin = () => {
    const stored = localStorage.getItem('hbf_last_login');
    if (stored) {
      setLastLogin(new Date(stored).toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) + ' CT');
    }
  };
  const loadNotifications = async () => {
    try {
      const count = await userNotificationService.getUnreadCount();
      setNotificationCount(count);
      const notifications = await userNotificationService.getUserNotifications(5);
      setRecentNotifications(notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await userNotificationService.markAsRead(notification.id);
      loadNotifications();
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const handleLogoClick = () => {
    navigate('/');
  };
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };
  if (loading) {
    return <header className="sticky top-0 z-50">
        <div className="h-8 bg-white border-b flex items-center px-6">
          <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-14 bg-white border-b flex items-center justify-between px-6">
          <div className="w-40 h-6 bg-slate-200 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="w-48 h-8 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-12 bg-white border-b flex items-center px-6">
          <div className="flex gap-6">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-20 h-4 bg-slate-200 rounded animate-pulse" />)}
          </div>
        </div>
      </header>;
  }

  // Unauthenticated simple header
  if (!authenticated) {
    return <header className="sticky top-0 z-50">
        <div className="h-12 md:h-14 bg-black flex items-center justify-center px-4">
          <span className="text-white font-bold text-lg md:text-xl tracking-wide uppercase cursor-pointer" onClick={handleLogoClick}>
            HALO BUSINESS FINANCE
          </span>
        </div>
      </header>;
  }
  return <header className="sticky top-0 z-50">
      {/* Main Header Bar */}
      <div className="h-14 md:h-16 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Commercial Loan Marketplace */}
        <div className="flex flex-col cursor-pointer" onClick={handleLogoClick}>
          <span className="font-bold text-base md:text-xl tracking-tight text-black">HALO BUSINESS FINANCE</span>
          
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                <span className="hidden md:inline text-sm">Notifications</span>
                {notificationCount > 0 && <span className="h-5 w-5 md:h-6 md:w-6 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>}
                <Bell className="h-5 w-5 md:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white border shadow-xl">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  {notificationCount > 0 ? `${notificationCount} unread` : 'All caught up!'}
                </p>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {recentNotifications.length === 0 ? <div className="py-8 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div> : recentNotifications.map(notification => <DropdownMenuItem key={notification.id} className={cn('cursor-pointer py-3 px-4 border-b last:border-0', !notification.read && 'bg-primary/5')} onClick={() => handleNotificationClick(notification)}>
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2">
                          {!notification.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                          <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground/70">
                          {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true
                      })}
                        </p>
                      </div>
                    </DropdownMenuItem>)}
              </div>
              <div className="p-2 border-t">
                <Button variant="ghost" className="w-full text-sm h-9" onClick={() => navigate('/notifications')}>
                  View All Notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile & Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors">
                Profile & settings
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border shadow-xl">
              <DropdownMenuItem onClick={() => navigate('/my-account')} className="cursor-pointer py-2.5">
                My Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/notification-preferences')} className="cursor-pointer py-2.5">
                Notification Preferences
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/change-password')} className="cursor-pointer py-2.5">
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/two-factor-auth')} className="cursor-pointer py-2.5">
                Security Settings
              </DropdownMenuItem>
              {isAdmin() && <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer py-2.5">
                    Admin Dashboard
                  </DropdownMenuItem>
                </>}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Need Help */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors">
                Need help?
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border shadow-xl">
              <DropdownMenuItem onClick={() => navigate('/support')} className="cursor-pointer py-2.5">
                Support Center
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                <a href="tel:1-800-555-0123">Call Us</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                <a href="https://halobusinessfinance.com/contact-us/" target="_blank" rel="noopener noreferrer">
                  Contact Us
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Log out with Last Login */}
          <div className="hidden md:flex flex-col items-end -mb-1">
            <button onClick={handleSignOut} className="text-sm text-foreground hover:text-primary transition-colors">
              Log out
            </button>
            {lastLogin && (
              <span className="text-[10px] text-muted-foreground -mt-0.5">
                Last login: {lastLogin}
              </span>
            )}
          </div>

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border shadow-xl">
              <DropdownMenuItem onClick={() => navigate('/my-account')} className="cursor-pointer py-3">
                My Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/notification-preferences')} className="cursor-pointer py-3">
                Notification Preferences
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/support')} className="cursor-pointer py-3">
                Support Center
              </DropdownMenuItem>
              {isAdmin() && <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer py-3">
                  Admin Dashboard
                </DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer py-3 text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="h-12 bg-white border-b border-border hidden md:block">
        <div className="max-w-7xl mx-auto h-full flex items-center px-4 sm:px-6 lg:px-8 gap-1">
        {/* Dashboard */}
        <div className="relative h-full flex items-center">
          <button onClick={() => navigate('/')} className={cn("pl-0 pr-4 py-2 text-sm font-medium transition-colors", isActiveRoute('/') ? "text-primary" : "text-foreground hover:text-primary")}>
            Dashboard
          </button>
          {isActiveRoute('/') && <span className="absolute bottom-2 left-0 right-4 h-0.5 bg-primary rounded-full" />}
        </div>

        {/* New Loan Application Button */}
        <div className="relative h-full flex items-center">
          <button 
            onClick={() => setLoanSelectorOpen(true)}
            className={cn("flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors text-foreground hover:text-primary")}
          >
            <Plus className="h-4 w-4" />
            New Loan Application
          </button>
        </div>

        {/* Existing Loans - Direct Link */}
        <div className="relative h-full flex items-center">
          <button 
            onClick={() => navigate('/existing-loans')}
            className={cn("flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors", location.pathname === '/existing-loans' ? "text-primary" : "text-foreground hover:text-primary")}
          >
            Existing Loans
          </button>
          {location.pathname === '/existing-loans' && <span className="absolute bottom-2 left-4 right-4 h-0.5 bg-primary rounded-full" />}
        </div>

        {/* Accounts Dropdown */}
        <div className="relative h-full flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors", location.pathname === '/bank-accounts' ? "text-primary" : "text-foreground hover:text-primary")}>
                Bank Accounts
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-white border shadow-xl">
              <DropdownMenuItem onClick={() => navigate('/bank-accounts?type=business')} className="cursor-pointer py-2.5">
                Business Accounts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/bank-accounts?type=personal')} className="cursor-pointer py-2.5">
                Personal Accounts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {location.pathname === '/bank-accounts' && <span className="absolute bottom-2 left-4 right-4 h-0.5 bg-primary rounded-full" />}
        </div>

        {/* Documents Dropdown */}
        <div className="relative h-full flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors", location.pathname === '/my-documents' || location.pathname === '/document-storage' ? "text-primary" : "text-foreground hover:text-primary")}>
                Documents
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-white border shadow-xl">
              <DropdownMenuItem onClick={() => navigate('/my-documents')} className="cursor-pointer py-2.5">
                My Documents
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/my-documents?upload=true')} className="cursor-pointer py-2.5">
                Upload Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {(location.pathname === '/my-documents' || location.pathname === '/document-storage') && <span className="absolute bottom-2 left-4 right-4 h-0.5 bg-primary rounded-full" />}
        </div>

        {/* Business Tools Dropdown */}
        <div className="relative h-full flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors", location.pathname === '/credit-reports' || location.pathname === '/loan-calculator' || location.pathname === '/credit-score-simulator' ? "text-primary" : "text-foreground hover:text-primary")}>
                <Grid3X3 className="h-4 w-4" />
                Business Tools
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-white border shadow-xl">
              <DropdownMenuItem onClick={() => navigate('/credit-reports?type=business')} className="cursor-pointer py-2.5">
                Business Credit Reports
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/credit-reports?type=personal')} className="cursor-pointer py-2.5">
                Personal Credit Reports
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/loan-calculator')} className="cursor-pointer py-2.5">
                Business Calculator
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/credit-score-simulator')} className="cursor-pointer py-2.5">
                Credit Simulator
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/credit-reports')} className="cursor-pointer py-2.5">
                Financial Reports
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {(location.pathname === '/credit-reports' || location.pathname === '/loan-calculator' || location.pathname === '/credit-score-simulator') && <span className="absolute bottom-2 left-4 right-4 h-0.5 bg-primary rounded-full" />}
        </div>
        </div>
      </div>

      <LoanCalculatorDialog open={calculatorOpen} onOpenChange={setCalculatorOpen} />
      <LoanTypeSelector 
        open={loanSelectorOpen} 
        onClose={() => setLoanSelectorOpen(false)} 
        onSelect={(id) => console.log('Selected loan type:', id)} 
      />
    </header>;
};
export default Navbar;