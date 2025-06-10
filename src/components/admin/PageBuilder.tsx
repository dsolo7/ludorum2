import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Layout,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Globe,
  Layers,
  Settings,
  Copy
} from 'lucide-react';
import {
  Download,
  Upload,
  Sparkles,
  Palette,
  BarChart3,
  FileJson,
  Repeat,
  Smartphone,
  Laptop,
  Grid,
  Rows,
  Columns,
  Scroll
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PageLayout {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
  analytics: any;
}

const PageBuilder: React.FC = () => {
  const [pages, setPages] = useState<PageLayout[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageLayout | null>(null);
  const [blocks, setBlocks] = useState<UIBlock[]>([]);
  const [isPageFormOpen, setIsPageFormOpen] = useState(false);
  const [isBlockFormOpen, setIsBlockFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageLayout | null>(null);
  const [editingBlock, setEditingBlock] = useState<UIBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageFormData, setPageFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_published: false,
    metadata: '{}'
  });
  const [blockFormData, setBlockFormData] = useState({
    title: '',
    description: '',
    block_type: 'text' as UIBlock['block_type'],
    content: '{}',
    background_color: '',
    visibility_rules: '{}',
    animation: '',
    layout_mode: 'standard'
  });
  const [analyticsData, setAnalyticsData] = useState<Record<string, any>>({});
  const [exportData, setExportData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchBlocks(selectedPage.id);
    }
  }, [selectedPage]);
  
  useEffect(() => {
    if (selectedPage) {
      fetchAnalytics(selectedPage.id);
    }
  }, [selectedPage]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('page_layouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from('ui_blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('position', { ascending: true });

      if (error) throw error;
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    }
  };

  const fetchAnalytics = async (pageId: string) => {
    try {
      // In a real implementation, this would fetch actual analytics data
      // For now, we'll generate mock data
      const mockAnalytics: Record<string, any> = {};
      
      // Generate mock data for each block
      blocks.forEach(block => {
        mockAnalytics[block.id] = {
          views: Math.floor(Math.random() * 1000) + 100,
          interactions: Math.floor(Math.random() * 500) + 50,
          tokens_spent: block.block_type === 'analyzer' ? Math.floor(Math.random() * 2000) + 200 : 0,
          conversion_rate: Math.random() * 0.2 + 0.05,
          last_30_days: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100))
        };
      });
      
      // Page-level analytics
      mockAnalytics['page'] = {
        total_views: Math.floor(Math.random() * 5000) + 1000,
        unique_visitors: Math.floor(Math.random() * 2000) + 500,
        avg_time_on_page: Math.floor(Math.random() * 180) + 60,
        bounce_rate: Math.random() * 0.4 + 0.2,
        devices: {
          mobile: Math.floor(Math.random() * 60) + 20,
          desktop: Math.floor(Math.random() * 40) + 10,
          tablet: Math.floor(Math.random() * 20) + 5
        }
      };
      
      setAnalyticsData(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handlePageInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setPageFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleBlockInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setBlockFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const resetPageForm = () => {
    setPageFormData({
      name: '',
      slug: '',
      description: '',
      is_published: false,
      metadata: '{}'
    });
    setEditingPage(null);
    setIsPageFormOpen(false);
  };

  const resetBlockForm = () => {
    setBlockFormData({
      title: '',
      description: '',
      block_type: 'text',
      content: '{}',
      background_color: '',
      visibility_rules: '{}',
      animation: '',
      layout_mode: 'standard'
    });
    setEditingBlock(null);
    setIsBlockFormOpen(false);
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let metadata;
      try {
        metadata = JSON.parse(pageFormData.metadata);
      } catch (error) {
        alert('Invalid JSON in metadata field');
        return;
      }

      const pageData = {
        name: pageFormData.name,
        slug: pageFormData.slug.toLowerCase().replace(/\s+/g, '-'),
        description: pageFormData.description || null,
        is_published: pageFormData.is_published,
        metadata
      };

      if (editingPage) {
        const { error } = await supabase
          .from('page_layouts')
          .update(pageData)
          .eq('id', editingPage.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('page_layouts')
          .insert([pageData]);

        if (error) throw error;
      }

      await fetchPages();
      resetPageForm();
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Error saving page');
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;

    try {
      let content, visibilityRules;
      try {
        content = JSON.parse(blockFormData.content);
        visibilityRules = JSON.parse(blockFormData.visibility_rules);
      } catch (error) {
        alert('Invalid JSON in content or visibility rules field');
        return;
      }

      const blockData = {
        page_id: selectedPage.id,
        title: blockFormData.title,
        description: blockFormData.description || null,
        block_type: blockFormData.block_type,
        content,
        background_color: blockFormData.background_color || null,
        visibility_rules: visibilityRules,
        position: editingBlock ? editingBlock.position : blocks.length,
        animation: blockFormData.animation || null,
        layout_mode: blockFormData.layout_mode || 'standard'
      };

      if (editingBlock) {
        const { error } = await supabase
          .from('ui_blocks')
          .update(blockData)
          .eq('id', editingBlock.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ui_blocks')
          .insert([blockData]);

        if (error) throw error;
      }

      await fetchBlocks(selectedPage.id);
      resetBlockForm();
    } catch (error) {
      console.error('Error saving block:', error);
      alert('Error saving block');
    }
  };

  const handleEditPage = (page: PageLayout) => {
    setPageFormData({
      name: page.name,
      slug: page.slug,
      description: page.description || '',
      is_published: page.is_published,
      metadata: typeof page.metadata === 'string' ? page.metadata : JSON.stringify(page.metadata, null, 2)
    });
    setEditingPage(page);
    setIsPageFormOpen(true);
  };

  const handleEditBlock = (block: UIBlock) => {
    setBlockFormData({
      title: block.title,
      description: block.description || '',
      block_type: block.block_type,
      content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2),
      background_color: block.background_color || '',
      visibility_rules: typeof block.visibility_rules === 'string' ? block.visibility_rules : JSON.stringify(block.visibility_rules, null, 2),
      animation: block.animation || '',
      layout_mode: block.layout_mode || 'standard'
    });
    setEditingBlock(block);
    setIsBlockFormOpen(true);
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page? This will also delete all blocks on the page.')) return;

    try {
      const { error } = await supabase
        .from('page_layouts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchPages();
      
      if (selectedPage?.id === id) {
        setSelectedPage(null);
        setBlocks([]);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Error deleting page');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return;

    try {
      const { error } = await supabase
        .from('ui_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      if (selectedPage) {
        await fetchBlocks(selectedPage.id);
      }
    } catch (error) {
      console.error('Error deleting block:', error);
      alert('Error deleting block');
    }
  };

  const handleMoveBlock = async (blockId: string, direction: 'up' | 'down') => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const newBlocks = [...blocks];
    
    if (direction === 'up' && blockIndex > 0) {
      // Swap with the block above
      const temp = newBlocks[blockIndex].position;
      newBlocks[blockIndex].position = newBlocks[blockIndex - 1].position;
      newBlocks[blockIndex - 1].position = temp;
      
      // Update in database
      try {
        await Promise.all([
          supabase
            .from('ui_blocks')
            .update({ position: newBlocks[blockIndex].position })
            .eq('id', newBlocks[blockIndex].id),
          supabase
            .from('ui_blocks')
            .update({ position: newBlocks[blockIndex - 1].position })
            .eq('id', newBlocks[blockIndex - 1].id)
        ]);
        
        // Refetch to ensure correct order
        if (selectedPage) {
          await fetchBlocks(selectedPage.id);
        }
      } catch (error) {
        console.error('Error moving block:', error);
        alert('Error moving block');
      }
    } else if (direction === 'down' && blockIndex < newBlocks.length - 1) {
      // Swap with the block below
      const temp = newBlocks[blockIndex].position;
      newBlocks[blockIndex].position = newBlocks[blockIndex + 1].position;
      newBlocks[blockIndex + 1].position = temp;
      
      // Update in database
      try {
        await Promise.all([
          supabase
            .from('ui_blocks')
            .update({ position: newBlocks[blockIndex].position })
            .eq('id', newBlocks[blockIndex].id),
          supabase
            .from('ui_blocks')
            .update({ position: newBlocks[blockIndex + 1].position })
            .eq('id', newBlocks[blockIndex + 1].id)
        ]);
        
        // Refetch to ensure correct order
        if (selectedPage) {
          await fetchBlocks(selectedPage.id);
        }
      } catch (error) {
        console.error('Error moving block:', error);
        alert('Error moving block');
      }
    }
  };

  const togglePagePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('page_layouts')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchPages();
      
      // Update selected page if it's the one being toggled
      if (selectedPage?.id === id) {
        setSelectedPage(prev => prev ? { ...prev, is_published: !currentStatus } : null);
      }
    } catch (error) {
      console.error('Error updating page status:', error);
      alert('Error updating page status');
    }
  };

  const duplicateBlock = async (block: UIBlock) => {
    if (!selectedPage) return;
    
    try {
      const newBlock = {
        ...block,
        id: undefined, // Remove ID so Supabase generates a new one
        title: `${block.title} (Copy)`,
        position: blocks.length // Put at the end
      };
      
      const { error } = await supabase
        .from('ui_blocks')
        .insert([newBlock]);

      if (error) throw error;
      await fetchBlocks(selectedPage.id);
    } catch (error) {
      console.error('Error duplicating block:', error);
      alert('Error duplicating block');
    }
  };

  const exportPageData = () => {
    if (!selectedPage) return;
    
    const exportObj = {
      page: selectedPage,
      blocks: blocks
    };
    
    setExportData(JSON.stringify(exportObj, null, 2));
    setShowExportModal(true);
  };

  const importPageData = async () => {
    try {
      const importObj = JSON.parse(importData);
      
      if (!importObj.page || !importObj.blocks) {
        throw new Error('Invalid import data format');
      }
      
      // Check if page exists
      const { data: existingPage } = await supabase
        .from('page_layouts')
        .select('id')
        .eq('slug', importObj.page.slug)
        .single();
      
      let pageId;
      
      if (existingPage) {
        // Update existing page
        const { error: updateError } = await supabase
          .from('page_layouts')
          .update({
            name: importObj.page.name,
            description: importObj.page.description,
            is_published: importObj.page.is_published,
            metadata: importObj.page.metadata
          })
          .eq('id', existingPage.id);
          
        if (updateError) throw updateError;
        pageId = existingPage.id;
        
        // Delete existing blocks
        await supabase
          .from('ui_blocks')
          .delete()
          .eq('page_id', pageId);
      } else {
        // Create new page
        const { data: newPage, error: insertError } = await supabase
          .from('page_layouts')
          .insert([{
            name: importObj.page.name,
            slug: importObj.page.slug,
            description: importObj.page.description,
            is_published: importObj.page.is_published,
            metadata: importObj.page.metadata
          }])
          .select()
          .single();
          
        if (insertError) throw insertError;
        pageId = newPage.id;
      }
      
      // Insert blocks
      for (const block of importObj.blocks) {
        await supabase
          .from('ui_blocks')
          .insert([{
            page_id: pageId,
            title: block.title,
            description: block.description,
            block_type: block.block_type,
            content: block.content,
            position: block.position,
            background_color: block.background_color,
            visibility_rules: block.visibility_rules,
            animation: block.animation,
            layout_mode: block.layout_mode
          }]);
      }
      
      // Refresh data
      await fetchPages();
      setShowImportModal(false);
      
      // Select the imported page
      const { data: importedPage } = await supabase
        .from('page_layouts')
        .select('*')
        .eq('slug', importObj.page.slug)
        .single();
        
      if (importedPage) {
        setSelectedPage(importedPage);
      }
      
      alert('Page imported successfully!');
    } catch (error) {
      console.error('Error importing page:', error);
      alert('Error importing page: ' + (error instanceof Error ? error.message : 'Invalid format'));
    }
  };

  const getAnimationIcon = (animation: string | null) => {
    switch (animation) {
      case 'confetti': return <Sparkles className="h-4 w-4 text-yellow-500" />;
      case 'fade': return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'slide': return <Sparkles className="h-4 w-4 text-green-500" />;
      case 'bounce': return <Sparkles className="h-4 w-4 text-purple-500" />;
      default: return null;
    }
  };

  const getLayoutModeIcon = (layoutMode: string | null) => {
    switch (layoutMode) {
      case 'carousel': return <Repeat className="h-4 w-4 text-blue-500" />;
      case 'horizontal-scroll': return <Scroll className="h-4 w-4 text-green-500" />;
      case 'grid': return <Grid className="h-4 w-4 text-purple-500" />;
      case 'stacked': return <Rows className="h-4 w-4 text-orange-500" />;
      default: return <Columns className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <Smartphone className="h-4 w-4 text-gray-500" />;
      case 'desktop': return <Laptop className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getBlockTypeIcon = (type: UIBlock['block_type']) => {
    switch (type) {
      case 'analyzer': return <Brain className="h-4 w-4 text-blue-500" />;
      case 'contest': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'leaderboard': return <BarChart className="h-4 w-4 text-green-500" />;
      case 'ad': return <MonitorPlay className="h-4 w-4 text-red-500" />;
      case 'text': return <Type className="h-4 w-4 text-purple-500" />;
      case 'custom': return <Code className="h-4 w-4 text-indigo-500" />;
      default: return <Layers className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Layout className="h-6 w-6 mr-2 text-indigo-600" />
            Page Builder
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage custom pages for your users
          </p>
        </div>
        <button
          onClick={() => setIsPageFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Page
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-1">
          {/* Page Form */}
          {isPageFormOpen && (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6">
              <form onSubmit={handlePageSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Page Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={pageFormData.name}
                      onChange={handlePageInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                      placeholder="e.g., NFL Dashboard"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Slug *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={pageFormData.slug}
                      onChange={handlePageInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                      placeholder="e.g., nfl-dashboard"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      This will be used in the URL: /pages/{pageFormData.slug || 'example-slug'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={pageFormData.description}
                      onChange={handlePageInputChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder="Page description (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Metadata (JSON)
                    </label>
                    <textarea
                      name="metadata"
                      value={pageFormData.metadata}
                      onChange={handlePageInputChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                      placeholder='{"showInNav": true, "icon": "home"}'
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Use "showInNav": true to display in navigation
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={pageFormData.is_published}
                      onChange={handlePageInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Published
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetPageForm}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingPage ? 'Update' : 'Create'} Page
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pages List */}
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Pages
              </h3>
              <div className="space-y-3">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPage?.id === page.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedPage(page)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Layout className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {page.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            /{page.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePagePublished(page.id, page.is_published);
                          }}
                          className={`p-1 rounded ${
                            page.is_published
                              ? 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400'
                              : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
                          }`}
                          title={page.is_published ? 'Published' : 'Draft'}
                        >
                          {page.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                