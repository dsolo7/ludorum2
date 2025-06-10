import React, { useState } from 'react';
import { Plus, Search, Filter, BarChart2, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AIModel {
  id: string;
  name: string;
  description: string;
  sport: string;
  bettingType: string;
  status: 'active' | 'inactive' | 'draft';
  version: number;
  accuracy: number;
  lastUpdated: string;
}

const AIModels: React.FC = () => {
  const [models] = useState<AIModel[]>([
    {
      id: '1',
      name: 'NFL Moneyline Predictor',
      description: 'Predicts NFL game winners based on historical data and current team performance',
      sport: 'NFL',
      bettingType: 'Moneyline',
      status: 'active',
      version: 2.1,
      accuracy: 92.5,
      lastUpdated: '2025-03-15'
    },
    {
      id: '2',
      name: 'NBA Player Props',
      description: 'Analyzes player performance metrics for NBA prop betting',
      sport: 'NBA',
      bettingType: 'Player Props',
      status: 'active',
      version: 1.8,
      accuracy: 88.3,
      lastUpdated: '2025-03-14'
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">AI Models</h1>
        <Link
          to="/admin/models/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Model
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search models..."
          />
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </button>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <div
            key={model.id}
            className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Brain className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {model.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Version {model.version}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {model.description}
                </p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sport
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {model.sport}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Betting Type
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {model.bettingType}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    model.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300'
                  }`}>
                    {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Accuracy
                  </p>
                  <div className="flex items-center">
                    <BarChart2 className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {model.accuracy}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                  Edit Model →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIModels;