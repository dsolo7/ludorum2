import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X, 
  Trophy, 
  Users, 
  Calendar, 
  Coins,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Contest {
  id: string;
  title: string;
  description: string | null;
  model_id: string | null;
  sport_id: string | null;
  betting_type_id: string | null;
  token_cost: number;
  prize_pool: number;
  start_date: string;
  end_date: string | null;
  status: string;
  max_entries: number | null;
  current_entries: number;
  metadata: any;
  created_at: string;
  updated_at: string;
  ai_models?: { name: string };
  sports?: { name: string };
  betting_types?: { name: string };
}

interface ContestEntry {
  id: string;
  contest_id: string;
  user_id: string;
  prediction_value: string;
  confidence_level: number;
  tokens_spent: number;
  is_correct: boolean | null;
  points_earned: number;
  created_at: string;
  profiles?: { email: string };
}

const ContestManagement: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [contestEntries, setContestEntries] = useState<ContestEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contests' | 'entries'>('contests');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    model_id: '',
    sport_id: '',
    betting_type_id: '',
    token_cost: 10,
    prize_pool: 100,
    start_date: '',
    end_date: '',
    max_entries: '',
    status: 'active'
  });

  const [models, setModels] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [betTypes, setBetTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchContests();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (selectedContest) {
      fetchContestEntries(selectedContest.id);
    }
  }, [selectedContest]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contests')
        .select(`
          *,
          ai_models (name),
          sports (name),
          betting_types (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContests(data || []);
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContestEntries = async (contestId: string) => {
    try {
      const { data, error } = await supabase
        .from('contest_entries')
        .select(`
          *,
          profiles!contest_entries_user_id_fkey (email)
        `)
        .eq('contest_id', contestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContestEntries(data || []);
    } catch (error) {
      console.error('Error fetching contest entries:', error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [modelsRes, sportsRes, betTypesRes] = await Promise.all([
        supabase.from('ai_models').select('id, name').eq('is_active', true),
        supabase.from('sports').select('id, name').eq('is_active', true),
        supabase.from('betting_types').select('id, name')
      ]);

      setModels(modelsRes.data || []);
      setSports(sportsRes.data || []);
      setBetTypes(betTypesRes.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      model_id: '',
      sport_id: '',
      betting_type_id: '',
      token_cost: 10,
      prize_pool: 100,
      start_date: '',
      end_date: '',
      max_entries: '',
      status: 'active'
    });
    setEditingContest(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const contestData = {
        title: formData.title,
        description: formData.description || null,
        model_id: formData.model_id || null,
        sport_id: formData.sport_id || null,
        betting_type_id: formData.betting_type_id || null,
        token_cost: formData.token_cost,
        prize_pool: formData.prize_pool,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        max_entries: formData.max_entries ? parseInt(formData.max_entries) : null,
        status: formData.status,
        metadata: {}
      };

      if (editingContest) {
        const { error } = await supabase
          .from('contests')
          .update(contestData)
          .eq('id', editingContest.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contests')
          .insert([contestData]);

        if (error) throw error;
      }

      await fetchContests();
      resetForm();
    } catch (error) {
      console.error('Error saving contest:', error);
      alert('Error saving contest');
    }
  };

  const handleEdit = (contest: Contest) => {
    setFormData({
      title: contest.title,
      description: contest.description || '',
      model_id: contest.model_id || '',
      sport_id: contest.sport_id || '',
      betting_type_id: contest.betting_type_id || '',
      token_cost: contest.token_cost,
      prize_pool: contest.prize_pool,
      start_date: contest.start_date.split('T')[0],
      end_date: contest.end_date ? contest.end_date.split('T')[0] : '',
      max_entries: contest.max_entries?.toString() || '',
      status: contest.status
    });
    setEditingContest(contest);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contest? This will also delete all entries.')) return;

    try {
      const { error } = await supabase
        .from('contests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchContests();
      
      if (selectedContest?.id === id) {
        setSelectedContest(null);
        setContestEntries([]);
      }
    } catch (error) {
      console.error('Error deleting contest:', error);
      alert('Error deleting contest');
    }
  };

  const updateContestStatus = async (contestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contests')
        .update({ status: newStatus })
        .eq('id', contestId);

      if (error) throw error;
      await fetchContests();
      
      if (selectedContest?.id === contestId) {
        setSelectedContest({ ...selectedContest, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating contest status:', error);
      alert('Error updating contest status');
    }
  };

  const resolveContest = async (contestId: string, winnerId?: string) => {
    try {
      // This would implement the contest resolution logic
      // For now, we'll just update the status
      await updateContestStatus(contestId, 'completed');
      alert('Contest resolved successfully!');
    } catch (error) {
      console.error('Error resolving contest:', error);
      alert('Error resolving contest');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'closed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'closed':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Contest Management</h1>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            Contest Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage prediction contests and tournaments
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Contest
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Contests
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {contests.length}
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
                <Play className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Contests
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {contests.filter(c => c.status === 'active').length}
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
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Entries
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {contests.reduce((sum, c) => sum + c.current_entries, 0)}
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
                <Award className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Prize Pool
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {contests.reduce((sum, c) => sum + c.prize_pool, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contest Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="e.g., NFL Week 1 Predictions"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Describe the contest rules and objectives"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  AI Model
                </label>
                <select
                  name="model_id"
                  value={formData.model_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                >
                  <option value="">No specific model</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sport
                </label>
                <select
                  name="sport_id"
                  value={formData.sport_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                >
                  <option value="">Any sport</option>
                  {sports.map(sport => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Betting Type
                </label>
                <select
                  name="betting_type_id"
                  value={formData.betting_type_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                >
                  <option value="">Any betting type</option>
                  {betTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Token Cost *
                </label>
                <input
                  type="number"
                  name="token_cost"
                  value={formData.token_cost}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prize Pool *
                </label>
                <input
                  type="number"
                  name="prize_pool"
                  value={formData.prize_pool}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Entries
                </label>
                <input
                  type="number"
                  name="max_entries"
                  value={formData.max_entries}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="completed">Completed</option>
                </select>
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
                {editingContest ? 'Update' : 'Create'} Contest
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('contests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contests'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            All Contests ({contests.length})
          </button>
          {selectedContest && (
            <button
              onClick={() => setActiveTab('entries')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'entries'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Entries ({contestEntries.length})
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'contests' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((contest) => (
            <div
              key={contest.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
                selectedContest?.id === contest.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedContest(contest)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {contest.title}
                    </h3>
                    {contest.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {contest.description}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(contest);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(contest.id);
                      }}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {contest.ai_models && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Target className="h-4 w-4 mr-2" />
                      {contest.ai_models.name}
                    </div>
                  )}
                  {contest.sports && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Trophy className="h-4 w-4 mr-2" />
                      {contest.sports.name}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(contest.start_date).toLocaleDateString()}
                    {contest.end_date && ` - ${new Date(contest.end_date).toLocaleDateString()}`}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                      {contest.token_cost} tokens
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1 text-purple-500" />
                      {contest.prize_pool} prize
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {contest.current_entries}/{contest.max_entries || '∞'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contest.status)}`}>
                    {getStatusIcon(contest.status)}
                    <span className="ml-1">{contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}</span>
                  </span>
                  
                  {selectedContest?.id === contest.id && (
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      Selected
                    </span>
                  )}
                </div>

                {contest.status === 'active' && (
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateContestStatus(contest.id, 'closed');
                      }}
                      className="flex-1 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
                    >
                      Close
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resolveContest(contest.id);
                      }}
                      className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        selectedContest && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Entries for "{selectedContest.title}"
              </h3>
              
              {contestEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Prediction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Confidence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tokens Spent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Result
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Entry Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {contestEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {entry.profiles?.email || `User ${entry.user_id.slice(0, 8)}...`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {entry.prediction_value}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {entry.confidence_level}/5
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {entry.tokens_spent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.is_correct === null ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Pending
                              </span>
                            ) : entry.is_correct ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Correct
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                Incorrect
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {entry.points_earned}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No entries yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Contest entries will appear here as users participate.
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {contests.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No contests</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first prediction contest.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContestManagement;