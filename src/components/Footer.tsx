import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-[#1a2332] text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold mb-4">Halo Business Finance</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted partner for SBA and commercial financing solutions nationwide.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/loan-applications" className="text-gray-300 hover:text-white transition-colors">
                  Apply Now
                </Link>
              </li>
              <li>
                <Link to="/calculator" className="text-gray-300 hover:text-white transition-colors">
                  Loan Calculator
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Loan Products */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Loan Products</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/loan-applications" className="text-gray-300 hover:text-white transition-colors">
                  SBA 7(a) Loans
                </Link>
              </li>
              <li>
                <Link to="/loan-applications" className="text-gray-300 hover:text-white transition-colors">
                  SBA 504 Loans
                </Link>
              </li>
              <li>
                <Link to="/loan-applications" className="text-gray-300 hover:text-white transition-colors">
                  Working Capital
                </Link>
              </li>
              <li>
                <Link to="/loan-applications" className="text-gray-300 hover:text-white transition-colors">
                  Equipment Financing
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Halo Business Finance. All rights reserved.
            </p>
            <p className="text-gray-400 text-xs">
              NMLS# Licensed in all 50 states
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
