import React from 'react';
import { RatingStars } from './RatingStars';

interface ReviewCardProps {
  userName: string;
  avatarUrl?: string;
  rating: number;
  comment: string;
  date: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  userName,
  avatarUrl,
  rating,
  comment,
  date
}) => {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} alt={userName} /> : userName.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-text">{userName}</h4>
            <span className="text-sm text-text-muted">{date}</span>
          </div>
        </div>
        <RatingStars rating={rating} size={16} />
      </div>
      <p className="text-text-muted italic leading-relaxed">
        "{comment}"
      </p>
    </div>
  );
};
