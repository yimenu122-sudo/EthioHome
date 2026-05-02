import React from 'react';

export const PropertyStatusBadge: React.FC<{ status: 'rent' | 'sale' }> = ({ status }) => {
  const isRent = status === 'rent';
  
  return (
    <span className={`
      px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
      ${isRent 
        ? 'bg-primary text-white' 
        : 'bg-secondary text-white'}
    `}>
      For {status}
    </span>
  );
};
