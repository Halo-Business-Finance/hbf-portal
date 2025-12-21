import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LogOut, KeyRound, UserCircle, FileText, Shield, HelpCircle, Bell, Calculator, BellRing, Search } from 'lucide-react';
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
  // Sanitize search input to prevent SQL injection via PostgREST operators
  const sanitizeSearchQuery = (query: string): string => {
    // Limit length to prevent abuse
    const limited = query.slice(0, 100);
    // Escape LIKE wildcards
    const escaped = limited.replace(/[%_]/g, '\\$&');
    // Remove PostgREST special characters that could be used for injection
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
    return <nav className="h-16 px-6 border-b border-border/50 bg-card/80 backdrop-blur-xl flex w-full justify-between items-center sticky top-0 z-50">
        <div className="flex items-center">
          <div className="w-32 h-8 skeleton-shimmer rounded-lg" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 skeleton-shimmer rounded-lg" />
        </div>
      </nav>;
  }
  return <nav className="h-16 px-4 lg:px-6 border-b border-border/50 bg-card/80 backdrop-blur-xl flex w-full items-center sticky top-0 z-50 gap-4">
      {/* Logo */}
      <div className="cursor-pointer flex items-center gap-2 group" onClick={handleLogoClick}>
        
        <span className="text-foreground font-bold text-lg tracking-tight hidden sm:block group-hover:text-primary transition-colors">
          Halo Business Finance
        </span>
        <span className="text-foreground font-bold text-lg tracking-tight sm:hidden">
          HBF
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search Bar - Desktop */}
      {authenticated && <div className="w-full max-w-md hidden md:block">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-muted-foreground font-normal", "bg-muted/50 border-transparent hover:bg-muted hover:border-border", "transition-all duration-200")} onClick={() => setSearchOpen(true)}>
                <Search className="mr-2 h-4 w-4 text-white" />
                <span className="text-white">Search applications, documents...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-popover border shadow-xl" align="center">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Search applications and documents..." value={searchQuery} onValueChange={setSearchQuery} className="border-0" />
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
                                  <span className="text-xs text-muted-foreground">
                                    {result.subtitle}
                                  </span>
                                </div>
                              </CommandItem>)}
                        </CommandGroup>}
                      {searchResults.filter(r => r.type === 'document').length > 0 && <CommandGroup heading="Documents">
                          {searchResults.filter(r => r.type === 'document').map(result => <CommandItem key={result.id} onSelect={() => handleSearchSelect(result)} className="cursor-pointer py-3">
                                <FileText className="mr-3 h-4 w-4 text-accent" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{result.title}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {result.subtitle}
                                  </span>
                                </div>
                              </CommandItem>)}
                        </CommandGroup>}
                    </>}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 text-black">
        {authenticated && <>
            {/* Mobile Search Button */}
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted relative">
                  <Bell className="h-5 w-5 text-yellow-400" />
                  {notificationCount > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>}
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-80 bg-popover border shadow-xl">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-xs text-muted-foreground">
                    {notificationCount > 0 ? `${notificationCount} unread` : 'All caught up!'}
                  </p>
                </div>
                
                <div className="max-h-[320px] overflow-y-auto">
                  {recentNotifications.length === 0 ? <div className="py-8 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div> : recentNotifications.map(notification => <DropdownMenuItem key={notification.id} className={cn("cursor-pointer py-3 px-4 border-b border-border/50 last:border-0", !notification.read && "bg-primary/5")} onClick={() => handleNotificationClick(notification)}>
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
                
                <div className="p-2 border-t border-border">
                  <Button variant="ghost" className="w-full text-sm h-9" onClick={() => navigate('/notifications')}>
                    View All Notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Calculator */}
            <Button variant="ghost" size="icon" onClick={() => setCalculatorOpen(true)} title="Loan Calculator" className="h-9 w-9 hover:bg-muted text-white">
              <Calculator className="h-[20px] w-[19px] text-white" />
            </Button>

            <LoanCalculatorDialog open={calculatorOpen} onOpenChange={setCalculatorOpen} />

            {/* Help */}
            <Button variant="ghost" size="icon" onClick={() => navigate('/support')} className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted hidden sm:flex">
              <HelpCircle className="h-5 w-5 text-white" />
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted">
                  <UserCircle className="h-5 w-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-xl">
                <DropdownMenuItem onClick={() => navigate('/my-account?tab=account')} className="cursor-pointer py-2.5">
                  <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
                  My Account
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate('/notification-preferences')} className="cursor-pointer py-2.5">
                  <BellRing className="w-4 h-4 mr-3 text-muted-foreground" />
                  Notification Preferences
                </DropdownMenuItem>

                {isAdmin() && <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer py-2.5">
                    <Shield className="w-4 h-4 mr-3 text-muted-foreground" />
                    Admin Dashboard
                  </DropdownMenuItem>}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate('/change-password')} className="cursor-pointer py-2.5">
                  <KeyRound className="w-4 h-4 mr-3 text-muted-foreground" />
                  Change Password
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer py-2.5 text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>}
      </div>
    </nav>;
};
export default Navbar;