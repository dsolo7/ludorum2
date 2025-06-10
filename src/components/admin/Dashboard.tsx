import React from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  Award,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard: React.FC = () => {
  // Sample data for demonstration
  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 5500 },
  ];

  const userActivityData = [
    { name: 'Mon', active: 120 },
    { name: 'Tue', active: 150 },
    { name: 'Wed', active: 180 },
    { name: 'Thu', active: 170 },
    { name: 'Fri', active: 160 },
    { name: 'Sat', active: 130 },
    { name: 'Sun', active: 110 },
  ];

  const subscriptionStats = [
    {
      name: 'Active 7-Day Trials',
      value: '32',
      change: '+2%',
      trend: 'up',
      icon: Clock,
    },
    {
      name: 'Paid Subscribers',
      value: '210',
      change: '+5%',
      trend: 'up',
      icon: Users,
    },
    {
      name: 'Daily Revenue',
      value: '$163',
      change: '+10%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      name: 'Monthly Revenue',
      value: '$4,900',
      change: '+15%',
      trend: 'up',
      icon: DollarSign,
    },
  ];

  const retentionStats = [
    {
      name: 'YTD Revenue',
      value: '$29,500',
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      name: 'Trial-to-Paid Conversion',
      value: '30%',
      change: '-2%',
      trend: 'down',
      icon: TrendingUp,
    },
  ];

  const retentionMetrics = [
    {
      name: '30-Day Retention Rate',
      value: '85%',
      change: '+1%',
      trend: 'up',
      icon: Activity,
    },
    {
      name: 'Churn Rate',
      value: '6%',
      change: '-1%',
      trend: 'down',
      icon: TrendingUp,
    },
  ];

  const engagementStats = [
    {
      name: 'DAU',
      value: '110',
      change: '+12%',
      trend: 'up',
      icon: Users,
    },
    {
      name: 'Model Usage Frequency',
      value: '4.2',
      change: '+0.3',
      trend: 'up',
      icon: Brain,
    },
    {
      name: 'Badge Earn Rate',
      value: '38',
      change: '+5%',
      trend: 'up',
      icon: Award,
    },
    {
      name: 'Forecasted MRR',
      value: '$5,100',
      change: '+20%',
      trend: 'up',
      icon: Target,
    },
  ];

  const renderStats = (stats: any[], columns: number = 4) => (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-${columns}`}>
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.trend === 'up' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      <span className="ml-1">{stat.change}</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h2>
        <div className="flex items-center space-x-4">
          <select className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-sm">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
            Download KPIs
          </button>
        </div>
      </div>

      {/* Subscription Stats */}
      {renderStats(subscriptionStats)}

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {renderStats(retentionStats, 1)}
      </div>

      {/* Retention Stats */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8">Retention</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {renderStats(retentionMetrics, 1)}
      </div>

      {/* Engagement Stats */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8">Engagement</h2>
      {renderStats(engagementStats)}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Revenue Overview
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Activity Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            User Activity
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="active" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              <li className="relative pb-8">
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                      <Users className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        New user <span className="font-medium text-gray-900 dark:text-white">John Smith</span> signed up
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <time dateTime="2025-03-13">2 hours ago</time>
                    </div>
                  </div>
                </div>
              </li>
              <li className="relative pb-8">
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                      <DollarSign className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        New subscription purchase by <span className="font-medium text-gray-900 dark:text-white">Sarah Johnson</span>
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <time dateTime="2025-03-13">3 hours ago</time>
                    </div>
                  </div>
                </div>
              </li>
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                      <Brain className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        New AI model <span className="font-medium text-gray-900 dark:text-white">NFL Props Predictor v2.1</span> deployed
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <time dateTime="2025-03-13">5 hours ago</time>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;