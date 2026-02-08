import { Lock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative z-40 bg-white border-t border-gray-200 py-4 mb-[calc(4rem+env(safe-area-inset-bottom))] md:mb-0">
      <div className="max-w-7xl mx-auto px-[30px] sm:px-6 lg:px-[34px] flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 md:gap-4">
        <span className="text-sm text-center whitespace-nowrap text-muted-foreground">
          © {new Date().getFullYear()} Halo Business Finance. All rights reserved.
        </span>
        <div className="flex items-center gap-6">
          <a 
            href="https://halobusinessfinance.com/privacy-policy" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-foreground hover:text-primary transition-colors"
          >
            Privacy
          </a>
          <a 
            href="https://halobusinessfinance.com/terms-of-service" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-foreground hover:text-primary transition-colors"
          >
            Terms
          </a>
          <a 
            href="https://halobusinessfinance.com/technical-support" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-foreground hover:text-primary transition-colors"
          >
            Support
          </a>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
};