import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-[#0f1419] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Halo Business Finance</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              Nationwide Commercial & Business Financing. We provide credit, financing, treasury and payment solutions to help your business succeed.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Bank-Level Security</span>
            </div>
          </div>
          
          {/* SBA Loans */}
          <div>
            <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">SBA Loans</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="https://halobusinessfinance.com/sba-7a-loans" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  SBA 7(a) Loans
                </a>
              </li>
              <li>
                <a href="https://halobusinessfinance.com/sba-504-loans" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  SBA 504 Loans
                </a>
              </li>
              <li>
                <a href="https://halobusinessfinance.com/sba-express-loans" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  SBA Express Loans
                </a>
              </li>
              <li>
                <a href="https://halobusinessfinance.com/usda-loans" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  USDA B&I Loans
                </a>
              </li>
            </ul>
          </div>
          
          {/* Commercial Loans */}
          <div>
            <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">Commercial</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="https://halobusinessfinance.com/commercial-real-estate" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  Commercial Real Estate
                </a>
              </li>
              <li>
                <a href="https://halobusinessfinance.com/bridge-loans" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  Bridge Loans
                </a>
              </li>
              <li>
                <a href="https://halobusinessfinance.com/equipment-financing" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  Equipment Financing
                </a>
              </li>
              <li>
                <a href="https://halobusinessfinance.com/working-capital" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  Working Capital
                </a>
              </li>
            </ul>
          </div>
          
          {/* Portal Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">Borrower Portal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/loan-applications" className="text-gray-400 hover:text-white transition-colors">
                  Apply Now
                </Link>
              </li>
              <li>
                <Link to="/calculator" className="text-gray-400 hover:text-white transition-colors">
                  Loan Calculator
                </Link>
              </li>
              <li>
                <Link to="/my-documents" className="text-gray-400 hover:text-white transition-colors">
                  My Documents
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-400 hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Halo Business Finance. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/terms" className="text-gray-500 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-gray-500 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <a href="https://halobusinessfinance.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                Main Website
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
