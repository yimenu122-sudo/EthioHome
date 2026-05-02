import React from 'react';
import { Bed, Bath, Square } from 'lucide-react';

interface PropertyMetaProps {
  beds: number;
  baths: number;
  area: number;
  compact?: boolean;
}

export const PropertyMeta: React.FC<PropertyMetaProps> = ({ beds, baths, area, compact }) => {
  const iconSize = compact ? 14 : 18;
  const labelClass = compact ? 'text-xs' : 'text-sm font-medium';
  
  return (
    <div className="flex items-center gap-4 text-text-muted">
      <div className="flex items-center gap-1.5">
        <Bed size={iconSize} />
        <span className={labelClass}>{beds}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Bath size={iconSize} />
        <span className={labelClass}>{baths}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Square size={iconSize} />
        <span className={labelClass}>{area} m²</span>
      </div>
    </div>
  );
};
