import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bot, Users, Settings, ClipboardList, Bell, Menu, X, BookOpen, Gamepad2, MonitorPlay, LineChart, MessageSquareMore, CreditCard, HelpCircle, Brain, Trophy, Megaphone, FileDown, Target, FolderRoot as Football, Wrench, Rss, Coins, UserCheck, Clock, MapPin, Layout } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    // Core
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Users', icon: Users, href: '/admin/users' },
    
    // Revenue & AI
    { name: 'Subscriptions', icon: CreditCard, href: '/admin/subscriptions' },
    { name: 'Tokenize', icon: Coins, href: '/admin/tokenize' },
    { name: 'User Tokens', icon: UserCheck, href: '/admin/user-tokens' },
    { name: 'Token Transactions', icon: Clock, href: '/admin/token-transactions' },
    { name: 'AI Model Builder', icon: Wrench, href: '/admin/model-builder' },
    { name: 'AI Models', icon: Bot, href: '/admin/models' },
    { name: 'LLM Providers', icon: Brain, href: '/admin/llm-providers' },
    
    // Sports & Betting
    { name: 'Bet Types', icon: Target, href: '/admin/bet-types' },
    { name: 'Sports', icon: Football, href: '/admin/sports' },
    { name: 'API Feeds', icon: Rss, href: '/admin/api-feeds' },
    
    // Engagement
    { name: 'Leader Board', icon: Trophy, href: '/admin/leaderboard' },
    { name: 'Contest Management', icon: Target, href: '/admin/contest-management' },
    { name: 'Campaigns', icon: Megaphone, href: '/admin/campaigns' },
    { name: 'Analyzer', icon: BookOpen, href: '/admin/analyzer' },
    { name: 'Content', icon: MessageSquareMore, href: '/admin/content' },
    { name: 'Gamification', icon: Gamepad2, href: '/admin/gamification' },
    { name: 'Page Builder', icon: Layout, href: '/admin/page-builder' },
    { name: 'Badge Definitions', icon: Trophy, href: '/admin/badge-definitions' },
    { name: 'Ads', icon: MonitorPlay, href: '/admin/ads' },
    { name: 'Ad Placements', icon: MapPin, href: '/admin/ad-placements' },
    
    // System
    { name: 'Export Center', icon: FileDown, href: '/admin/export' },
    { name: 'Audit Logs', icon: ClipboardList, href: '/admin/audit-logs' },
    { name: 'Notifications', icon: Bell, href: '/admin/notifications' },
    { name: 'Analytics', icon: LineChart, href: '/admin/analytics' },
    { name: 'Support', icon: HelpCircle, href: '/admin/support' },
    { name: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const notifications = [
    {
      id: 1,
      title: 'New Model Version',
      message: 'NFL Moneyline Predictor v2.1 is now active',
      time: '5m ago',
    },
    {
      id: 2,
      title: 'User Report',
      message: 'Monthly user activity report is ready',
      time: '1h ago',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Link to="/admin" className="flex items-center">
              <Bot className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Sports Genius
              </span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  location.pathname === item.href || 
                  (item.href !== '/admin' && location.pathname.startsWith(item.href))
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navigation */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden px-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-1 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800" />
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;