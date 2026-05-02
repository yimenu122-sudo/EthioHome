import React from 'react';
import { MapPin, Bed, Bath, Square, ChevronRight } from 'lucide-react';
import { PropertyStatusBadge } from './PropertyStatusBadge';
import { PropertyMeta } from './PropertyMeta';

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  imageUrl: string;
  beds: number;
  baths: number;
  area: number;
  status: 'rent' | 'sale';
  onClick?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  title,
  price,
  location,
  imageUrl,
  beds,
  baths,
  area,
  status,
  onClick
}) => {
  return (
    <div 
      className="card group cursor-pointer overflow-hidden transition-all hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute top-4 left-4">
          <PropertyStatusBadge status={status} />
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-center gap-1.5 text-text-muted text-sm mb-2">
          <MapPin size={16} className="text-primary" />
          <span className="truncate">{location}</span>
        </div>
        
        <h3 className="text-xl font-bold mb-3 truncate group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center justify-between border-t border-border pt-4">
          <PropertyMeta beds={beds} baths={baths} area={area} />
          <div className="text-xl font-extrabold text-primary">
            {price.toLocaleString()} ETB
            {status === 'rent' && <span className="text-sm font-medium">/mo</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
