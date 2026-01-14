import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LogOut, KeyRound, UserCircle, FileText, Shield, Bell, Calculator, BellRing, Search, ChevronDown, Phone, Lock } from 'lucide-react';
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

interface NavMenuItem {
  label: string;
  href: string;
  external?: boolean;
  children?: { label: string; href: string; external?: boolean }[];
}

const mainNavItems: NavMenuItem[] = [
  {
    label: 'Company',
    href: 'https://halobusinessfinance.com/about-us/',
    external: true,
    children: [
      { label: 'About Us', href: 'https://halobusinessfinance.com/about-us/', external: true },
      { label: 'Team', href: 'https://halobusinessfinance.com/team/', external: true },
      { label: 'Careers', href: 'https://halobusinessfinance.com/careers/', external: true },
      { label: 'Contact', href: 'https://halobusinessfinance.com/contact-us/', external: true },
    ],
  },
  {
    label: 'SBA Loans',
    href: 'https://halobusinessfinance.com/sba-loans/',
    external: true,
    children: [
      { label: 'SBA 7(a) Loans', href: 'https://halobusinessfinance.com/sba-7a-loans/', external: true },
      { label: 'SBA 504 Loans', href: 'https://halobusinessfinance.com/sba-504-loans/', external: true },
      { label: 'SBA Express Loans', href: 'https://halobusinessfinance.com/sba-express-loans/', external: true },
    ],
  },
  {
    label: 'USDA Loans',
    href: 'https://halobusinessfinance.com/usda-loans/',
    external: true,
    children: [
      { label: 'USDA B&I Loans', href: 'https://halobusinessfinance.com/usda-bi-loans/', external: true },
    ],
  },
  {
    label: 'Commercial Loans',
    href: 'https://halobusinessfinance.com/commercial-loans/',
    external: true,
    children: [
      { label: 'Term Loans', href: 'https://halobusinessfinance.com/term-loans/', external: true },
      { label: 'Bridge Loans', href: 'https://halobusinessfinance.com/bridge-loans/', external: true },
      { label: 'Working Capital', href: 'https://halobusinessfinance.com/working-capital/', external: true },
      { label: 'Business Lines of Credit', href: 'https://halobusinessfinance.com/business-lines-of-credit/', external: true },
    ],
  },
  {
    label: 'Equipment Financing',
    href: 'https://halobusinessfinance.com/equipment-financing/',
    external: true,
    children: [
      { label: 'Equipment Loans', href: 'https://halobusinessfinance.com/equipment-loans/', external: true },
      { label: 'Equipment Leasing', href: 'https://halobusinessfinance.com/equipment-leasing/', external: true },
    ],
  },
  {
    label: 'Capital Markets',
    href: 'https://halobusinessfinance.com/capital-markets/',
    external: true,
  },
  {
    label: 'Partners',
    href: 'https://halobusinessfinance.com/partners/',
    external: true,
    children: [
      { label: 'Referral Partners', href: 'https://halobusinessfinance.com/referral-partners/', external: true },
      { label: 'Broker Partners', href: 'https://halobusinessfinance.com/broker-partners/', external: true },
    ],
  },
  {
    label: 'Resources',
    href: 'https://halobusinessfinance.com/resources/',
    external: true,
    children: [
      { label: 'Blog', href: 'https://halobusinessfinance.com/blog/', external: true },
      { label: 'FAQs', href: 'https://halobusinessfinance.com/faqs/', external: true },
      { label: 'Glossary', href: 'https://halobusinessfinance.com/glossary/', external: true },
    ],
  },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { authenticated, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
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
    const escaped = limited.replace(/[%_]/g, '\\$&');
    return escaped.replace(/[(),.'"\[\]{}|\\^$*+?]/g, '');
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

      const { data: applications } = await supabase
        .from('loan_applications')
        .select('id, application_number, business_name, first_name, last_name, loan_type, status')
        .or(`business_name.ilike.%${sanitizedQuery}%,first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,application_number.ilike.%${sanitizedQuery}%`)
        .limit(5);

      if (applications) {
        applications.forEach((app) => {
          results.push({
            id: app.id,
            type: 'application',
            title: app.business_name || `${app.first_name} ${app.last_name}`,
            subtitle: `#${app.application_number} · ${app.loan_type} · ${app.status}`,
            url: isAdmin() ? `/admin/applications/${app.id}` : '/applications',
          });
        });
      }

      const { data: documents } = await supabase
        .from('borrower_documents')
        .select('id, file_name, document_category, uploaded_at')
        .ilike('file_name', `%${sanitizedQuery}%`)
        .eq('is_latest_version', true)
        .limit(5);

      if (documents) {
        documents.forEach((doc) => {
          results.push({
            id: doc.id,
            type: 'document',
            title: doc.file_name,
            subtitle: `${doc.document_category} · ${new Date(doc.uploaded_at).toLocaleDateString()}`,
            url: '/documents',
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

  const renderNavLink = (item: NavMenuItem) => {
    if (item.children && item.children.length > 0) {
      return (
        <DropdownMenu key={item.label}>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors">
              {item.label}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-white border shadow-lg min-w-[200px]">
            {item.children.map((child) => (
              <DropdownMenuItem key={child.label} asChild className="cursor-pointer">
                {child.external ? (
                  <a
                    href={child.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-3 py-2 text-sm text-slate-700 hover:text-primary hover:bg-slate-50"
                  >
                    {child.label}
                  </a>
                ) : (
                  <Link to={child.href} className="w-full px-3 py-2 text-sm text-slate-700 hover:text-primary hover:bg-slate-50">
                    {child.label}
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return item.external ? (
      <a
        key={item.label}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors"
      >
        {item.label}
      </a>
    ) : (
      <Link
        key={item.label}
        to={item.href}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors"
      >
        {item.label}
      </Link>
    );
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-50">
        <div className="h-12 bg-[#1a1f2e] flex items-center justify-between px-6">
          <div className="w-40 h-6 bg-white/10 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="w-24 h-6 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-12 bg-[#f0f2f5] flex items-center px-6">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-20 h-5 bg-slate-300 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar - Dark Navy */}
      <div className="h-12 bg-[#1a1f2e] flex items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <div className="cursor-pointer flex items-center" onClick={handleLogoClick}>
          <span className="text-white font-bold text-lg tracking-wide uppercase">
            HALO BUSINESS FINANCE
          </span>
        </div>

        {/* Right Side - Top Bar */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Search Icon */}
          {authenticated && (
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10">
                  <Search className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 bg-white border shadow-xl" align="end">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search applications and documents..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="border-0"
                  />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                      {searching ? 'Searching...' : searchQuery ? 'No results found.' : 'Type to search...'}
                    </CommandEmpty>
                    {searchResults.length > 0 && (
                      <>
                        {searchResults.filter((r) => r.type === 'application').length > 0 && (
                          <CommandGroup heading="Applications">
                            {searchResults
                              .filter((r) => r.type === 'application')
                              .map((result) => (
                                <CommandItem
                                  key={result.id}
                                  onSelect={() => handleSearchSelect(result)}
                                  className="cursor-pointer py-3"
                                >
                                  <FileText className="mr-3 h-4 w-4 text-primary" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{result.title}</span>
                                    <span className="text-xs text-slate-500">{result.subtitle}</span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        )}
                        {searchResults.filter((r) => r.type === 'document').length > 0 && (
                          <CommandGroup heading="Documents">
                            {searchResults
                              .filter((r) => r.type === 'document')
                              .map((result) => (
                                <CommandItem
                                  key={result.id}
                                  onSelect={() => handleSearchSelect(result)}
                                  className="cursor-pointer py-3"
                                >
                                  <FileText className="mr-3 h-4 w-4 text-accent" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{result.title}</span>
                                    <span className="text-xs text-slate-500">{result.subtitle}</span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        )}
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {/* Customer Support Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
                <Phone className="h-3.5 w-3.5" />
                <span>Customer Support</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border shadow-lg min-w-[200px]">
              <DropdownMenuItem asChild className="cursor-pointer">
                <a href="tel:1-800-555-0123" className="flex items-center gap-2 px-3 py-2">
                  <Phone className="h-4 w-4" />
                  1-800-555-0123
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/support')} className="cursor-pointer px-3 py-2">
                Support Center
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <a href="https://halobusinessfinance.com/contact-us/" target="_blank" rel="noopener noreferrer" className="px-3 py-2">
                  Contact Us
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sign In Button or User Menu */}
          {authenticated ? (
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 relative">
                    <Bell className="h-4 w-4" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-white border shadow-xl">
                  <div className="px-4 py-3 border-b">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    <p className="text-xs text-slate-500">
                      {notificationCount > 0 ? `${notificationCount} unread` : 'All caught up!'}
                    </p>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No notifications yet</p>
                      </div>
                    ) : (
                      recentNotifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={cn(
                            'cursor-pointer py-3 px-4 border-b last:border-0',
                            !notification.read && 'bg-primary/5'
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center gap-2">
                              {!notification.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                              <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-slate-400">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t">
                    <Button variant="ghost" className="w-full text-sm h-9" onClick={() => navigate('/notifications')}>
                      View All Notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Calculator */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalculatorOpen(true)}
                title="Loan Calculator"
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
              >
                <Calculator className="h-4 w-4" />
              </Button>
              <LoanCalculatorDialog open={calculatorOpen} onOpenChange={setCalculatorOpen} />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10">
                    <UserCircle className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border shadow-xl">
                  <DropdownMenuItem onClick={() => navigate('/my-account?tab=account')} className="cursor-pointer py-2.5">
                    <FileText className="w-4 h-4 mr-3 text-slate-500" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/notification-preferences')} className="cursor-pointer py-2.5">
                    <BellRing className="w-4 h-4 mr-3 text-slate-500" />
                    Notification Preferences
                  </DropdownMenuItem>
                  {isAdmin() && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer py-2.5">
                      <Shield className="w-4 h-4 mr-3 text-slate-500" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/change-password')} className="cursor-pointer py-2.5">
                    <KeyRound className="w-4 h-4 mr-3 text-slate-500" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer py-2.5 text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button
              onClick={() => navigate('/borrower-portal')}
              className="h-8 px-4 bg-transparent border border-primary text-primary hover:bg-primary hover:text-white rounded-full text-sm font-medium"
            >
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Bar - Light Gray Navigation */}
      <div className="h-12 bg-[#f0f2f5] border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
        {/* Main Navigation Links */}
        <nav className="hidden lg:flex items-center">
          {mainNavItems.map((item) => renderNavLink(item))}
        </nav>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 px-3 text-slate-700">
                Menu
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-white border shadow-lg">
              {mainNavItems.map((item) => (
                <DropdownMenuItem key={item.label} asChild className="cursor-pointer">
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="w-full">
                      {item.label}
                    </a>
                  ) : (
                    <Link to={item.href} className="w-full">
                      {item.label}
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Get Started Button */}
        <Button
          onClick={() => navigate('/borrower-portal')}
          className="h-8 px-5 bg-primary hover:bg-primary/90 text-white rounded-full text-sm font-medium"
        >
          <Lock className="h-3.5 w-3.5 mr-1.5" />
          Get Started
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
