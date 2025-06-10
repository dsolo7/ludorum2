import React from 'react';
import { Play, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <div className="relative pt-12 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <div className="mt-20">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800/30 dark:text-indigo-300">
                  New: MLB Analytics Now Available
                </span>
              </div>
              <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:mt-5 sm:text-5xl lg:mt-6 xl:text-6xl">
                <span className="block">Unlock Winning</span>
                <span className="block text-indigo-600 dark:text-indigo-400">Sports Insights with AI</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 dark:text-gray-400 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Sports Genius AI analyzes your sports bets using advanced AI models to provide data-driven insights for player props, DFS, line movements, and parlays in real-time.
              </p>
              <div className="mt-8 sm:mt-10">
                <div className="sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/signup"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                    >
                      Get Started
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a
                      href="#demo"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700 md:py-4 md:text-lg md:px-10"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Watch Demo
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
            <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
              <div className="relative block w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-w-16 aspect-h-9">
                  <div className="flex items-center justify-center h-full w-full bg-gradient-to-r from-indigo-600 to-purple-600 p-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl">
                      <div className="flex items-center mb-4">
                        <Upload className="h-8 w-8 text-white" />
                        <span className="ml-2 text-xl font-bold text-white">AI Bet Analysis</span>
                      </div>
                      <div className="h-32 bg-white/20 rounded-lg flex items-center justify-center border-2 border-dashed border-white/30 mb-4">
                        <p className="text-white/70 text-sm">Upload your bet slip</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-white/20 rounded-full w-full"></div>
                        <div className="h-3 bg-white/20 rounded-full w-5/6"></div>
                        <div className="h-3 bg-white/20 rounded-full w-4/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                  <svg className="h-20 w-20 text-indigo-500 opacity-80" fill="currentColor" viewBox="0 0 84 84">
                    <circle opacity="0.2" cx="42" cy="42" r="42" fill="white" />
                    <path d="M55.5039 40.3359L37.1094 28.0729C35.7803 27.1869 34 28.1396 34 29.737V54.263C34 55.8604 35.7803 56.8131 37.1094 55.9271L55.5039 43.6641C56.6913 42.8725 56.6913 41.1275 55.5039 40.3359Z" fill="white" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;