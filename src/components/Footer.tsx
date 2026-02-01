export const Footer = () => {
  return <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
      <div className="">
        <span className="text-center sm:text-left">
          © {new Date().getFullYear()} Halo Business Finance.
          <span className="block sm:inline"> All rights reserved.</span>
        </span>
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="https://halobusinessfinance.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 hover:underline transition-colors">Privacy Policy</a>
          <a href="https://halobusinessfinance.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 hover:underline transition-colors">Terms of Service</a>
          <a href="https://halobusinessfinance.com/technical-support" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 hover:underline transition-colors">Support</a>
        </div>
      </div>
    </footer>;
};