import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Coins, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
}

interface UserToken {
  user_id: string;
  balance: number;
  updated_at: string;
  users?: {
    email: string;
  };
}

const UserTokens: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<UserToken | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    balance: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchUserTokens();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .order('email');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select(`
          *,
          profiles!user_tokens_user_id_fkey (email)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUserTokens(data || []);
    } catch (error) {
      console.error('Error fetching user tokens:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      balance: 0
    });
    setEditingToken(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tokenData = {
        user_id: formData.user_id,
        balance: formData.balance
      };

      if (editingToken) {
        const { error } = await supabase
          .from('user_tokens')
          .update({ balance: formData.balance })
          .eq('user_id', editingToken.user_id);

        if (error) throw error;

        // Log the manual adjustment
        await supabase.from('token_transactions').insert({
          user_id: formData.user_id,
          tokens_deducted: editingToken.balance - formData.balance,
          type: 'manual'
        });
      } else {
        const { error } = await supabase
          .from('user_tokens')
          .upsert([tokenData]);

        if (error) throw error;

        // Log the initial balance
        await supabase.from('token_transactions').insert({
          user_id: formData.user_id,
          tokens_deducted: -formData.balance, // Negative for addition
          type: 'manual'
        });
      }

      await fetchUserTokens();
      resetForm();
    } catch (error) {
      console.error('Error saving user tokens:', error);
      alert('Error saving user tokens');
    }
  };

  const handleEdit = (userToken: UserToken) => {
    setFormData({
      user_id: userToken.user_id,
      balance: userToken.balance
    });
    setEditingToken(userToken);
    setIsFormOpen(true);
  };

  const handleDelete = async (user_id: string) => {
    if (!confirm('Are you sure you want to delete this user\'s token balance?')) return;

    try {
      const { error } = await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', user_id);

      if (error) throw error;
      await fetchUserTokens();
    } catch (error) {
      console.error('Error deleting user tokens:', error);
      alert('Error deleting user tokens');
    }
  };

  const addTokens = async (user_id: string, amount: number) => {
    try {
      const currentToken = userTokens.find(ut => ut.user_id === user_id);
      const newBalance = (currentToken?.balance || 0) + amount;

      const { error } = await supabase
        .from('user_tokens')
        .upsert([{ user_id, balance: newBalance }]);

      if (error) throw error;

      // Log the addition
      await supabase.from('token_transactions').insert({
        user_id,
        tokens_deducted: -amount, // Negative for addition
        type: 'manual'
      });

      await fetchUserTokens();
    } catch (error) {
      console.error('Error adding tokens:', error);
      alert('Error adding tokens');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Coins className="h-6 w-6 mr-2 text-indigo-600" />
            Manage User Tokens
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manually update user token balances
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Set User Balance
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const userId = prompt('Enter user ID to add 100 tokens:');
              if (userId) addTokens(userId, 100);
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add 100 Tokens
          </button>
          <button
            onClick={() => {
              const userId = prompt('Enter user ID to add 500 tokens:');
              if (userId) addTokens(userId, 500);
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add 500 Tokens
          </button>
          <button
            onClick={() => {
              const userId = prompt('Enter user ID to add 1000 tokens:');
              if (userId) addTokens(userId, 1000);
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add 1000 Tokens
          </button>
        </div>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select User *
                </label>
                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingToken}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5 disabled:opacity-50"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Token Balance *
                </label>
                <input
                  type="number"
                  name="balance"
                  value={formData.balance}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="Enter token balance"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingToken ? 'Update' : 'Set'} Balance
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Tokens List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Current User Balances
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Token Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {userTokens.map((userToken) => (
                  <tr key={userToken.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {(userToken as any).profiles?.email || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {userToken.user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Coins className="h-4 w-4 text-yellow-500 mr-2" />
                        <span className={`text-sm font-medium ${
                          userToken.balance > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {userToken.balance.toLocaleString()} tokens
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(userToken.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => addTokens(userToken.user_id, 100)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Add 100 tokens"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(userToken)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit balance"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(userToken.user_id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete balance"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {userTokens.length === 0 && (
            <div className="text-center py-8">
              <Coins className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No token balances</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by setting a user's token balance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTokens;