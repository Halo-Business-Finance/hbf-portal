import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin } from "lucide-react";
export const Footer = () => {
  return <footer className="bg-black text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto py-14 px-6 lg:px-12">
        {/* First Row - Logo & 4 Link Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr_1fr] gap-x-8 gap-y-2">
          {/* Logo & Description */}
          <div className="min-w-[340px] lg:mr-10">
            <div className="mb-6">
              <h2 className="font-bold tracking-wide text-lg whitespace-nowrap">HALO BUSINESS FINANCE</h2>
            </div>
            <p className="text-white text-sm leading-relaxed">
              Nationwide commercial loan marketplace offering streamlined loan processes for SBA, commercial real estate, and equipment financing.
            </p>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://halobusinessfinance.com/about-us" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Company Overview</a></li>
              <li><a href="https://halobusinessfinance.com/how-it-works" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">How It Works</a></li>
              <li><a href="https://halobusinessfinance.com/marketplace-benefits" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Marketplace Benefits</a></li>
              <li><a href="https://halobusinessfinance.com/contact-us" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Contact Us</a></li>
              <li><a href="https://halobusinessfinance.com/careers" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Careers</a></li>
            </ul>
          </div>
          
          {/* Loan Programs */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Loan Programs</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://halobusinessfinance.com/sba-7a-loans" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">SBA 7a Loans</a></li>
              <li><a href="https://halobusinessfinance.com/sba-504-loans" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">SBA 504 Loans</a></li>
              <li><a href="https://halobusinessfinance.com/bridge-financing" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Bridge Loans</a></li>
              <li><a href="https://halobusinessfinance.com/conventional-loans" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Conventional Loans</a></li>
              <li><a href="https://halobusinessfinance.com/usda-bi-loans" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">USDA Loans</a></li>
              <li><a href="https://halobusinessfinance.com/equipment-financing" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Equipment Financing</a></li>
              <li><a href="https://halobusinessfinance.com/working-capital" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Working Capital</a></li>
              <li><a href="https://halobusinessfinance.com/business-line-of-credit" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Business Line of Credit</a></li>
            </ul>
          </div>
          
          {/* Partner With Us */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Partner With Us</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://halobusinessfinance.com/become-a-broker" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Become a Broker</a></li>
              <li><a href="https://halobusinessfinance.com/broker-resources" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Broker Resources</a></li>
              <li><a href="https://halobusinessfinance.com/become-a-lender" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Become a Lender</a></li>
              <li><a href="https://halobusinessfinance.com/partnership-benefits" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Partnership Benefits</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://halobusinessfinance.com/customer-service" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Customer Service</a></li>
              <li><a href="https://halobusinessfinance.com/technical-support" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Technical Support</a></li>
              <li><a href="https://halobusinessfinance.com/schedule-consultation" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Schedule Consultation</a></li>
              <li><a href="https://halobusinessfinance.com/security-data-protection" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Security & Data Protection</a></li>
            </ul>
          </div>
          
          {/* Empty spacers for second row - position Resources under Support (5th column) */}
          <div className="hidden lg:block"></div>
          <div className="hidden lg:block"></div>
          <div className="hidden lg:block"></div>
          <div className="hidden lg:block"></div>
          
          {/* Resources - positioned under Support */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://halobusinessfinance.com/loan-calculator" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Loan Calculator</a></li>
              <li><a href="https://halobusinessfinance.com/industry-solutions" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Industry Solutions</a></li>
              <li><a href="https://halobusinessfinance.com/sba-resources" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">SBA Resources</a></li>
              <li><a href="https://halobusinessfinance.com/market-insights" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Market Insights</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Middle Bar - Social & Legal Links */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* BBB Badge placeholder & Social */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="text-white text-sm">Follow Us:</span>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:opacity-80 transition-opacity">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:opacity-80 transition-opacity">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white hover:opacity-80 transition-opacity">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm">
              <a href="https://halobusinessfinance.com/licenses" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Company Licenses</a>
              <a href="https://halobusinessfinance.com/nmls" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">NMLS Compliance</a>
              <a href="https://halobusinessfinance.com/cfipa" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">CFIPA</a>
              <Link to="/privacy" className="text-white hover:underline transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-white hover:underline transition-colors">Terms of Use</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Disclaimer */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="text-white text-xs space-y-1">
              <p>&copy; {new Date().getFullYear()} Halo Business Finance. All rights reserved.</p>
              <p>DFPI CFL License No. 60DBO-178064. California Commercial Financing Law disclosures available upon request.</p>
              <p>NMLS ID: 2272778. Commercial Loan Marketplace. Loan programs subject to credit approval and terms may vary by lender.</p>
              <p>Halo Business Finance is a direct CRE & equipment lender providing commercial financing solutions to businesses nationwide.</p>
            </div>
            <div className="flex items-end gap-4 text-xs">
              <a href="https://halobusinessfinance.com/accessibility" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Accessibility</a>
              <span className="text-gray-500">|</span>
              <a href="https://halobusinessfinance.com/sitemap" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Site Map</a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};