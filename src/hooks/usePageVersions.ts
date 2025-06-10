import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PageVersion {
  id: string;
  page_id: string;
  version_number: number;
  snapshot: any;
  created_by: string;
  created_at: string;
}

interface UsePageVersionsOptions {
  pageId?: string;
  limit?: number;
}

export const usePageVersions = (options: UsePageVersionsOptions = {}) => {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { pageId, limit = 10 } = options;

  useEffect(() => {
    if (pageId) {
      fetchVersions();
    }
  }, [pageId, limit]);

  const fetchVersions = async () => {
    if (!pageId) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('page_versions')
        .select('*')
        .eq('page_id', pageId)
        .order('version_number', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      
      setVersions(data || []);
      
      if (data && data.length > 0) {
        setCurrentVersion(data[0].version_number);
      }
    } catch (error) {
      console.error('Error fetching page versions:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveVersion = async () => {
    if (!pageId) return null;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('save_page_version', { p_page_id: pageId });
        
      if (error) throw error;
      
      await fetchVersions();
      return data;
    } catch (error) {
      console.error('Error saving page version:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const restoreVersion = async (versionNumber: number) => {
    if (!pageId) return false;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('restore_page_version', { 
          p_page_id: pageId,
          p_version_number: versionNumber
        });
        
      if (error) throw error;
      
      await fetchVersions();
      return data;
    } catch (error) {
      console.error('Error restoring page version:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    versions,
    currentVersion,
    loading,
    error,
    saveVersion,
    restoreVersion,
    refreshVersions: fetchVersions
  };
};

export default usePageVersions;