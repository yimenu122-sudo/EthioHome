import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-xl mt-4">Oops! Page not found.</p>
      <Link to="/" className="mt-6 btn btn-primary">Go Home</Link>
    </div>
  );
};

export default NotFound;
