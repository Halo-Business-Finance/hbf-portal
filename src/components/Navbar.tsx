import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { LogOut, FileText, Bell, Search, ChevronDown, Grid3X3, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { LoanCalculatorDialog } from '@/components/LoanCalculatorDialog';
import { userNotificationService, Notification } from '@/services/userNotificationService';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
interface SearchResult {
  id: string;
  type: 'application' | 'document';
  title: string;
  subtitle: string;
  url: string;
}
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    if (authenticated) {
      loadNotifications();
      const unsubscribe = userNotificationService.subscribeToNotifications(() => {
        loadNotifications();
      });
      return unsubscribe;
    }
  }, [authenticated]);
  useEffect(() => {
    if (!searchQuery.trim() || !authenticated) {
      setSearchResults([]);
      return;
    }
    const searchTimeout = setTimeout(async () => {
      await performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(searchTimeout);
  }, [searchQuery, authenticated]);
  const sanitizeSearchQuery = (query: string): string => {
    const limited = query.slice(0, 100);
    const escapedBackslashes = limited.replace(/\\/g, '\\\\');
    const escapedWildcards = escapedBackslashes.replace(/[%_]/g, '\\$&');
    return escapedWildcards.replace(/[(),.'"\[\]{}|\\^$*+?]/g, '');
  };
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results: SearchResult[] = [];
      const sanitizedQuery = sanitizeSearchQuery(query);
      if (!sanitizedQuery) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      const {
        data: applications
      } = await supabase.from('loan_applications').select('id, application_number, business_name, first_name, last_name, loan_type, status').or(`business_name.ilike.%${sanitizedQuery}%,first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,application_number.ilike.%${sanitizedQuery}%`).limit(5);
      if (applications) {
        applications.forEach(app => {
          results.push({
            id: app.id,
            type: 'application',
            title: app.business_name || `${app.first_name} ${app.last_name}`,
            subtitle: `#${app.application_number} · ${app.loan_type} · ${app.status}`,
            url: isAdmin() ? `/admin/applications/${app.id}` : '/loan-applications'
          });
        });
      }
      const {
        data: documents
      } = await supabase.from('borrower_documents').select('id, file_name, document_category, uploaded_at').ilike('file_name', `%${sanitizedQuery}%`).eq('is_latest_version', true).limit(5);
      if (documents) {
        documents.forEach(doc => {
          results.push({
            id: doc.id,
            type: 'document',
            title: doc.file_name,
            subtitle: `${doc.document_category} · ${new Date(doc.uploaded_at).toLocaleDateString()}`,
            url: '/my-documents'
          });
        });
      }
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };
  const handleSearchSelect = (result: SearchResult) => {
    navigate(result.url);
    setSearchOpen(false);
    setSearchQuery('');
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
      {/* Top Bar - Thin white bar like US Bank */}
      <div className="h-8 bg-white border-b border-border hidden md:flex items-center justify-between px-6">
        <span className="text-sm text-blue-950 font-extrabold">Commercial Loan Marketplace </span>
        <button className="flex items-center gap-2 text-sm hover:underline text-blue-950 font-extrabold">
          <Grid3X3 className="h-4 w-4" />
          Business tools
        </button>
      </div>

      {/* Main Header Bar */}
      <div className="h-14 md:h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="cursor-pointer flex-shrink-0" onClick={handleLogoClick}>
          <span className="font-bold text-lg md:text-xl tracking-tight text-black">HHalo Business Finance  
          </span>
        </div>

        {/* Center Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary rounded-full p-1.5">
                  <Search className="h-3.5 w-3.5 text-white" />
                </div>
                <Input placeholder="How can we help you?" className="pl-12 pr-4 h-10 border-border rounded-full bg-muted/30" value={searchQuery} onChange={e => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }} onFocus={() => setSearchOpen(true)} />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-white border shadow-xl" align="center">
              <Command shouldFilter={false}>
                <CommandList className="max-h-[300px]">
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    {searching ? 'Searching...' : searchQuery ? 'No results found.' : 'Type to search...'}
                  </CommandEmpty>
                  {searchResults.length > 0 && <>
                      {searchResults.filter(r => r.type === 'application').length > 0 && <CommandGroup heading="Applications">
                          {searchResults.filter(r => r.type === 'application').map(result => <CommandItem key={result.id} onSelect={() => handleSearchSelect(result)} className="cursor-pointer py-3">
                              <FileText className="mr-3 h-4 w-4 text-primary" />
                              <div className="flex flex-col">
                                <span className="font-medium">{result.title}</span>
                                <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                              </div>
                            </CommandItem>)}
                        </CommandGroup>}
                      {searchResults.filter(r => r.type === 'document').length > 0 && <CommandGroup heading="Documents">
                          {searchResults.filter(r => r.type === 'document').map(result => <CommandItem key={result.id} onSelect={() => handleSearchSelect(result)} className="cursor-pointer py-3">
                              <FileText className="mr-3 h-4 w-4 text-accent" />
                              <div className="flex flex-col">
                                <span className="font-medium">{result.title}</span>
                                <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                              </div>
                            </CommandItem>)}
                        </CommandGroup>}
                    </>}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Search */}
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </Button>

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

          {/* Log out */}
          <button onClick={handleSignOut} className="hidden md:block text-sm text-foreground hover:text-primary transition-colors">
            Log out
          </button>

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

      {/* Sub Navigation Bar */}
      <div className="h-12 bg-white border-b border-border hidden md:flex items-center px-6 gap-1">
        {/* Dashboard */}
        <button onClick={() => navigate('/')} className={cn("px-4 py-2 text-sm font-medium transition-colors text-blue-700", isActiveRoute('/') ? "text-primary" : "text-foreground")}>
          Dashboard
        </button>

        {/* Applications */}
        <button onClick={() => navigate('/loan-applications')} className={cn("px-4 py-2 text-sm font-medium transition-colors hover:text-primary", isActiveRoute('/loan-applications') ? "text-primary" : "text-foreground")}>
          Applications
        </button>

        {/* Accounts Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
              Accounts
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white border shadow-xl">
            <DropdownMenuItem onClick={() => navigate('/bank-accounts')} className="cursor-pointer py-2.5">
              Bank Accounts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/existing-loans')} className="cursor-pointer py-2.5">
              Existing Loans
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/credit-reports')} className="cursor-pointer py-2.5">
              Credit Reports
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Documents Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
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

        {/* Tools Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
              Tools
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white border shadow-xl">
            <DropdownMenuItem onClick={() => navigate('/loan-calculator')} className="cursor-pointer py-2.5">
              Loan Calculator
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/credit-score-simulator')} className="cursor-pointer py-2.5">
              Credit Simulator
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Products & offers */}
        <button onClick={() => navigate('/support')} className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
          Products & offers
        </button>
      </div>

      <LoanCalculatorDialog open={calculatorOpen} onOpenChange={setCalculatorOpen} />
    </header>;
};
export default Navbar;