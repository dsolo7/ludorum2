import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PageAnalyticsOptions {
  pageId?: string;
  blockId?: string;
  startDate?: string;
  endDate?: string;
}

export const usePageAnalytics = (options: PageAnalyticsOptions = {}) => {
  const [pageViews, setPageViews] = useState<number>(0);
  const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);
  const [blockInteractions, setBlockInteractions] = useState<Record<string, number>>({});
  const [tokensSpent, setTokensSpent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { pageId, blockId, startDate, endDate } = options;

  useEffect(() => {
    if (pageId) {
      fetchPageAnalytics();
    }
  }, [pageId, blockId, startDate, endDate]);

  const fetchPageAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch page views
      if (pageId) {
        const { data: viewsData, error: viewsError } = await supabase
          .from('page_analytics')
          .select('view_count')
          .eq('page_id', pageId)
          .gte('view_date', startDate || '2000-01-01')
          .lte('view_date', endDate || new Date().toISOString().split('T')[0]);

        if (viewsError) throw viewsError;

        const totalViews = viewsData?.reduce((sum, item) => sum + item.view_count, 0) || 0;
        setPageViews(totalViews);

        // Count unique visitors
        const { count, error: uniqueError } = await supabase
          .from('page_analytics')
          .select('user_id', { count: 'exact', head: true })
          .eq('page_id', pageId)
          .gte('view_date', startDate || '2000-01-01')
          .lte('view_date', endDate || new Date().toISOString().split('T')[0]);

        if (uniqueError) throw uniqueError;
        setUniqueVisitors(count || 0);
      }

      // Fetch block interactions if blockId is provided
      if (blockId) {
        const { data: blockData, error: blockError } = await supabase
          .from('block_analytics')
          .select('interaction_type, interaction_count, tokens_spent')
          .eq('block_id', blockId)
          .gte('interaction_date', startDate || '2000-01-01')
          .lte('interaction_date', endDate || new Date().toISOString().split('T')[0]);

        if (blockError) throw blockError;

        // Group by interaction type
        const interactions: Record<string, number> = {};
        let totalTokens = 0;

        blockData?.forEach(item => {
          interactions[item.interaction_type] = (interactions[item.interaction_type] || 0) + item.interaction_count;
          totalTokens += item.tokens_spent || 0;
        });

        setBlockInteractions(interactions);
        setTokensSpent(totalTokens);
      } else if (pageId) {
        // Fetch all blocks for this page
        const { data: blocksData, error: blocksError } = await supabase
          .from('ui_blocks')
          .select('id')
          .eq('page_id', pageId);

        if (blocksError) throw blocksError;

        if (blocksData && blocksData.length > 0) {
          const blockIds = blocksData.map(block => block.id);
          
          // Fetch interactions for all blocks
          const { data: interactionsData, error: interactionsError } = await supabase
            .from('block_analytics')
            .select('block_id, interaction_type, interaction_count, tokens_spent')
            .in('block_id', blockIds)
            .gte('interaction_date', startDate || '2000-01-01')
            .lte('interaction_date', endDate || new Date().toISOString().split('T')[0]);

          if (interactionsError) throw interactionsError;

          // Group by block and interaction type
          const interactions: Record<string, number> = {};
          let totalTokens = 0;

          interactionsData?.forEach(item => {
            const key = `${item.block_id}_${item.interaction_type}`;
            interactions[key] = (interactions[key] || 0) + item.interaction_count;
            totalTokens += item.tokens_spent || 0;
          });

          setBlockInteractions(interactions);
          setTokensSpent(totalTokens);
        }
      }
    } catch (error) {
      console.error('Error fetching page analytics:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const trackPageView = async (pageId: string, timeOnPage?: number) => {
    try {
      const deviceType = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';
      
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-page-view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_id: pageId,
          device_type: deviceType,
          time_on_page: timeOnPage
        })
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const trackBlockInteraction = async (blockId: string, interactionType: string, tokensSpent: number = 0) => {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-block-interaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          block_id: blockId,
          interaction_type: interactionType,
          tokens_spent: tokensSpent
        })
      });
    } catch (error) {
      console.error('Error tracking block interaction:', error);
    }
  };

  return {
    pageViews,
    uniqueVisitors,
    blockInteractions,
    tokensSpent,
    loading,
    error,
    trackPageView,
    trackBlockInteraction,
    refreshData: fetchPageAnalytics
  };
};

export default usePageAnalytics;