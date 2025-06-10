import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string;
  target_url: string;
  ad_type: string;
  priority: number;
}

interface UseAdsOptions {
  sportCategory?: string;
  adType?: string;
  placementName?: string;
  limit?: number;
  autoTrackImpressions?: boolean;
}

export const useAds = (options: UseAdsOptions = {}) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    sportCategory,
    adType,
    placementName,
    limit = 3,
    autoTrackImpressions = true
  } = options;

  useEffect(() => {
    fetchAds();
  }, [sportCategory, adType, placementName, limit]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      
      let data, error;
      
      if (placementName) {
        // Use placement-specific function
        const result = await supabase.rpc('get_ads_for_placement', {
          p_placement_name: placementName,
          p_sport_category: sportCategory || null,
          p_limit: limit
        });
        data = result.data;
        error = result.error;
      } else {
        // Use general targeted ads function
        const result = await supabase.rpc('get_targeted_ads', {
          p_sport_category: sportCategory || null,
          p_ad_type: adType || null,
          p_limit: limit
        });
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      setAds(data || []);

      // Auto-track impressions if enabled
      if (autoTrackImpressions && data && data.length > 0) {
        trackImpressions(data);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  const trackImpressions = async (adsToTrack: Ad[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const ad of adsToTrack) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-impression`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ad_id: ad.id,
            user_id: user?.id,
            page_url: window.location.href,
            sport_category: sportCategory,
            device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
          })
        });
      }
    } catch (error) {
      console.error('Error tracking impressions:', error);
    }
  };

  const trackClick = async (adId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-click`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id: adId,
          user_id: user?.id
        })
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  return {
    ads,
    loading,
    error,
    refetch: fetchAds,
    trackClick
  };
};