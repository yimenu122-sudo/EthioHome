import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  onRating?: (rating: number) => void;
  size?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  maxRating = 5, 
  onRating,
  size = 20 
}) => {
  return (
    <div className="flex items-center gap-1">
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= rating;
        
        return (
          <button
            key={i}
            type="button"
            disabled={!onRating}
            onClick={() => onRating?.(starValue)}
            className={`${onRating ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              size={size}
              className={isFilled ? 'fill-secondary text-secondary' : 'text-border'}
            />
          </button>
        );
      })}
    </div>
  );
};
