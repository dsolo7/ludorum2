import React from 'react';
import { ExternalLink, Star, Gift, Zap } from 'lucide-react';

interface AffiliateAd {
  id: string;
  title: string;
  description: string;
  image_url: string;
  cta_text: string;
  target_url: string;
  offer_text?: string;
  rating?: number;
  badge?: string;
}

interface AffiliateAdCardProps {
  ad: AffiliateAd;
  placement?: 'sidebar' | 'inline' | 'modal';
  onTrackClick?: (adId: string) => void;
}

const AffiliateAdCard: React.FC<AffiliateAdCardProps> = ({ 
  ad, 
  placement = 'sidebar',
  onTrackClick 
}) => {
  const handleClick = () => {
    onTrackClick?.(ad.id);
    window.open(ad.target_url, '_blank', 'noopener,noreferrer');
  };

  const getCardClasses = () => {
    const baseClasses = "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer";
    
    switch (placement) {
      case 'inline':
        return `${baseClasses} w-full`;
      case 'modal':
        return `${baseClasses} max-w-md mx-auto`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className={getCardClasses()} onClick={handleClick}>
      {/* Header with badge */}
      <div className="relative">
        {ad.badge && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              <Star className="h-3 w-3 mr-1" />
              {ad.badge}
            </span>
          </div>
        )}
        
        {/* Image */}
        <div className="aspect-video bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
          {ad.image_url ? (
            <img 
              src={ad.image_url} 
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white text-center">
              <Gift className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm font-medium">Sponsored</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {ad.title}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
          {ad.description}
        </p>

        {/* Offer text */}
        {ad.offer_text && (
          <div className="mb-3 p-2 bg-green-100 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center">
              <Zap className="h-4 w-4 mr-1" />
              {ad.offer_text}
            </p>
          </div>
        )}

        {/* Rating */}
        {ad.rating && (
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < ad.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {ad.rating}/5
            </span>
          </div>
        )}

        {/* CTA Button */}
        <button className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium">
          {ad.cta_text}
          <ExternalLink className="h-4 w-4 ml-2" />
        </button>
      </div>

      {/* Sponsored label */}
      <div className="px-4 pb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Sponsored Content
        </p>
      </div>
    </div>
  );
};

export default AffiliateAdCard;