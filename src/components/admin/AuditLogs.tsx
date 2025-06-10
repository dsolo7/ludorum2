import React from 'react';
import { Search, Filter, Clock } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  adminUser: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  details: string;
}

const AuditLogs: React.FC = () => {
  const logs: AuditLog[] = [
    {
      id: '1',
      action: 'Model Update',
      adminUser: 'John Admin',
      entityType: 'AI Model',
      entityId: 'NFL-ML-001',
      timestamp: '2025-03-15 14:30:00',
      details: 'Updated NFL Moneyline Predictor prompt template'
    },
    {
      id: '2',
      action: 'User Suspension',
      adminUser: 'Sarah Admin',
      entityType: 'User',
      entityId: 'USER-123',
      timestamp: '2025-03-15 13:45:00',
      details: 'Suspended user account due to violation of terms'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Audit Logs</h1>
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
            placeholder="Search logs..."
          />
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </button>
      </div>

      {/* Logs List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {logs.map((log) => (
            <li key={log.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <p className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                      {log.timestamp}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300">
                      {log.action}
                    </span>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      Admin: {log.adminUser}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                      Entity: {log.entityType} ({log.entityId})
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {log.details}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AuditLogs;