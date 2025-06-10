import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart2, 
  X,
  Facebook, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <BarChart2 className="h-8 w-8 text-indigo-400" />
              <span className="ml-2 text-xl font-bold">Sports Genius</span>
            </Link>
            <p className="text-gray-400 text-sm mt-2">
              AI-powered sports betting analysis to help you make smarter, data-driven wagers.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                <X className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Pricing
                </a>
              </li>
              <li>
                <Link to="/signup" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Betting Guides
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-indigo-400 mr-2 mt-0.5" />
                <span className="text-gray-400 text-sm">support@sportsgenius.com</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-indigo-400 mr-2 mt-0.5" />
                <span className="text-gray-400 text-sm">(561) 247-2157</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-indigo-400 mr-2 mt-0.5" />
                <span className="text-gray-400 text-sm">West Palm Beach, Florida 33401</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {currentYear} Sports Genius. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/privacy-policy" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
              Terms of Service
            </Link>
            <Link to="/cookie-policy" className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;