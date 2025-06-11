import React, { useState } from "react";
import { Trophy, Users, Calendar, Coins, Target, Award, Save, X, Plus, Trash2, Brain, FolderRoot as Football, BarChart2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Contest {
  id?: string;
  title: string;
  description: string;
  model_id?: string;
  sport_id?: string;
  betting_type_id?: string;
  token_cost: number;
  prize_pool: number;
  start_date: string;
  end_date?: string;
  status: 'active' | 'closed' | 'completed';
  max_entries?: number;
}

interface PredictionCard {
  id?: string;
  contest_id?: string;
  title: string;
  description: string;
  prediction_type: 'thumbs_up_down' | 'multiple_choice' | 'numeric';
  options: any[];
  correct_answer?: string;
}

const LeaderboardAndContestEditor: React.FC = () => {
  const [contest, setContest] = useState<Contest>({
    title: '',
    description: '',
    token_cost: 10,
    prize_pool: 100,
    start_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });
  
  const [predictionCards, setPredictionCards] = useState<PredictionCard[]>([]);
  const [newCard, setNewCard] = useState<PredictionCard>({
    title: '',
    description: '',
    prediction_type: 'thumbs_up_down',
    options: []
  });
  
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [betTypes, setBetTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'contest' | 'predictions' | 'leaderboard'>('contest');
  const [newOption, setNewOption] = useState('');
  
  React.useEffect(() => {
    fetchDropdownData();
  }, []);
  
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
  
  const handleContestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setContest(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };
  
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCard(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const addOption = () => {
    if (!newOption.trim()) return;
    
    setNewCard(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
    
    setNewOption('');
  };
  
  const removeOption = (index: number) => {
    setNewCard(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };
  
  const addPredictionCard = () => {
    setPredictionCards(prev => [...prev, newCard]);
    setNewCard({
      title: '',
      description: '',
      prediction_type: 'thumbs_up_down',
      options: []
    });
    setIsAddingCard(false);
  };
  
  const removePredictionCard = (index: number) => {
    setPredictionCards(prev => prev.filter((_, i) => i !== index));
  };
  
  const saveContest = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!contest.title || !contest.token_cost || !contest.prize_pool || !contest.start_date) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Save contest
      const { data: contestData, error: contestError } = await supabase
        .from('contests')
        .insert([{
          title: contest.title,
          description: contest.description,
          model_id: contest.model_id || null,
          sport_id: contest.sport_id || null,
          betting_type_id: contest.betting_type_id || null,
          token_cost: contest.token_cost,
          prize_pool: contest.prize_pool,
          start_date: contest.start_date,
          end_date: contest.end_date || null,
          status: contest.status,
          max_entries: contest.max_entries || null
        }])
        .select()
        .single();
      
      if (contestError) throw contestError;
      
      // Save prediction cards
      if (predictionCards.length > 0) {
        const cardsWithContestId = predictionCards.map(card => ({
          ...card,
          contest_id: contestData.id
        }));
        
        const { error: cardsError } = await supabase
          .from('prediction_cards')
          .insert(cardsWithContestId);
        
        if (cardsError) throw cardsError;
      }
      
      // Reset form
      setContest({
        title: '',
        description: '',
        token_cost: 10,
        prize_pool: 100,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
      
      setPredictionCards([]);
      
      alert('Contest created successfully!');
    } catch (error) {
      console.error('Error saving contest:', error);
      alert('Error saving contest');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
          Create Contest & Leaderboard
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Set up a new prediction contest and configure its leaderboard
        </p>
      </div>
      
      <div className="p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('contest')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contest'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Contest Setup
              </div>
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'predictions'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Prediction Cards
              </div>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'leaderboard'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2" />
                Leaderboard Settings
              </div>
            </button>
          </nav>
        </div>
        
        {/* Contest Setup Tab */}
        {activeTab === 'contest' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contest Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={contest.title}
                  onChange={handleContestChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., NFL Week 5 Predictions"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={contest.description}
                  onChange={handleContestChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Describe the contest rules and objectives"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  AI Model
                </label>
                <select
                  name="model_id"
                  value={contest.model_id || ''}
                  onChange={handleContestChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">No specific model</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Link this contest to a specific AI model
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sport
                </label>
                <select
                  name="sport_id"
                  value={contest.sport_id || ''}
                  onChange={handleContestChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Sports</option>
                  {sports.map(sport => (
                    <option key={sport.id} value={sport.id}>{sport.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Betting Type
                </label>
                <select
                  name="betting_type_id"
                  value={contest.betting_type_id || ''}
                  onChange={handleContestChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Betting Types</option>
                  {betTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Token Cost *
                </label>
                <div className="flex items-center">
                  <Coins className="h-5 w-5 text-yellow-500 mr-2" />
                  <input
                    type="number"
                    name="token_cost"
                    value={contest.token_cost}
                    onChange={handleContestChange}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Tokens required to enter this contest
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prize Pool *
                </label>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-purple-500 mr-2" />
                  <input
                    type="number"
                    name="prize_pool"
                    value={contest.prize_pool}
                    onChange={handleContestChange}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Total prize tokens to be distributed
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date *
                </label>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  <input
                    type="date"
                    name="start_date"
                    value={contest.start_date}
                    onChange={handleContestChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  <input
                    type="date"
                    name="end_date"
                    value={contest.end_date || ''}
                    onChange={handleContestChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave blank for no end date
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Entries
                </label>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-green-500 mr-2" />
                  <input
                    type="number"
                    name="max_entries"
                    value={contest.max_entries || ''}
                    onChange={handleContestChange}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Unlimited"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave blank for unlimited entries
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={contest.status}
                  onChange={handleContestChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Prediction Cards Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                About Prediction Cards
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Prediction cards are the individual questions or prompts that users will respond to in this contest.
                Each card can have different formats like thumbs up/down, multiple choice, or numeric predictions.
              </p>
            </div>
            
            {/* Existing Prediction Cards */}
            {predictionCards.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Prediction Cards ({predictionCards.length})
                </h3>
                
                {predictionCards.map((card, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{card.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.description}</p>
                        
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {card.prediction_type === 'thumbs_up_down' ? 'Thumbs Up/Down' : 
                             card.prediction_type === 'multiple_choice' ? 'Multiple Choice' : 
                             'Numeric Input'}
                          </span>
                        </div>
                        
                        {card.options.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Options:</p>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                              {card.options.map((option, i) => (
                                <li key={i}>{option}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removePredictionCard(index)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Card Form */}
            {isAddingCard ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Add Prediction Card
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Card Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={newCard.title}
                      onChange={handleCardChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g., Will the Chiefs win?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={newCard.description}
                      onChange={handleCardChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Additional context for the prediction"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prediction Type *
                    </label>
                    <select
                      name="prediction_type"
                      value={newCard.prediction_type}
                      onChange={handleCardChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="thumbs_up_down">Thumbs Up/Down</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="numeric">Numeric Input</option>
                    </select>
                  </div>
                  
                  {/* Options for multiple choice */}
                  {newCard.prediction_type === 'multiple_choice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Options
                      </label>
                      
                      <div className="space-y-2 mb-3">
                        {newCard.options.map((option, index) => (
                          <div key={index} className="flex items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                              {index + 1}.
                            </span>
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                              {option}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex">
                        <input
                          type="text"
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Add an option"
                        />
                        <button
                          type="button"
                          onClick={addOption}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingCard(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addPredictionCard}
                      disabled={!newCard.title}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Card
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCard(true)}
                className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 border-dashed rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:border-gray-400 dark:text-gray-300 dark:border-gray-600 dark:hover:text-gray-100 dark:hover:border-gray-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Prediction Card
              </button>
            )}
            
            {predictionCards.length === 0 && !isAddingCard && (
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No prediction cards</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by adding your first prediction card.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Leaderboard Settings Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                About Leaderboards
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Leaderboards are automatically generated from contest entries. You can customize how points are awarded and how the leaderboard is displayed.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Points for Correct Prediction
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., 10"
                  defaultValue={10}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Base points awarded for each correct prediction
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confidence Multiplier
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  defaultValue="yes"
                >
                  <option value="yes">Yes - Multiply by confidence level</option>
                  <option value="no">No - Ignore confidence level</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Whether to multiply points by user's confidence level (1-5)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Leaderboard Visibility
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  defaultValue="public"
                >
                  <option value="public">Public - Visible to all users</option>
                  <option value="participants">Participants Only</option>
                  <option value="private">Private - Admin only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Entries
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., 10"
                  defaultValue={10}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Number of entries to display on the leaderboard
                </p>
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prize Distribution
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="1st: 50%&#10;2nd: 30%&#10;3rd: 20%"
                  defaultValue="1st: 50%&#10;2nd: 30%&#10;3rd: 20%"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  How the prize pool will be distributed among winners
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Leaderboard Preview
              </h3>
              
              <div className="overflow-hidden bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                    {contest.title || 'Contest Leaderboard'}
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-2">
                    {[1, 2, 3].map((rank) => (
                      <div key={rank} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 mr-3">
                            {rank === 1 ? (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <span className="text-sm font-medium">{rank}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            User {rank}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {(100 - (rank - 1) * 25)} points
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={saveContest}
            disabled={loading || !contest.title}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Contest
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardAndContestEditor;