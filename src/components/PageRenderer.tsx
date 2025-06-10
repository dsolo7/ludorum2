import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import AffiliateAdCard from './AffiliateAdCard';
import AnalyzerDemo from './AnalyzerDemo';
import UserAchievements from './UserAchievements';
import { useAds } from '../hooks/useAds';

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
}

const PageRenderer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageLayout | null>(null);
  const [blocks, setBlocks] = useState<UIBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { ads, trackClick } = useAds();

  useEffect(() => {
    if (slug) {
      fetchPage(slug);
    }
  }, [slug]);

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

  const renderBlock = (block: UIBlock) => {
    // Check visibility rules
    if (block.visibility_rules && Object.keys(block.visibility_rules).length > 0) {
      // In a real implementation, we would check these rules against the user's state
      // For now, we'll just render all blocks
    }

    const blockStyle = {
      backgroundColor: block.background_color || 'transparent'
    };

    switch (block.block_type) {
      case 'analyzer':
        return (
          <div className="p-6 rounded-lg" style={blockStyle}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{block.title}</h3>
            {block.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{block.description}</p>
            )}
            <AnalyzerDemo />
          </div>
        );
      
      case 'contest':
        return (
          <div className="p-6 rounded-lg" style={blockStyle}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{block.title}</h3>
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
          <div className="p-6 rounded-lg" style={blockStyle}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{block.title}</h3>
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
          <div className="p-6 rounded-lg" style={blockStyle}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{block.title}</h3>
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
          <div className="p-6 rounded-lg" style={blockStyle}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{block.title}</h3>
            <div className={`prose dark:prose-invert max-w-none ${textSizeClass}`}>
              <p>{block.content?.text || 'No text content provided'}</p>
            </div>
          </div>
        );
      
      case 'custom':
        return (
          <div className="p-6 rounded-lg" style={blockStyle}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{block.title}</h3>
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
          <div className="p-6 rounded-lg" style={blockStyle}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{block.title}</h3>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {blocks.map((block) => (
          <div key={block.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
            {renderBlock(block)}
          </div>
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
  );
};

export default PageRenderer;