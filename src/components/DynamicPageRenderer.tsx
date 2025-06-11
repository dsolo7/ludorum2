import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { fetchPageWithBlocks, fetchUserVisibilityData, trackPageView, trackBlockInteraction } from '../lib/api';
import { isBlockVisible, isMobile } from '../utils/visibility';
import { TokenGate } from './TokenGate';
import { AnalyzerCard } from './AnalyzerCard';
import { ContestCard } from './ContestCard';
import { Leaderboard } from './Leaderboard';
import { AdBlock } from './AdBlock';
import { StaticText } from './StaticText';
import AffiliateAdCard from './AffiliateAdCard';
import AnalyzerDemo from './AnalyzerDemo';
import UserAchievements from './UserAchievements';
import { useAds } from '../hooks/useAds';
import ConfettiAnimation from './ConfettiAnimation';
import UserDashboardHeader from './UserDashboardHeader';

interface PageData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  metadata: any;
  blocks: UIBlock[];
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

const DynamicPageRenderer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [analyticsTracked, setAnalyticsTracked] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  const { ads, trackClick } = useAds();

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      try {
        const pageData = await fetchPageWithBlocks(slug);
        if (!pageData) {
          setError('Page not found');
          return;
        }
        setPage(pageData);
        
        // Fetch user data for visibility rules
        const userVisibilityData = await fetchUserVisibilityData();
        setUserData({
          ...userVisibilityData,
          role: userVisibilityData.isAuthenticated ? 'user' : null,
          tokens: userVisibilityData.tokenBalance
        });
        
        setError(null);
      } catch (err) {
        console.error('Error loading page:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  useEffect(() => {
    // Check for confetti animation blocks
    if (page?.blocks) {
      const hasConfetti = page.blocks.some(block => block.animation === 'confetti');
      if (hasConfetti) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
    
    // Track page view analytics
    if (page && !analyticsTracked) {
      trackPageView(page.id);
      setAnalyticsTracked(true);
    }
  }, [page, analyticsTracked]);

  const handleBlockInteraction = (blockId: string, interactionType: string) => {
    trackBlockInteraction(blockId, interactionType);
  };

  // Filter blocks based on visibility rules and device type
  const getVisibleBlocks = () => {
    if (!page?.blocks) return [];
    
    return page.blocks
      .filter(block => isBlockVisible(block, userData))
      .sort((a, b) => a.position - b.position);
  };

  const renderBlock = (block: UIBlock) => {
    switch (block.block_type) {
      case 'analyzer':
        return <AnalyzerCard data={{
          title: block.title,
          description: block.description || undefined,
          token_cost: block.content?.token_cost,
          analyzer_id: block.content?.analyzer_id,
          sport: block.content?.sport
        }} />;
      
      case 'contest':
        return <ContestCard data={{
          title: block.title,
          description: block.description || undefined,
          token_cost: block.content?.token_cost,
          prize_pool: block.content?.prize_pool,
          current_entries: block.content?.current_entries,
          max_entries: block.content?.max_entries,
          contest_id: block.content?.contest_id
        }} />;
      
      case 'leaderboard':
        return <Leaderboard data={{
          contest_name: block.title,
          sport: block.content?.sport,
          limit: block.content?.limit,
          entries: block.content?.entries
        }} />;
      
      case 'ad':
        return <AdBlock data={{
          headline: block.title,
          subtext: block.description || undefined,
          link: block.content?.link,
          image_url: block.content?.image_url,
          badge: block.content?.badge,
          offer: block.content?.offer,
          cta_text: block.content?.cta_text,
          placement: block.content?.placement
        }} />;
      
      case 'text':
        return <StaticText data={{
          content: block.content?.text,
          textSize: block.content?.textSize,
          textAlign: block.content?.textAlign,
          textColor: block.content?.textColor,
          backgroundColor: block.content?.backgroundColor
        }} />;
      
      default:
        return (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white">{block.title}</h3>
            {block.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{block.description}</p>
            )}
            <div className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
              {JSON.stringify(block.content, null, 2)}
            </div>
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
        {/* Mobile-specific layout adjustments */}
        <div className={`space-y-8 ${isMobile() ? 'mobile-layout' : ''}`}>
          {getVisibleBlocks().map((block) => (
            <TokenGate key={block.id} rule={block.visibility_rules}>
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                {renderBlock(block)}
              </div>
            </TokenGate>
          ))}
          
          {page.blocks.length === 0 && (
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
            <p><span className="font-medium">Auth:</span> {userData?.isAuthenticated ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Role:</span> {userData?.role || 'none'}</p>
            <p><span className="font-medium">Tokens:</span> {userData?.tokens || 0}</p>
            <p><span className="font-medium">Device:</span> {isMobile() ? 'Mobile' : 'Desktop'}</p>
            <p><span className="font-medium">Used Analyzers:</span> {userData?.usedAnalyzers?.length || 0}</p>
            <p><span className="font-medium">Joined Contests:</span> {userData?.joinedContests?.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicPageRenderer;