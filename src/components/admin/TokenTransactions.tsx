import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, Coins, Users, Brain } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface TokenTransaction {
  id: string;
  user_id: string;
  model_id: string | null;
  tokens_deducted: number | null;
  type: string;
  created_at: string;
  profiles?: {
    email: string;
  };
  ai_models?: {
    name: string;
  };
}

const TokenTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TokenTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, typeFilter]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('token_transactions')
        .select(`
          *,
          profiles!token_transactions_user_id_fkey (email),
          ai_models (name)
        `)
        .order('created_at', { ascending: false })
        .limit(500); // Limit to recent 500 transactions for performance

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching token transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by search term (email or model name)
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        (transaction.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.ai_models?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by type
    if (typeFilter) {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }

    setFilteredTransactions(filtered);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deduction':
        return 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300';
      case 'refund':
        return 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300';
      case 'manual':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  const getTokensDisplay = (tokens: number | null, type: string) => {
    if (tokens === null) return '-';
    
    // For manual adjustments, negative means addition, positive means deduction
    if (type === 'manual') {
      if (tokens < 0) {
        return `+${Math.abs(tokens)}`;
      } else if (tokens > 0) {
        return `-${tokens}`;
      }
      return '0';
    }
    
    // For deductions and refunds, show as-is
    return tokens.toString();
  };

  const getTokensColor = (tokens: number | null, type: string) => {
    if (tokens === null) return 'text-gray-500';
    
    if (type === 'manual') {
      return tokens < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
    
    return type === 'refund' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Token Transactions</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="h-6 w-6 mr-2 text-indigo-600" />
            Token Transactions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View-only log of all token transactions and adjustments
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Coins className="h-4 w-4" />
          <span>{filteredTransactions.length} transactions</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search by user email or model name..."
            />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="deduction">Deductions</option>
              <option value="refund">Refunds</option>
              <option value="manual">Manual Adjustments</option>
            </select>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('');
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                          <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.profiles?.email || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {transaction.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.model_id ? (
                      <div className="flex items-center">
                        <Brain className="h-4 w-4 text-purple-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.ai_models?.name || 'Unknown Model'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.model_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className={`text-sm font-medium ${getTokensColor(transaction.tokens_deducted, transaction.type)}`}>
                        {getTokensDisplay(transaction.tokens_deducted, transaction.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <div className="font-medium">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs">
                        {format(new Date(transaction.created_at), 'HH:mm:ss')}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {searchTerm || typeFilter ? 'No matching transactions' : 'No transactions yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || typeFilter 
                ? 'Try adjusting your search or filter criteria.'
                : 'Token transactions will appear here as users interact with AI models.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <Coins className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Deductions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {filteredTransactions
                      .filter(t => t.type === 'deduction')
                      .reduce((sum, t) => sum + (t.tokens_deducted || 0), 0)
                      .toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Coins className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Refunds
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {filteredTransactions
                      .filter(t => t.type === 'refund')
                      .reduce((sum, t) => sum + (t.tokens_deducted || 0), 0)
                      .toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Manual Adjustments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {filteredTransactions.filter(t => t.type === 'manual').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenTransactions;