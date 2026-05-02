import React from 'react';
import { Link } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const Navbar: React.FC = () => {
  return (
    <nav className="h-20 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container h-full flex items-center justify-between">
        <Link to="/" className="text-2xl font-black text-primary">
          EthioHome
        </Link>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            <Link to="/search" className="font-semibold text-text-muted hover:text-primary transition-colors">Find Homes</Link>
            <Link to="/about" className="font-semibold text-text-muted hover:text-primary transition-colors">How it works</Link>
          </div>
          
          <div className="h-6 w-[1px] bg-border hidden md:block" />
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/auth/login" className="btn btn-primary flex items-center gap-2">
              <User size={18} />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
