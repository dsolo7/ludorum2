import React from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  score: number;
}

interface LeaderboardCardProps {
  leaderboard: {
    title: string;
    entries: LeaderboardEntry[];
  };
}

export function LeaderboardCard({ leaderboard }: LeaderboardCardProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-4 w-4 text-yellow-500 mr-1" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-400 mr-1" />;
      case 2:
        return <Medal className="h-4 w-4 text-amber-600 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{leaderboard.title}</h2>
      </div>
      
      <ol className="space-y-2">
        {leaderboard.entries.map((entry, idx) => (
          <li 
            key={entry.user_id} 
            className={`flex justify-between items-center text-sm p-2 rounded-md ${
              idx < 3 ? 'bg-gray-50 dark:bg-gray-700/50' : ''
            }`}
          >
            <span className="flex items-center text-gray-800 dark:text-gray-200">
              {getRankIcon(idx)}
              <span className={idx < 3 ? 'font-medium' : ''}>
                #{idx + 1} {entry.username}
              </span>
            </span>
            <span className="font-bold text-gray-900 dark:text-white">{entry.score.toLocaleString()}</span>
          </li>
        ))}
      </ol>
      
      {leaderboard.entries.length === 0 && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No entries yet
        </div>
      )}
      
      {leaderboard.entries.length > 0 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
            View Full Leaderboard →
          </button>
        </div>
      )}
    </div>
  );
}