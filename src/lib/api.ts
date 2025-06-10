import { supabase } from './supabase';

/**
 * Fetches a page layout and its blocks by slug
 * @param slug The page slug to fetch
 * @returns The page data with blocks
 */
export async function fetchPageWithBlocks(slug: string | undefined) {
  if (!slug) return null;
  
  try {
    // Fetch the page
    const { data: page, error: pageError } = await supabase
      .from('page_layouts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (pageError) throw pageError;

    // Fetch the blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('ui_blocks')
      .select('*')
      .eq('page_id', page.id)
      .order('position', { ascending: true });

    if (blocksError) throw blocksError;

    // Return combined data
    return {
      ...page,
      blocks: blocks || []
    };
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

/**
 * Fetches user data needed for visibility rules
 * @returns User visibility data
 */
export async function fetchUserVisibilityData() {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        tokenBalance: 0,
        usedAnalyzers: [],
        joinedContests: [],
        isAuthenticated: false
      };
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
    
    return {
      tokenBalance: tokenData?.balance || 0,
      usedAnalyzers: analyzerData?.map(item => item.model_id) || [],
      joinedContests: contestData?.map(item => item.contest_id) || [],
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Error fetching user visibility data:', error);
    return {
      tokenBalance: 0,
      usedAnalyzers: [],
      joinedContests: [],
      isAuthenticated: false
    };
  }
}

/**
 * Tracks a page view in analytics
 * @param pageId The ID of the page being viewed
 */
export async function trackPageView(pageId: string) {
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
        device_type: deviceType
      })
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

/**
 * Tracks a block interaction in analytics
 * @param blockId The ID of the block being interacted with
 * @param interactionType The type of interaction
 * @param tokensSpent Optional tokens spent during interaction
 */
export async function trackBlockInteraction(blockId: string, interactionType: string, tokensSpent = 0) {
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
}