import React from 'react';
import { Brain } from 'lucide-react';

interface AnalyzerCardProps {
  data: {
    title: string;
    description?: string;
    token_cost?: number;
    analyzer_id?: string;
    sport?: string;
  };
}

export function AnalyzerCard({ data }: AnalyzerCardProps) {
  return (
    <div className="rounded-2xl shadow-md p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4">
          <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{data.title}</h3>
          {data.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">{data.description}</p>
          )}
          {data.sport && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mb-3">
              {data.sport}
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors flex items-center justify-center">
          Run Analyzer {data.token_cost && <span className="ml-1 text-sm">({data.token_cost} tokens)</span>}
        </button>
      </div>
    </div>
  );
}