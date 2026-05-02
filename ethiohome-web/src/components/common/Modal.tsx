import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-overlay backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <div className="relative bg-surface w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-bottom">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
