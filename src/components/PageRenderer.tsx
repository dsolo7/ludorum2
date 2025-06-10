import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import AffiliateAdCard from './AffiliateAdCard';
import AnalyzerDemo from './AnalyzerDemo';
import UserAchievements from './UserAchievements';
import { useAds } from '../hooks/useAds';
import ConfettiAnimation from './ConfettiAnimation';
import UserDashboardHeader from './UserDashboardHeader';

interface PageLayout {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  metadata: any;
}

interface UIBlock {
  id: string;
  page_id: string;
  title: string;
  description: string | null;
  block_type: 'analyzer' | 'contest' | 'leaderboard' | 'ad' | 'text' | 'custom';
  content: any;
  position: number;
  background_color: string | null;
  visibility_rules: any;
  animation: string | null;
  layout_mode: string | null;
}

interface UserVisibilityData {
  tokenBalance: number;
  usedAnalyzers: string[];
  joinedContests: string[];
  isAuthenticated: boolean;
}

const PageRenderer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageLayout | null>(null);
  const [blocks, setBlocks] = useState<UIBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [analyticsTracked, setAnalyticsTracked] = useState(false);
  const [userVisibilityData, setUserVisibilityData] = useState<UserVisibilityData>({
    tokenBalance: 0,
    usedAnalyzers: [],
    joinedContests: [],
    isAuthenticated: false
  });
  
  const { ads, trackClick } = useAds();

  useEffect(() => {
    if (slug) {
      fetchPage(slug);
      fetchUserVisibilityData();
    }
  }, [slug]);

  useEffect(() => {
    // Check for confetti animation blocks
    const hasConfetti = blocks.some(block => block.animation === 'confetti');
    if (hasConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    // Track page view analytics
    if (page && blocks.length > 0 && !analyticsTracked) {
      trackPageView();
    }
  }, [page, blocks]);

  const fetchUserVisibilityData = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserVisibilityData({
          tokenBalance: 0,
          usedAnalyzers: [],
          joinedContests: [],
          isAuthenticated: false
        });
        return;
      }
      
      // Fetch user token balance
      const { data: tokenData } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      // Fetch analyzers the user has used
      const { data: analyzerData } = await supabase
        .from('analyzer_requests')
        .select('model_id')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      // Fetch contests the user has joined
      const { data: contestData } = await supabase
        .from('contest_entries')
        .select('contest_id')
        .eq('user_id', user.id);
      
      setUserVisibilityData({
        tokenBalance: tokenData?.balance || 0,
        usedAnalyzers: analyzerData?.map(item => item.model_id) || [],
        joinedContests: contestData?.map(item => item.contest_id) || [],
        isAuthenticated: true
      });
      
    } catch (error) {
      console.error('Error fetching user visibility data:', error);
    }
  };

  const fetchPage = async (pageSlug: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the page
      const { data: pageData, error: pageError } = await supabase
        .from('page_layouts')
        .select('*')
        .eq('slug', pageSlug)
        .eq('is_published', true)
        .single();

      if (pageError) {
        throw new Error('Page not found');
      }

      setPage(pageData);

      // Fetch the blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from('ui_blocks')
        .select('*')
        .eq('page_id', pageData.id)
        .order('position', { ascending: true });

      if (blocksError) {
        throw new Error('Failed to load page content');
      }

      setBlocks(blocksData || []);
    } catch (error) {
      console.error('Error fetching page:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkVisibility = (block: UIBlock): boolean => {
    // If no visibility rules, always show the block
    if (!block.visibility_rules || Object.keys(block.visibility_rules).length === 0) {
      return true;
    }
    
    const rules = block.visibility_rules as Record<string, any>;
    
    // Check authentication requirement
    if (rules.requiresAuth === true && !userVisibilityData.isAuthenticated) {
      return false;
    }
    
    // Check minimum token balance
    if (rules.minTokens !== undefined && userVisibilityData.tokenBalance < rules.minTokens) {
      return false;
    }
    
    // Check if user has used a specific analyzer
    if (rules.hasUsedAnalyzer && !userVisibilityData.usedAnalyzers.includes(rules.hasUsedAnalyzer)) {
      return false;
    }
    
    // Check if user has joined a specific contest
    if (rules.joinedContest && !userVisibilityData.joinedContests.includes(rules.joinedContest)) {
      return false;
    }
    
    // Check if user has joined any contest
    if (rules.hasJoinedAnyContest === true && userVisibilityData.joinedContests.length === 0) {
      return false;
    }
    
    // Check if user has used any analyzer
    if (rules.hasUsedAnyAnalyzer === true && userVisibilityData.usedAnalyzers.length === 0) {
      return false;
    }
    
    return true;
  };

  const trackPageView = async () => {
    try {
      // In a real implementation, this would track the page view in the database
      // For now, we'll just log it to the console
      console.log('Page view tracked:', page?.name);
      
      // Mark as tracked to prevent multiple tracking
      setAnalyticsTracked(true);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const trackBlockInteraction = async (blockId: string, interactionType: string) => {
    try {
      // In a real implementation, this would track the block interaction in the database
      // For now, we'll just log it to the console
      console.log('Block interaction tracked:', blockId, interactionType);
    } catch (error) {
      console.error('Error tracking block interaction:', error);
    }
  };

  const renderBlock = (block: UIBlock) => {
    // Check if block should be visible based on visibility rules
    if (!checkVisibility(block)) {
      return null;
    }

    const blockStyle = {
      backgroundColor: block.background_color || 'transparent'
    };

    // Apply layout mode styles
    let layoutClass = '';
    switch (block.layout_mode) {
      case 'carousel':
        layoutClass = 'overflow-x-auto whitespace-nowrap pb-4';
        break;
      case 'horizontal-scroll':
        layoutClass = 'overflow-x-auto flex space-x-4 pb-4';
        break;
      case 'grid':
        layoutClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
        break;
      case 'stacked':
        layoutClass = 'space-y-4';
        break;
      default:
        layoutClass = '';
    }

    // Apply animation classes
    let animationClass = '';
    switch (block.animation) {
      case 'fade': animationClass = 'animate-fade-in'; break;
      case 'slide': animationClass = 'animate-slide-in'; break;
      case 'bounce': animationClass = 'animate-bounce'; break;
      default: animationClass = '';
    }

    switch (block.block_type) {
      case 'analyzer':
        return (
          <div className={`p-6 rounded-lg ${animationClass}`} style={blockStyle} onClick={() => trackBlockInteraction(block.id, 'view')}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">{block.title} {block.animation === 'confetti' && <Sparkles className="ml-2 h-5 w-5 text-yellow-500" />}</h3>
            {block.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{block.description}</p>
            )}
            <AnalyzerDemo />
          </div>
        );
      
      case 'contest':
        return (
          <div className={`p-6 rounded-lg ${animationClass}`} style={blockStyle} onClick={() => trackBlockInteraction(block.id, 'view')}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">{block.title} {block.animation === 'confetti' && <Sparkles className="ml-2 h-5 w-5 text-yellow-500" />}</h3>
            {block.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{block.description}</p>
            )}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Contest content would be rendered here based on contest ID: {block.content?.contest_id || 'None selected'}
              </p>
              {block.content?.showPrizePool && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 font-medium">Prize Pool: 1000 tokens</p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'leaderboard':
        return (
          <div className={`p-6 rounded-lg ${animationClass}`} style={blockStyle} onClick={() => trackBlockInteraction(block.id, 'view')}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">{block.title} {block.animation === 'confetti' && <Sparkles className="ml-2 h-5 w-5 text-yellow-500" />}</h3>
            {block.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{block.description}</p>
            )}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Leaderboard for {block.content?.sport || 'All Sports'} would be rendered here.
                Showing top {block.content?.limit || 10} entries.
              </p>
            </div>
          </div>
        );
      
      case 'ad':
        return (
          <div className={`p-6 rounded-lg ${animationClass}`} style={blockStyle} onClick={() => trackBlockInteraction(block.id, 'view')}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">{block.title} {block.animation === 'confetti' && <Sparkles className="ml-2 h-5 w-5 text-yellow-500" />}</h3>
            {block.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{block.description}</p>
            )}
            {ads.length > 0 ? (
              <AffiliateAdCard
                ad={{
                  id: ads[0].id,
                  title: ads[0].title,
                  description: ads[0].description || '',
                  image_url: ads[0].image_url || '',
                  cta_text: 'Learn More',
                  target_url: ads[0].target_url,
                  offer_text: 'Special Offer',
                  rating: 4.5,
                  badge: 'Featured'
                }}
                placement={block.content?.placement || 'inline'}
                onTrackClick={trackClick}
              />
            ) : (
              <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-300">Ad would be displayed here</p>
              </div>
            )}
          </div>
        );
      
      case 'text':
        const textSize = block.content?.textSize || 'medium';
        const textSizeClass = 
          textSize === 'large' ? 'text-xl' : 
          textSize === 'small' ? 'text-sm' : 
          'text-base';
        
        return (
          <div className={`p-6 rounded-lg ${animationClass}`} style={blockStyle} onClick={() => trackBlockInteraction(block.id, 'view')}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">{block.title} {block.animation === 'confetti' && <Sparkles className="ml-2 h-5 w-5 text-yellow-500" />}</h3>
            <div className={`prose dark:prose-invert max-w-none ${textSizeClass}`}>
              <p>{block.content?.text || 'No text content provided'}</p>
            </div>
          </div>
        );
      
      case 'custom':
        return (
          <div className={`p-6 rounded-lg ${animationClass}`} style={blockStyle} onClick={() => trackBlockInteraction(block.id, 'view')}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">{block.title} {block.animation === 'confetti' && <Sparkles className="ml-2 h-5 w-5 text-yellow-500" />}</h3>
            {block.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{block.description}</p>
            )}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Custom component "{block.content?.component || 'Unknown'}" would be rendered here.
              </p>
              {block.content?.component === 'UserAchievements' && <UserAchievements />}
            </div>
          </div>
        );
      
      default:
        return (
          <div className={`p-6 rounded-lg ${animationClass}`} style={blockStyle} onClick={() => trackBlockInteraction(block.id, 'view')}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">{block.title} {block.animation === 'confetti' && <Sparkles className="ml-2 h-5 w-5 text-yellow-500" />}</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Unknown block type: {block.block_type}
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading page...</span>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300">{error || 'The requested page does not exist or is not published.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UserDashboardHeader />
      <ConfettiAnimation isActive={showConfetti} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {blocks.map((block) => block.layout_mode === 'standard' ? (
          renderBlock(block) && (
            <div key={block.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
              {renderBlock(block)}
            </div>
          )
        ) : (
          checkVisibility(block) && (
            <div key={block.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">{block.title} {block.animation === 'confetti' && <Sparkles className="ml-2 h-5 w-5 text-yellow-500" />}</h3>
              {block.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">{block.description}</p>
              )}
              <div className={renderBlock(block)?.props?.className?.replace('p-6 rounded-lg', '') || ''}>
                {/* Render content based on layout mode */}
                {block.layout_mode === 'carousel' && (
                  <div className="flex space-x-4 overflow-x-auto pb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-64 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white">Item {i + 1}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sample carousel item</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {block.layout_mode === 'horizontal-scroll' && (
                  <div className="flex space-x-4 overflow-x-auto pb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-64 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white">Item {i + 1}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sample scroll item</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {block.layout_mode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white">Item {i + 1}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sample grid item</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {block.layout_mode === 'stacked' && (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white">Card {i + 1}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sample stacked card</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        ))}
        
        {blocks.length === 0 && (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">No Content Yet</h3>
            <p className="text-gray-600 dark:text-gray-300">
              This page has no content blocks. Please check back later.
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Debugging UI - Only visible in development */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
          <h4 className="text-sm font-semibold mb-2">Visibility Data (Debug)</h4>
          <div className="text-xs space-y-1">
            <p><span className="font-medium">Auth:</span> {userVisibilityData.isAuthenticated ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Tokens:</span> {userVisibilityData.tokenBalance}</p>
            <p><span className="font-medium">Used Analyzers:</span> {userVisibilityData.usedAnalyzers.length}</p>
            <p><span className="font-medium">Joined Contests:</span> {userVisibilityData.joinedContests.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageRenderer;