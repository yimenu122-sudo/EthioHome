import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
      <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
        <Home size={14} />
      </Link>
      
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={name}>
            <ChevronRight size={14} />
            {isLast ? (
              <span className="font-bold text-text capitalize">
                {name.replace(/-/g, ' ')}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-primary transition-colors capitalize"
              >
                {name.replace(/-/g, ' ')}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
