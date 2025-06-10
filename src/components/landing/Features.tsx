import React from 'react';
import { Brain, Zap, TrendingUp, Layers, BarChart2, Target, BarChart, ImagePlus } from 'lucide-react';

const features = [
  {
    name: 'AI-Powered Bet Analysis',
    description: 'Upload images of your bets and get instant AI analysis based on the latest sports data and trends.',
    icon: Brain,
  },
  {
    name: 'Player Props Insights',
    description: 'Get detailed player performance predictions based on historical data, matchups, and current form.',
    icon: BarChart,
  },
  {
    name: 'Line Movement Tracker',
    description: 'Track betting line movements in real-time to identify value opportunities and market sentiment.',
    icon: TrendingUp,
  },
  {
    name: 'Parlay Evaluator',
    description: 'Analyze the risk and potential return of your parlay bets with our advanced probability calculator.',
    icon: Layers,
  },
  {
    name: 'DFS Optimizer',
    description: 'Optimize your daily fantasy sports lineups with AI-generated recommendations and player projections.',
    icon: BarChart2,
  },
  {
    name: 'Value Bet Finder',
    description: 'Discover undervalued bets across multiple sportsbooks to maximize your betting edge.',
    icon: Target,
  },
  {
    name: 'Instant Image Processing',
    description: 'Simply upload a screenshot of odds or betting slips and get immediate analysis with no manual entry.',
    icon: ImagePlus,
  },
  {
    name: 'Real-Time Insights',
    description: 'Get lightning-fast analysis with our optimized AI models that deliver results in seconds.',
    icon: Zap,
  },
];

const Features: React.FC = () => {
  return (
    <div id="features" className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Everything you need for smarter betting
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
            Our AI-powered platform gives you the edge in sports betting with these powerful features.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
                <div>
                  <div className="absolute h-12 w-12 rounded-md bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{feature.name}</h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;