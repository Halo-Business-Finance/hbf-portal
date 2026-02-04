export const Footer = () => {
  return <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-3 mb-16 md:mb-0">
      <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-2 md:gap-4">
        <span className="text-sm text-center whitespace-nowrap text-black font-medium">
          © {new Date().getFullYear()} Halo Business Finance. All rights reserved.
        </span>
        <div className="flex items-center gap-4 md:gap-6">
          <a href="https://halobusinessfinance.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm hover:underline transition-colors text-black font-medium">Privacy Policy</a>
          <a href="https://halobusinessfinance.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-sm hover:underline transition-colors text-black font-medium">Terms of Service</a>
          <a href="https://halobusinessfinance.com/technical-support" target="_blank" rel="noopener noreferrer" className="text-sm hover:underline transition-colors text-black font-medium">Support</a>
        </div>
      </div>
    </footer>;
};