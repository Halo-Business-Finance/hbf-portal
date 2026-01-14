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
const Navbar = () => {
  const navigate = useNavigate();
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
            url: isAdmin() ? `/admin/applications/${app.id}` : '/applications'
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
            url: '/documents'
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
  if (loading) {
    return <header className="sticky top-0 z-50">
        <div className="h-12 bg-[#1a1f2e] flex items-center justify-between px-6">
          <div className="w-40 h-6 bg-white/10 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="w-24 h-6 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-12 bg-[#f0f2f5] flex items-center px-6">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-20 h-5 bg-slate-300 rounded animate-pulse" />)}
          </div>
        </div>
      </header>;
  }
  return <header className="sticky top-0 z-50">
      {/* Top Bar - Dark Navy */}
      <div className="min-h-[48px] md:min-h-[52px] flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2 bg-black text-white">
        {/* Logo */}
        <div className="cursor-pointer flex items-center flex-shrink-0" onClick={handleLogoClick}>
          <span className="text-white font-bold text-xs sm:text-lg lg:text-xl tracking-wide uppercase whitespace-nowrap">
            HALO BUSINESS FINANCE
          </span>
        </div>

        {/* Right Side - Top Bar */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {/* Search Icon */}
          {authenticated && <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 text-white/80 hover:text-white hover:bg-white/10">
                  <Search className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-24px)] sm:w-[400px] p-0 bg-white border shadow-xl" align="end">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Search applications and documents..." value={searchQuery} onValueChange={setSearchQuery} className="border-0" />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                      {searching ? 'Searching...' : searchQuery ? 'No results found.' : 'Type to search...'}
                    </CommandEmpty>
                    {searchResults.length > 0 && <>
                        {searchResults.filter(r => r.type === 'application').length > 0 && <CommandGroup heading="Applications">
                            {searchResults.filter(r => r.type === 'application').map(result => <CommandItem key={result.id} onSelect={() => handleSearchSelect(result)} className="cursor-pointer py-3">
                                  <FileText className="mr-3 h-4 w-4 text-primary" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{result.title}</span>
                                    <span className="text-xs text-slate-500">{result.subtitle}</span>
                                  </div>
                                </CommandItem>)}
                          </CommandGroup>}
                        {searchResults.filter(r => r.type === 'document').length > 0 && <CommandGroup heading="Documents">
                            {searchResults.filter(r => r.type === 'document').map(result => <CommandItem key={result.id} onSelect={() => handleSearchSelect(result)} className="cursor-pointer py-3">
                                  <FileText className="mr-3 h-4 w-4 text-accent" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{result.title}</span>
                                    <span className="text-xs text-slate-500">{result.subtitle}</span>
                                  </div>
                                </CommandItem>)}
                          </CommandGroup>}
                      </>}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>}

          {/* Customer Support Dropdown - Icon only on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors p-2 sm:p-0 min-h-[36px] sm:min-h-0">
                <Phone className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-white" />
                <span className="hidden sm:inline">Customer Support</span>
                <ChevronDown className="h-3 w-3 hidden sm:inline" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border shadow-lg min-w-[200px] z-50">
              <DropdownMenuItem asChild className="cursor-pointer text-slate-700 hover:bg-slate-100 focus:bg-slate-100 transition-colors">
                <a href="tel:1-800-555-0123" className="flex items-center gap-2 px-3 py-3 sm:py-2 text-slate-700">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span>1-800-555-0123</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/support')} className="cursor-pointer px-3 py-3 sm:py-2 text-slate-700 hover:bg-slate-100 focus:bg-slate-100 transition-colors">
                <span>Support Center</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer text-slate-700 hover:bg-slate-100 focus:bg-slate-100 transition-colors">
                <a href="https://halobusinessfinance.com/contact-us/" target="_blank" rel="noopener noreferrer" className="px-3 py-3 sm:py-2 text-slate-700">
                  <span>Contact Us</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="hidden sm:block" />
              <div className="hidden sm:flex px-3 py-2 text-[10px] text-slate-400 items-center gap-2">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">↑↓</kbd>
                  <span>navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">↵</kbd>
                  <span>select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">esc</kbd>
                  <span>close</span>
                </span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sign In Button or User Menu */}
          {authenticated ? <div className="flex items-center gap-1 sm:gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 text-white/80 hover:text-white hover:bg-white/10 relative">
                    <Bell className="h-4 w-4" />
                    {notificationCount > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[calc(100vw-24px)] sm:w-80 bg-white border shadow-xl">
                  <div className="px-4 py-3 border-b">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    <p className="text-xs text-slate-500">
                      {notificationCount > 0 ? `${notificationCount} unread` : 'All caught up!'}
                    </p>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {recentNotifications.length === 0 ? <div className="py-8 text-center">
                        <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No notifications yet</p>
                      </div> : recentNotifications.map(notification => <DropdownMenuItem key={notification.id} className={cn('cursor-pointer py-3 px-4 border-b last:border-0', !notification.read && 'bg-primary/5')} onClick={() => handleNotificationClick(notification)}>
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center gap-2">
                              {!notification.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                              <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-slate-400">
                              {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true
                      })}
                            </p>
                          </div>
                        </DropdownMenuItem>)}
                  </div>
                  <div className="p-2 border-t">
                    <Button variant="ghost" className="w-full text-sm h-10 sm:h-9" onClick={() => navigate('/notifications')}>
                      View All Notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Calculator */}
              <Button variant="ghost" size="icon" onClick={() => setCalculatorOpen(true)} title="Loan Calculator" className="h-9 w-9 sm:h-8 sm:w-8 text-white/80 hover:text-white hover:bg-white/10">
                <Calculator className="h-4 w-4" />
              </Button>
              <LoanCalculatorDialog open={calculatorOpen} onOpenChange={setCalculatorOpen} />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 text-white/80 hover:text-white hover:bg-white/10">
                    <UserCircle className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[calc(100vw-24px)] sm:w-56 bg-white border shadow-xl z-50">
                  <DropdownMenuItem onClick={() => navigate('/my-account?tab=account')} className="cursor-pointer py-3 sm:py-2.5 text-slate-700 hover:bg-slate-100 focus:bg-slate-100 transition-colors">
                    <FileText className="w-4 h-4 mr-3 text-slate-500" />
                    <span>My Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/notification-preferences')} className="cursor-pointer py-3 sm:py-2.5 text-slate-700 hover:bg-slate-100 focus:bg-slate-100 transition-colors">
                    <BellRing className="w-4 h-4 mr-3 text-slate-500" />
                    <span>Notification Preferences</span>
                  </DropdownMenuItem>
                  {isAdmin() && <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer py-3 sm:py-2.5 text-slate-700 hover:bg-slate-100 focus:bg-slate-100 transition-colors">
                      <Shield className="w-4 h-4 mr-3 text-slate-500" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/change-password')} className="cursor-pointer py-3 sm:py-2.5 text-slate-700 hover:bg-slate-100 focus:bg-slate-100 transition-colors">
                    <KeyRound className="w-4 h-4 mr-3 text-slate-500" />
                    <span>Change Password</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer py-3 sm:py-2.5 text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600 transition-colors">
                    <LogOut className="w-4 h-4 mr-3" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="hidden sm:block" />
                  <div className="hidden sm:flex px-3 py-2 text-[10px] text-slate-400 items-center gap-2">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">↑↓</kbd>
                      <span>navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">↵</kbd>
                      <span>select</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">esc</kbd>
                      <span>close</span>
                    </span>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div> : <Button onClick={() => navigate('/borrower-portal')} className="h-9 sm:h-8 px-3 sm:px-4 bg-transparent border border-primary text-primary hover:bg-primary hover:text-white rounded-full text-sm font-medium">
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden xs:inline">Sign In</span>
              <span className="xs:hidden">Login</span>
            </Button>}
        </div>
      </div>
    </header>;
};
export default Navbar;