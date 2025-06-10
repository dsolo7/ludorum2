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
  Copy,
  Brain,
  Trophy,
  BarChart,
  MonitorPlay,
  Type,
  Code
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
    visibility_rules: '{}'
  });

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchBlocks(selectedPage.id);
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
      visibility_rules: '{}'
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
        position: editingBlock ? editingBlock.position : blocks.length
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
      visibility_rules: typeof block.visibility_rules === 'string' ? block.visibility_rules : JSON.stringify(block.visibility_rules, null, 2)
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPage(page);
                          }}
                          className="p-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit Page"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(page.id);
                          }}
                          className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Page"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {page.description && (
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        {page.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        page.is_published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        Updated: {new Date(page.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {pages.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">
                      No pages created yet. Click "Create Page" to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Blocks Panel */}
        <div className="lg:col-span-2">
          {selectedPage ? (
            <div className="space-y-6">
              {/* Page Header */}
              <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {selectedPage.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {selectedPage.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <a
                        href={`/pages/${selectedPage.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        View Page
                      </a>
                      <button
                        onClick={() => setIsBlockFormOpen(true)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Block
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block Form */}
              {isBlockFormOpen && (
                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                  <form onSubmit={handleBlockSubmit} className="p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Block Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={blockFormData.title}
                          onChange={handleBlockInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                          placeholder="e.g., NFL Analyzer"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={blockFormData.description}
                          onChange={handleBlockInputChange}
                          rows={2}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          placeholder="Block description (optional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Block Type *
                        </label>
                        <select
                          name="block_type"
                          value={blockFormData.block_type}
                          onChange={handleBlockInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                        >
                          <option value="analyzer">Analyzer</option>
                          <option value="contest">Contest</option>
                          <option value="leaderboard">Leaderboard</option>
                          <option value="ad">Ad</option>
                          <option value="text">Text</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Background Color
                        </label>
                        <input
                          type="text"
                          name="background_color"
                          value={blockFormData.background_color}
                          onChange={handleBlockInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                          placeholder="e.g., #ffffff or bg-blue-100"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Content (JSON)
                        </label>
                        <textarea
                          name="content"
                          value={blockFormData.content}
                          onChange={handleBlockInputChange}
                          rows={4}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                          placeholder='{"text": "Welcome to our site!", "style": "large"}'
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Visibility Rules (JSON)
                        </label>
                        <textarea
                          name="visibility_rules"
                          value={blockFormData.visibility_rules}
                          onChange={handleBlockInputChange}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                          placeholder='{"requireAuth": false, "roles": ["user"]}'
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={resetBlockForm}
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
                        {editingBlock ? 'Update' : 'Add'} Block
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Blocks List */}
              <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    Blocks
                  </h3>
                  <div className="space-y-3">
                    {blocks.map((block, index) => (
                      <div
                        key={block.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getBlockTypeIcon(block.block_type)}
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {block.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {block.block_type} • Position {block.position}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleMoveBlock(block.id, 'up')}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move Up"
                            >
                              <MoveUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMoveBlock(block.id, 'down')}
                              disabled={index === blocks.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move Down"
                            >
                              <MoveDown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => duplicateBlock(block)}
                              className="p-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Duplicate Block"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditBlock(block)}
                              className="p-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="Edit Block"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBlock(block.id)}
                              className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete Block"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {block.description && (
                          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                            {block.description}
                          </p>
                        )}
                      </div>
                    ))}

                    {blocks.length === 0 && (
                      <div className="text-center py-8">
                        <Layers className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          No blocks
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Get started by adding a block to this page.
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={() => setIsBlockFormOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Block
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6 text-center">
                <Layout className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No page selected
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select a page from the list to manage its blocks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageBuilder;

export default PageBuilder