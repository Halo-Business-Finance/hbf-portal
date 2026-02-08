import { ReactNode } from 'react';
import Navbar from './Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Footer } from '@/components/Footer';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { SessionTimeoutDialog } from '@/components/SessionTimeoutDialog';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({
  children
}: LayoutProps) => {
  const { showWarning, remainingSeconds, extendSession, logoutNow } = useSessionTimeout({
    // 14 minutes of inactivity before warning
    warningTimeMs: 14 * 60 * 1000,
    // 1 minute after warning to logout (15 min total)
    logoutTimeMs: 1 * 60 * 1000,
  });

  return <div className="min-h-screen w-full bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Breadcrumbs />
        <main className="flex-1 overflow-auto pb-20 md:pb-8 bg-white">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
        <Footer />
      </div>
      <BottomNav />
      
      {/* Session timeout warning dialog */}
      <SessionTimeoutDialog
        open={showWarning}
        remainingSeconds={remainingSeconds}
        onExtend={extendSession}
        onLogout={logoutNow}
      />
    </div>;
};
export default Layout;