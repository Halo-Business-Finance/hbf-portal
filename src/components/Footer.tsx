export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4 text-center sm:text-left">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          © {new Date().getFullYear()} Halo Business Finance. All rights reserved.
        </span>
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="https://halobusinessfinance.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors">Privacy Policy</a>
          <a href="https://halobusinessfinance.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors">Terms of Service</a>
          <a href="https://halobusinessfinance.com/technical-support" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
};