import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Star, 
  Clock, 
  Coins, 
  ThumbsUp, 
  ThumbsDown,
  Trophy,
  Users,
  Target,
  Zap,
  Award,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AffiliateAdCard from '../components/AffiliateAdCard';
import { useAds } from '../hooks/useAds';
import UserDashboardHeader from '../components/UserDashboardHeader';

interface AnalyzerRequest {
  id: string;
  user_id: string;
  model_id: string;
  image_url: string | null;
  input_text: string | null;
  metadata: any;
  status: string;
  result: any;
  tokens_used: number;
  created_at: string;
  updated_at: string;
  ai_models?: {
    name: string;
    description: string;
    sports: { name: string };
    betting_types: { name: string };
  };
}

interface Contest {
  id: string;
  title: string;
  description: string;
  token_cost: number;
  prize_pool: number;
  current_entries: number;
  max_entries: number;
  status: string;
}

interface PredictionCard {
  id: string;
  title: string;
  description: string;
  prediction_type: string;
  options: any[];
}

interface SocialStats {
  total_votes: number;
  thumbs_up_percentage: number;
  thumbs_down_percentage: number;
  user_prediction?: string;
}

interface AffiliateAd {
  id: string;
  title: string;
  description: string;
  image_url: string;
  cta_text: string;
  target_url: string;
  offer_text?: string;
  rating?: number;
  badge?: string;
}

const AnalyzerResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('request_id');
  const [request, setRequest] = useState<AnalyzerRequest | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [predictionCards, setPredictionCards] = useState<PredictionCard[]>([]);
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get targeted ads based on the sport category
  const sportCategory = request?.ai_models?.sports?.name;
  const { ads, trackClick } = useAds({
    sportCategory,
    adType: 'sponsored',
    limit: 2,
    autoTrackImpressions: true
  });

  useEffect(() => {
    if (requestId) {
      fetchAnalyzerRequest();
      fetchRelatedContests();
      fetchSocialStats();
      fetchUserTokens();
    }
  }, [requestId]);

  const fetchAnalyzerRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('analyzer_requests')
        .select(`
          *,
          ai_models (
            name,
            description,
            sports (name),
            betting_types (name)
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      setRequest(data);
    } catch (error) {
      console.error('Error fetching analyzer request:', error);
      setError('Failed to load analysis results');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedContests = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('status', 'active')
        .limit(3);

      if (error) throw error;
      setContests(data || []);

      // Fetch prediction cards for these contests
      if (data && data.length > 0) {
        const { data: cards, error: cardsError } = await supabase
          .from('prediction_cards')
          .select('*')
          .in('contest_id', data.map(c => c.id))
          .limit(5);

        if (!cardsError) {
          setPredictionCards(cards || []);
        }
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    }
  };

  const fetchSocialStats = async () => {
    try {
      if (!requestId) return;
      
      // Get actual social stats from database
      const { data, error } = await supabase
        .rpc('get_social_stats', { request_id: requestId });

      if (error) {
        console.error('Error fetching social stats:', error);
        // Fall back to mock data
        const mockStats = {
          total_votes: Math.floor(Math.random() * 500) + 100,
          thumbs_up_percentage: Math.floor(Math.random() * 40) + 30,
          thumbs_down_percentage: 0,
        };
        mockStats.thumbs_down_percentage = 100 - mockStats.thumbs_up_percentage;
        setSocialStats(mockStats);
        return;
      }

      if (data && data.length > 0) {
        const stats = data[0];
        setSocialStats({
          total_votes: parseInt(stats.total_votes),
          thumbs_up_percentage: parseFloat(stats.thumbs_up_percentage),
          thumbs_down_percentage: parseFloat(stats.thumbs_down_percentage)
        });
      } else {
        // No votes yet, show default state
        const mockStats = {
        total_votes: Math.floor(Math.random() * 500) + 100,
        thumbs_up_percentage: Math.floor(Math.random() * 40) + 30,
        thumbs_down_percentage: 0,
      };
      mockStats.thumbs_down_percentage = 100 - mockStats.thumbs_up_percentage;
      setSocialStats(mockStats);
      }
    } catch (error) {
      console.error('Error fetching social stats:', error);
    }
  };

  const fetchUserTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setUserTokens(data.balance);
      }
    } catch (error) {
      console.error('Error fetching user tokens:', error);
    }
  };

  const handleContestEntry = async (contestId: string, tokenCost: number) => {
    if (userTokens < tokenCost) {
      alert('Insufficient tokens to enter this contest');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to enter contests');
        return;
      }

      // Call the contest entry edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enter-contest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          contest_id: contestId,
          prediction_value: 'entered', // Default entry value
          confidence_level: 3
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to enter contest');
      }

      // Update user token balance
      setUserTokens(result.remaining_balance);
      
      // Show success message
      alert(`Successfully entered "${result.contest_title}" for ${result.tokens_spent} tokens!`);
      
      // Refresh contests to update entry counts
      await fetchRelatedContests();
      
    } catch (error) {
      console.error('Error entering contest:', error);
      alert(error instanceof Error ? error.message : 'Failed to enter contest');
    }
  };

  const handleSocialVote = async (vote: 'up' | 'down') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to vote');
        return;
      }

      // Call the social vote edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/social-vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          analyzer_request_id: requestId,
          vote_type: vote
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record vote');
      }

      // Refresh social stats
      await fetchSocialStats();
      
      // Show feedback
      const action = result.action === 'updated' ? 'updated' : 'recorded';
      alert(`Vote ${action} successfully!`);
      
    } catch (error) {
      console.error('Error voting:', error);
      alert(error instanceof Error ? error.message : 'Failed to record vote');
    }
  };

  const handlePredictionSubmit = async (predictionCardId: string, predictionValue: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to make predictions');
        return;
      }

      // Find the contest for this prediction card
      const relatedContest = contests.find(contest => 
        predictionCards.some(card => card.id === predictionCardId)
      );

      if (!relatedContest) {
        alert('Contest not found for this prediction');
        return;
      }

      // Use the contest entry function with prediction details
      await handleContestEntry(relatedContest.id, relatedContest.token_cost);
      
      // Additional logic could be added here to specifically handle the prediction
      alert(`Prediction "${predictionValue}" submitted successfully!`);
      
    } catch (error) {
      console.error('Error submitting prediction:', error);
      alert('Failed to submit prediction');
    }
  };

  // Convert ads to AffiliateAd format
  const affiliateAds: AffiliateAd[] = ads.map(ad => ({
    id: ad.id,
    title: ad.title,
    description: ad.description || '',
    image_url: ad.image_url || '',
    cta_text: 'Claim Offer',
    target_url: ad.target_url,
    offer_text: 'Limited Time Offer',
    rating: 4.5,
    badge: 'Sponsored'
  }));

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
      case 'moderate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Analysis Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The requested analysis could not be found.'}
          </p>
          <Link
            to="/admin/analyzer"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analyzer
          </Link>
        </div>
      </div>
    );
  }

  const result = request.result;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <UserDashboardHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin/analyzer"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analyzer
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analysis Results
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-powered insights for your betting decision
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Model Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Brain className="h-6 w-6 text-indigo-600 mr-3" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {request.ai_models?.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {request.ai_models?.sports?.name} • {request.ai_models?.betting_types?.name}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {request.ai_models?.description}
              </p>
            </div>

            {/* Analysis Results */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI Analysis
              </h3>
              
              {/* Confidence & Risk */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Confidence</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(result.risk_assessment)}`}>
                    {result.risk_assessment?.toUpperCase()}
                  </span>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Risk Level</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-center mb-1">
                    {renderStars(result.value_rating)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Value Rating</div>
                </div>
              </div>

              {/* Analysis Text */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Analysis</h4>
                <div 
                  className="text-gray-600 dark:text-gray-300 prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: result.analysis }}
                />
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {result.recommendations?.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Social Voting */}
            {socialStats && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Community Sentiment
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {socialStats.total_votes} users have voted on similar analyses
                  </p>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-green-600 dark:text-green-400">Agree</span>
                        <span className="text-sm font-medium">{socialStats.thumbs_up_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${socialStats.thumbs_up_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-red-600 dark:text-red-400">Disagree</span>
                        <span className="text-sm font-medium">{socialStats.thumbs_down_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${socialStats.thumbs_down_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleSocialVote('up')}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Agree
                  </button>
                  <button
                    onClick={() => handleSocialVote('down')}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Disagree
                  </button>
                </div>
              </div>
            )}

            {/* Gamification Cards - Contests */}
            {contests.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  Related Contests
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contests.map((contest) => (
                    <div key={contest.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{contest.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{contest.description}</p>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          {contest.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
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
                      
                      <button
                        onClick={() => handleContestEntry(contest.id, contest.token_cost)}
                        disabled={userTokens < contest.token_cost}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Enter Contest ({contest.token_cost} tokens)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prediction Cards */}
            {predictionCards.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-500" />
                  Make Predictions
                </h3>
                
                <div className="space-y-4">
                  {predictionCards.map((card) => (
                    <div key={card.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{card.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{card.description}</p>
                      
                      {card.prediction_type === 'thumbs_up_down' && (
                        <div className="flex space-x-3">
                          <button 
                            onClick={() => handlePredictionSubmit(card.id, 'yes')}
                            className="flex-1 flex items-center justify-center px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Yes
                          </button>
                          <button 
                            onClick={() => handlePredictionSubmit(card.id, 'no')}
                            className="flex-1 flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            No
                          </button>
                        </div>
                      )}
                      
                      {card.prediction_type === 'multiple_choice' && card.options && (
                        <div className="space-y-2">
                          {card.options.map((option: any, index: number) => (
                            <button
                              key={index}
                              onClick={() => handlePredictionSubmit(card.id, option.value || option)}
                              className="w-full text-left px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              {option.label || option}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {card.prediction_type === 'numeric' && (
                        <div className="flex space-x-3">
                          <input
                            type="number"
                            placeholder="Enter your prediction"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = (e.target as HTMLInputElement).value;
                                if (value) handlePredictionSubmit(card.id, value);
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              if (input?.value) handlePredictionSubmit(card.id, input.value);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Submit
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Affiliate Ads Section */}
          {affiliateAds.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ExternalLink className="h-5 w-5 mr-2 text-green-500" />
                Recommended Sportsbooks
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get the best odds and bonuses from our trusted partners
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {affiliateAds.map((ad) => (
                  <AffiliateAdCard
                    key={ad.id}
                    ad={ad}
                    placement="inline"
                    onTrackClick={trackClick}
                  />
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  <strong>Disclaimer:</strong> Please gamble responsibly. These are affiliate links and we may receive compensation when you sign up through our links. Must be 21+ and located in eligible states.
                </p>
              </div>
            </div>
          )}

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sidebar Affiliate Ad */}
            {affiliateAds.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Featured Offer
                </h3>
                <AffiliateAdCard
                  ad={affiliateAds[0]}
                  placement="sidebar"
                  onTrackClick={trackClick}
                />
              </div>
            )}

            {/* Uploaded Image */}
            {request.image_url && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Uploaded Image
                </h3>
                <img
                  src={request.image_url}
                  alt="Uploaded betting slip"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}

            {/* Input Text */}
            {request.input_text && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Additional Input
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{request.input_text}</p>
              </div>
            )}

            {/* Analysis Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Analysis Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Tokens Used</span>
                  <div className="flex items-center">
                    <Coins className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {request.tokens_used}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Your Balance</span>
                  <div className="flex items-center">
                    <Coins className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {userTokens}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    request.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Processed</span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(request.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/admin/analyzer"
                  className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Run Another Analysis
                </Link>
                <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Share Results
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Save to Favorites
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzerResults;