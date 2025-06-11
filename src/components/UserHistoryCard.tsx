import React from 'react';
import { Calendar, Coins, CheckCircle, XCircle } from 'lucide-react';

interface UserHistoryCardProps {
  entry: {
    id: string;
    contest_name: string;
    result: 'Win' | 'Loss' | 'Pending';
    date: string;
    tokens: number;
    prediction?: string;
    confidence?: number;
  };
}

export function UserHistoryCard({ entry }: UserHistoryCardProps) {
  const getResultIcon = () => {
    switch (entry.result) {
      case 'Win':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Loss':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
        );
    }
  };

  const getResultClass = () => {
    switch (entry.result) {
      case 'Win':
        return 'text-green-500 dark:text-green-400';
      case 'Loss':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-yellow-500 dark:text-yellow-400';
    }
  };

  return (
    <div className="rounded-2xl p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-900 dark:text-white">{entry.contest_name}</span>
        <span className={`text-sm font-medium flex items-center ${getResultClass()}`}>
          {getResultIcon()}
          <span className="ml-1">{entry.result}</span>
        </span>
      </div>
      
      {entry.prediction && (
        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Prediction:</span> {entry.prediction}
          </p>
          {entry.confidence && (
            <div className="mt-1 flex items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Confidence:</span>
              <div className="ml-2 flex">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full mx-0.5 ${
                      i < entry.confidence! 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          <span>{entry.date}</span>
        </div>
        <div className="flex items-center">
          <Coins className="h-3.5 w-3.5 mr-1 text-yellow-500" />
          <span>{entry.tokens} tokens</span>
        </div>
      </div>
    </div>
  );
}