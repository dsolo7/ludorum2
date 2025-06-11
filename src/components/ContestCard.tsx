import React from 'react';
import { Trophy, Users, Coins } from 'lucide-react';

interface ContestCardProps {
  data: {
    title: string;
    description?: string;
    token_cost?: number;
    prize_pool?: number;
    current_entries?: number;
    max_entries?: number;
    contest_id?: string;
  };
}

export function ContestCard({ data }: ContestCardProps) {
  return (
    <div className="rounded-2xl shadow-md p-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg transition-shadow">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-white/20 p-3 rounded-lg mr-4">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold">{data.title}</h3>
          {data.description && (
            <p className="text-sm text-white/80 mt-1 mb-3">{data.description}</p>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4 mb-4">
        {data.prize_pool && (
          <div className="flex items-center">
            <Coins className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{data.prize_pool} prize pool</span>
          </div>
        )}
        
        {(data.current_entries !== undefined || data.max_entries !== undefined) && (
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">
              {data.current_entries || 0}/{data.max_entries || '∞'} entries
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <button className="flex-1 bg-white text-purple-700 hover:bg-white/90 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
          👍 Thumbs Up
        </button>
        <button className="flex-1 bg-white text-purple-700 hover:bg-white/90 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
          👎 Thumbs Down
        </button>
      </div>
      
      <div className="text-xs mt-3 text-center text-white/80">
        Entry: {data.token_cost || 5} tokens
      </div>
    </div>
  );
}