import React from 'react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import AnalyzerDemo from '../components/AnalyzerDemo'; 
import UserProfile from '../components/UserProfile';
import UserAchievements from '../components/UserAchievements';
import { User, Trophy, Brain } from 'lucide-react';
import UserDashboardHeader from '../components/UserDashboardHeader';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('analyzer');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <UserDashboardHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sports Genius Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Analyze your sports bets with AI-powered insights
          </p>
        </div>
        
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('analyzer')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analyzer'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Analyzer
                </div>
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'achievements'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Achievements
                </div>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile
                </div>
              </button>
            </nav>
          </div>
        </div>
        
        {activeTab === 'analyzer' && <AnalyzerDemo />}
        {activeTab === 'achievements' && <UserAchievements />}
        {activeTab === 'profile' && <UserProfile />}
      </div>
    </div>
  );
};

export default Dashboard;