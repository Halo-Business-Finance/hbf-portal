import { ReactNode } from 'react';
import Navbar from './Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Footer } from '@/components/Footer';
interface LayoutProps {
  children: ReactNode;
}
const Layout = ({
  children
}: LayoutProps) => {
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
    </div>;
};
export default Layout;