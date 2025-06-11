import React from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';

interface LeaderboardProps {
  data: {
    contest_name?: string;
    sport?: string;
    limit?: number;
    entries?: Array<{
      username: string;
      score: number;
      rank?: number;
    }>;
  };
}

export function Leaderboard({ data }: LeaderboardProps) {
  // Sample entries if none provided
  const entries = data.entries || [
    { username: 'JohnDoe', score: 1250, rank: 1 },
    { username: 'SportsGuru', score: 1100, rank: 2 },
    { username: 'BetMaster', score: 950, rank: 3 },
    { username: 'PredictionKing', score: 800, rank: 4 },
    { username: 'LuckyPlayer', score: 750, rank: 5 },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{rank}</span>;
    }
  };

  return (
    <div className="rounded-2xl shadow-md p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-4">
        <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {data.contest_name || 'Leaderboard'} {data.sport && `- ${data.sport}`}
        </h3>
      </div>
      
      <div className="overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {entries.slice(0, data.limit || 10).map((entry, index) => (
              <tr key={index} className={index < 3 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(entry.rank || index + 1)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.username}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{entry.score.toLocaleString()}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-center">
        <button className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
          View Full Leaderboard →
        </button>
      </div>
    </div>
  );
}