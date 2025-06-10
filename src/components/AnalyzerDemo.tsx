import React, { useState } from 'react';
import { Upload, Brain, AlertCircle, CheckCircle, Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalysisResult {
  model_name: string;
  analysis: string;
  confidence: number;
  recommendations: string[];
  processed_at: string;
}

interface AnalyzerResponse {
  success: boolean;
  result?: AnalysisResult;
  tokens_used?: number;
  remaining_tokens?: number;
  error?: string;
  type?: string;
}

const AnalyzerDemo: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('');
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{ used: number; remaining: number } | null>(null);

  // Mock models for demo
  const models = [
    { id: 'model-1', name: 'NFL Moneyline Predictor' },
    { id: 'model-2', name: 'NBA Player Props Analyzer' },
    { id: 'model-3', name: 'MLB Over/Under Expert' }
  ];

  const handleAnalyze = async () => {
    if (!selectedModel || !inputText.trim()) {
      setError('Please select a model and enter some input text');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setTokenInfo(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in to use the analyzer');
        return;
      }

      // Call the analyzer with token check
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyzer-with-tokens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          model_id: selectedModel,
          input_data: {
            text: inputText,
            timestamp: new Date().toISOString()
          }
        })
      });

      const data: AnalyzerResponse = await response.json();

      if (!response.ok) {
        if (data.type === 'insufficient_tokens') {
          setError(data.error || 'You don\'t have enough tokens to run this analyzer. Please upgrade your plan or earn more tokens.');
        } else {
          setError(data.error || 'Analysis failed');
        }
        return;
      }

      if (data.success && data.result) {
        setResult(data.result);
        if (data.tokens_used && data.remaining_tokens !== undefined) {
          setTokenInfo({
            used: data.tokens_used,
            remaining: data.remaining_tokens
          });
        }
      } else {
        setError('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to connect to analyzer service');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Brain className="h-6 w-6 mr-2 text-indigo-600" />
          AI Sports Analyzer Demo
        </h2>

        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select AI Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
          >
            <option value="">Choose a model...</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Input Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Betting Information
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
            placeholder="Enter your betting slip details, player information, or game analysis request..."
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !selectedModel || !inputText.trim()}
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Analyze with AI
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Analysis Failed
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
                {error.includes('tokens') && (
                  <div className="mt-3">
                    <button className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded text-sm hover:bg-red-200 dark:hover:bg-red-700">
                      Upgrade Plan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Token Usage Info */}
        {tokenInfo && (
          <div className="mt-6 rounded-md bg-blue-50 dark:bg-blue-900/30 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Coins className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Token Usage
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  Used: {tokenInfo.used} tokens • Remaining: {tokenInfo.remaining} tokens
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="mt-6 rounded-md bg-green-50 dark:bg-green-900/30 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Analysis Complete - {result.model_name}
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <div className="mb-3">
                    <strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="mb-3">
                    <strong>Analysis:</strong>
                    <p className="mt-1">{result.analysis}</p>
                  </div>
                  <div>
                    <strong>Recommendations:</strong>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzerDemo;