import React from 'react';

export const Loader: React.FC<{ size?: number; color?: string }> = ({ 
  size = 40, 
  color = 'var(--primary)' 
}) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div 
        className="animate-spin rounded-full border-3 border-t-transparent"
        style={{ 
          width: size, 
          height: size, 
          borderColor: `${color}30`, 
          borderTopColor: color 
        }}
      />
    </div>
  );
};

export const FullPageLoader = () => (
  <div className="fixed inset-0 bg-surface z-[999] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader size={60} />
      <span className="font-bold text-primary animate-pulse italic">EthioHome</span>
    </div>
  </div>
);
