import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Wallet, FolderOpen, CreditCard, Landmark, Lock, Menu, LayoutDashboard, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
const items = [{
  title: 'Dashboard',
  url: '/',
  icon: LayoutDashboard
}, {
  title: 'Loan Applications',
  url: '/loan-applications',
  icon: FileText
}, {
  title: 'Existing Loans',
  url: '/existing-loans',
  icon: Wallet
}, {
  title: 'Loan Documents',
  url: '/document-storage',
  icon: FolderOpen
}, {
  title: 'Credit Reports',
  url: '/credit-reports',
  icon: CreditCard
}, {
  title: 'Bank Accounts',
  url: '/bank-accounts',
  icon: Landmark
}];
const adminItems = [{
  title: 'Admin Portal',
  url: '/admin',
  icon: Shield
}];
export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isAdmin
  } = useUserRole();
  const {
    signOut,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    open,
    toggleSidebar
  } = useSidebar();
  const currentPath = location.pathname;
  const [firstName, setFirstName] = useState<string>('');
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;
      try {
        const {
          data: profileData
        } = await supabase.from('profiles').select('first_name').eq('id', user.id).maybeSingle();
        if (profileData?.first_name) {
          setFirstName(profileData.first_name);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };
    fetchUserName();
  }, [user]);
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out"
      });
      navigate('/');
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };
  const isActive = (url: string) => {
    if (url === '/') return currentPath === '/';
    return currentPath.startsWith(url);
  };
  return <Sidebar collapsible="icon" className={cn("border-r-0 transition-all duration-300", open ? "w-64" : "w-20")}>
      <SidebarContent className={cn("flex flex-col bg-sidebar py-4", open ? "px-3" : "px-2")}>
        {/* Main Navigation */}
        <div className="flex-1 space-y-1">
          <SidebarGroup>
            {/* Collapse Toggle */}
            <div className={cn("flex items-center mb-2", open ? "justify-start px-1" : "justify-center")}>
              <button onClick={toggleSidebar} className={cn("p-2 rounded-lg transition-all duration-200", "hover:bg-sidebar-accent text-sidebar-muted hover:text-sidebar-foreground")}>
                <Menu className="h-5 w-5 text-white" />
              </button>
            </div>
            <SidebarGroupContent>
              <SidebarMenu className={cn("space-y-1", !open && "items-center")}>
                {items.map(item => <SidebarMenuItem key={item.title} className={cn(!open && "w-auto")}>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild className={cn(!open && "w-auto")}>
                          <NavLink to={item.url} end={item.url === '/'} className={cn("flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200", "text-sidebar-foreground/70 hover:text-sidebar-foreground", open ? "px-3" : "p-2 justify-center", isActive(item.url) ? "bg-gradient-primary text-sidebar-foreground shadow-primary font-medium" : "hover:bg-sidebar-accent")}>
                            <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-200", isActive(item.url) && "scale-110")} />
                            {open && <span className="truncate text-white">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!open && <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                          {item.title}
                        </TooltipContent>}
                    </Tooltip>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Admin Section */}
          {isAdmin() && <SidebarGroup className="mt-6">
              {open && <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-3 mb-2 text-white">
                  Administration
                </SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu className={cn("space-y-1", !open && "items-center")}>
                  {adminItems.map(item => <SidebarMenuItem key={item.title} className={cn(!open && "w-auto")}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild className={cn(!open && "w-auto")}>
                            <NavLink to={item.url} className={cn("flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200", "text-sidebar-foreground/70 hover:text-sidebar-foreground", open ? "px-3" : "p-2 justify-center", isActive(item.url) ? "bg-gradient-accent text-sidebar-foreground shadow-accent font-medium" : "hover:bg-sidebar-accent")}>
                              <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-200", isActive(item.url) && "scale-110")} />
                              {open && <span className="truncate text-white">{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {!open && <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                            {item.title}
                          </TooltipContent>}
                      </Tooltip>
                    </SidebarMenuItem>)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>}
        </div>
        
        {/* User & Logout Section */}
        <SidebarGroup className="mt-auto pt-4 border-t border-sidebar-border">
          <SidebarGroupContent>
            <SidebarMenu className={cn(!open && "items-center")}>
              {/* User Info */}
              {open && firstName}
              
              {/* Logout Button */}
              <SidebarMenuItem className={cn(!open && "w-auto")}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton onClick={handleLogout} className={cn("flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer", "text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive", open ? "px-3 w-full" : "p-2 justify-center w-auto")}>
                      <Lock className="h-5 w-5 flex-shrink-0 text-black" />
                      {open && <span className="text-black">Sign Out</span>}
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {!open && <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                      Sign Out
                    </TooltipContent>}
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}