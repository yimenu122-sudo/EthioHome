import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Grid } from 'lucide-react';

export const PropertyGallery: React.FC<{ images: string[] }> = ({ images }) => {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video rounded-2xl overflow-hidden group">
        <img 
          src={images[active]} 
          className="w-full h-full object-cover transition-opacity duration-300" 
          alt="Property" 
        />
        
        {images.length > 1 && (
          <>
            <button 
              onClick={() => setActive((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-surface/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <ChevronLeft />
            </button>
            <button 
              onClick={() => setActive((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-surface/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={`
              flex-shrink-0 w-24 aspect-square rounded-xl overflow-hidden border-2 transition-all
              ${active === idx ? 'border-primary' : 'border-transparent opacity-60'}
            `}
          >
            <img src={img} className="w-full h-full object-cover" alt="Property thumbnail" />
          </button>
        ))}
      </div>
    </div>
  );
};
