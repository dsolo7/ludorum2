import React from 'react';
import { ExternalLink, Star } from 'lucide-react';

interface AdBlockProps {
  data: {
    headline?: string;
    subtext?: string;
    link?: string;
    image_url?: string;
    badge?: string;
    offer?: string;
    cta_text?: string;
    placement?: string;
  };
}

export function AdBlock({ data }: AdBlockProps) {
  return (
    <a
      href={data.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:scale-[1.01]"
    >
      {data.image_url ? (
        <div className="relative">
          <img 
            src={data.image_url} 
            alt={data.headline || 'Advertisement'} 
            className="w-full h-40 object-cover"
          />
          {data.badge && (
            <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <Star className="h-3 w-3 mr-1" />
              {data.badge}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-40 flex items-center justify-center">
          <span className="text-white text-xl font-bold">Featured Offer</span>
        </div>
      )}
      
      <div className="p-5 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-100 dark:border-yellow-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {data.headline || 'Special Offer'}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          {data.subtext || 'Click to learn more about this exclusive offer.'}
        </p>
        
        {data.offer && (
          <div className="mb-4 p-2 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-green-700 dark:text-green-400">
            {data.offer}
          </div>
        )}
        
        <button className="w-full flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
          {data.cta_text || 'Claim Offer'} <ExternalLink className="h-4 w-4 ml-2" />
        </button>
        
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">Sponsored Content</span>
        </div>
      </div>
    </a>
  );
}