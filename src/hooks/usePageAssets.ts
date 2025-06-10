import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PageAsset {
  id: string;
  page_id: string;
  asset_type: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  created_by: string;
  created_at: string;
  public_url?: string;
}

interface UsePageAssetsOptions {
  pageId?: string;
  assetType?: string;
}

export const usePageAssets = (options: UsePageAssetsOptions = {}) => {
  const [assets, setAssets] = useState<PageAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { pageId, assetType } = options;

  useEffect(() => {
    if (pageId) {
      fetchAssets();
    }
  }, [pageId, assetType]);

  const fetchAssets = async () => {
    if (!pageId) return;
    
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('page_assets')
        .select('*')
        .eq('page_id', pageId);
        
      if (assetType) {
        query = query.eq('asset_type', assetType);
      }
      
      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Get public URLs for all assets
      const assetsWithUrls = await Promise.all(data!.map(async (asset) => {
        const { data: urlData } = supabase.storage
          .from('page-assets')
          .getPublicUrl(asset.storage_path);
          
        return {
          ...asset,
          public_url: urlData.publicUrl
        };
      }));
      
      setAssets(assetsWithUrls);
    } catch (error) {
      console.error('Error fetching page assets:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const uploadAsset = async (file: File, assetType: string) => {
    if (!pageId || !file) return null;
    
    try {
      setUploading(true);
      setError(null);
      
      // Convert file to base64
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      const fileData = await fileDataPromise;
      
      // Call the edge function to upload the file
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-page-asset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_id: pageId,
          asset_type: assetType,
          file_name: file.name,
          file_data: fileData,
          mime_type: file.type
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload asset');
      }
      
      await fetchAssets();
      return result;
    } catch (error) {
      console.error('Error uploading asset:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (assetId: string) => {
    try {
      setLoading(true);
      
      // First get the asset to know its storage path
      const { data: asset, error: fetchError } = await supabase
        .from('page_assets')
        .select('storage_path')
        .eq('id', assetId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('page-assets')
        .remove([asset.storage_path]);
        
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('page_assets')
        .delete()
        .eq('id', assetId);
        
      if (dbError) throw dbError;
      
      await fetchAssets();
      return true;
    } catch (error) {
      console.error('Error deleting asset:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    assets,
    loading,
    uploading,
    error,
    uploadAsset,
    deleteAsset,
    refreshAssets: fetchAssets
  };
};

export default usePageAssets;