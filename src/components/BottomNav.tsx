import { useState } from 'react';
import { Home, FileText, Building2, FolderOpen, Grid3X3, ChevronUp } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  const handleSelectChange = (value: string) => {
    if (value) {
      navigate(value);
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-stretch justify-around h-16 px-1">
        {/* Dashboard - Simple Link */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground active:scale-95'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "p-1 rounded-lg transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Home className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[9px] font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>
                Home
              </span>
            </>
          )}
        </NavLink>

        {/* Loan Programs - Select */}
        <div className="flex flex-col items-center justify-center flex-1 h-full">
          <Select onValueChange={handleSelectChange} onOpenChange={(open) => setOpenSelect(open ? 'loans' : null)}>
            <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 w-auto focus:ring-0 [&>svg]:hidden">
              <div className="flex flex-col items-center gap-0.5">
                <div className={cn(
                  "p-1 rounded-lg transition-all duration-200",
                  openSelect === 'loans' && "bg-primary/10"
                )}>
                  <FileText className={cn(
                    "h-5 w-5 transition-transform duration-200 text-muted-foreground",
                    openSelect === 'loans' && "text-primary scale-110"
                  )} />
                </div>
                <div className="flex items-center gap-0.5">
                  <span className={cn(
                    "text-[9px] font-medium text-muted-foreground",
                    openSelect === 'loans' && "text-primary font-semibold"
                  )}>
                    Loans
                  </span>
                  <ChevronUp className={cn(
                    "h-2.5 w-2.5 text-muted-foreground transition-transform duration-200",
                    openSelect === 'loans' ? "rotate-0 text-primary" : "rotate-180"
                  )} />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-xl min-w-[200px]" side="top" align="center">
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground">My Loans</SelectLabel>
                <SelectItem value="/existing-loans">Existing Loans</SelectItem>
                <SelectItem value="/loan-applications">View All Applications</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground">SBA Loans</SelectLabel>
                <SelectItem value="/loan-applications?type=sba_7a">SBA 7(a) Loan</SelectItem>
                <SelectItem value="/loan-applications?type=sba_504">SBA 504 Loan</SelectItem>
                <SelectItem value="/loan-applications?type=sba_express">SBA Express Loan</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground">Commercial</SelectLabel>
                <SelectItem value="/loan-applications?type=term_loan">Term Loan</SelectItem>
                <SelectItem value="/loan-applications?type=bridge_loan">Bridge Loan</SelectItem>
                <SelectItem value="/loan-applications?type=conventional">Conventional Loan</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground">Working Capital</SelectLabel>
                <SelectItem value="/loan-applications?type=working_capital">Working Capital</SelectItem>
                <SelectItem value="/loan-applications?type=business_loc">Business Line of Credit</SelectItem>
                <SelectItem value="/loan-applications?type=equipment">Equipment Financing</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Bank Accounts - Select */}
        <div className="flex flex-col items-center justify-center flex-1 h-full">
          <Select onValueChange={handleSelectChange} onOpenChange={(open) => setOpenSelect(open ? 'accounts' : null)}>
            <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 w-auto focus:ring-0 [&>svg]:hidden">
              <div className="flex flex-col items-center gap-0.5">
                <div className={cn(
                  "p-1 rounded-lg transition-all duration-200",
                  openSelect === 'accounts' && "bg-primary/10"
                )}>
                  <Building2 className={cn(
                    "h-5 w-5 transition-transform duration-200 text-muted-foreground",
                    openSelect === 'accounts' && "text-primary scale-110"
                  )} />
                </div>
                <div className="flex items-center gap-0.5">
                  <span className={cn(
                    "text-[9px] font-medium text-muted-foreground",
                    openSelect === 'accounts' && "text-primary font-semibold"
                  )}>
                    Accounts
                  </span>
                  <ChevronUp className={cn(
                    "h-2.5 w-2.5 text-muted-foreground transition-transform duration-200",
                    openSelect === 'accounts' ? "rotate-0 text-primary" : "rotate-180"
                  )} />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-xl min-w-[180px]" side="top" align="center">
              <SelectItem value="/bank-accounts?type=business">Business Accounts</SelectItem>
              <SelectItem value="/bank-accounts?type=personal">Personal Accounts</SelectItem>
              <SelectSeparator />
              <SelectItem value="/bank-accounts">View All Accounts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents - Select */}
        <div className="flex flex-col items-center justify-center flex-1 h-full">
          <Select onValueChange={handleSelectChange} onOpenChange={(open) => setOpenSelect(open ? 'docs' : null)}>
            <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 w-auto focus:ring-0 [&>svg]:hidden">
              <div className="flex flex-col items-center gap-0.5">
                <div className={cn(
                  "p-1 rounded-lg transition-all duration-200",
                  openSelect === 'docs' && "bg-primary/10"
                )}>
                  <FolderOpen className={cn(
                    "h-5 w-5 transition-transform duration-200 text-muted-foreground",
                    openSelect === 'docs' && "text-primary scale-110"
                  )} />
                </div>
                <div className="flex items-center gap-0.5">
                  <span className={cn(
                    "text-[9px] font-medium text-muted-foreground",
                    openSelect === 'docs' && "text-primary font-semibold"
                  )}>
                    Docs
                  </span>
                  <ChevronUp className={cn(
                    "h-2.5 w-2.5 text-muted-foreground transition-transform duration-200",
                    openSelect === 'docs' ? "rotate-0 text-primary" : "rotate-180"
                  )} />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-xl min-w-[180px]" side="top" align="center">
              <SelectItem value="/my-documents">My Documents</SelectItem>
              <SelectItem value="/my-documents?upload=true">Upload Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Business Tools - Select */}
        <div className="flex flex-col items-center justify-center flex-1 h-full">
          <Select onValueChange={handleSelectChange} onOpenChange={(open) => setOpenSelect(open ? 'tools' : null)}>
            <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 w-auto focus:ring-0 [&>svg]:hidden">
              <div className="flex flex-col items-center gap-0.5">
                <div className={cn(
                  "p-1 rounded-lg transition-all duration-200",
                  openSelect === 'tools' && "bg-primary/10"
                )}>
                  <Grid3X3 className={cn(
                    "h-5 w-5 transition-transform duration-200 text-muted-foreground",
                    openSelect === 'tools' && "text-primary scale-110"
                  )} />
                </div>
                <div className="flex items-center gap-0.5">
                  <span className={cn(
                    "text-[9px] font-medium text-muted-foreground",
                    openSelect === 'tools' && "text-primary font-semibold"
                  )}>
                    Tools
                  </span>
                  <ChevronUp className={cn(
                    "h-2.5 w-2.5 text-muted-foreground transition-transform duration-200",
                    openSelect === 'tools' ? "rotate-0 text-primary" : "rotate-180"
                  )} />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-xl min-w-[200px]" side="top" align="center">
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground">Credit Reports</SelectLabel>
                <SelectItem value="/credit-reports?type=business">Business Credit Report</SelectItem>
                <SelectItem value="/credit-reports?type=personal">Personal Credit Report</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground">Calculators</SelectLabel>
                <SelectItem value="/loan-calculator">Loan Calculator</SelectItem>
                <SelectItem value="/credit-score-simulator">Credit Score Simulator</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectItem value="/support">Help & Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </nav>
  );
};
