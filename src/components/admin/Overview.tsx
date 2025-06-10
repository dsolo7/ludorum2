import React from 'react';
import { BarChart2, Users, Brain, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Overview: React.FC = () => {
  // Sample data for demonstration
  const modelUsageData = [
    { name: 'Mon', usage: 120 },
    { name: 'Tue', usage: 150 },
    { name: 'Wed', usage: 180 },
    { name: 'Thu', usage: 140 },
    { name: 'Fri', usage: 160 },
    { name: 'Sat', usage: 130 },
    { name: 'Sun', usage: 110 },
  ];

  const stats = [
    {
      name: 'Total Users',
      value: '1,234',
      change: '+12%',
      icon: Users,
    },
    {
      name: 'Active Models',
      value: '23',
      change: '+3',
      icon: Brain,
    },
    {
      name: 'Daily Predictions',
      value: '5,678',
      change: '+8%',
      icon: TrendingUp,
    },
    {
      name: 'Accuracy Rate',
      value: '92%',
      change: '+2%',
      icon: BarChart2,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {stat.value}
                        </p>
                        <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          {stat.change}
                        </p>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Model Usage Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Model Usage</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="flow-root">
              <ul className="-mb-8">
                <li className="relative pb-8">
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                        <Brain className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          New model version deployed
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            NFL Predictor v2.1
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </li>
                {/* Add more activity items as needed */}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;