import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Layout, 
  Move, 
  ArrowUp, 
  ArrowDown,
  Copy,
  ExternalLink,
  Palette,
  Settings,
  Layers,
  FileText,
  BarChart2,
  Trophy,
  Target,
  MonitorPlay
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface PageLayout {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_published: boolean;
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
  created_at: string;
  updated_at: string;
}

interface AIModel {
  id: string;
  name: string;
}

interface Contest {
  id: string;
  title: string;
}

interface Ad {
  id: string;
  title: string;
}

const PageBuilder: React.FC = () => {
  const [pages, setPages] = useState<PageLayout[]>([]);
  const [blocks, setBlocks] = useState<UIBlock[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageLayout | null>(null);
  const [isPageFormOpen, setIsPageFormOpen] = useState(false);
  const [isBlockFormOpen, setIsBlockFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageLayout | null>(null);
  const [editingBlock, setEditingBlock] = useState<UIBlock | null>(null);
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
    background_color: '#ffffff',
    visibility_rules: '{}'
  });
  
  // Reference data for dropdowns
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
    fetchReferenceData();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchBlocks(selectedPage.id);
    } else {
      setBlocks([]);
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

  const fetchReferenceData = async () => {
    try {
      // Fetch AI models
      const { data: modelData, error: modelError } = await supabase
        .from('ai_models')
        .select('id, name')
        .eq('is_active', true);

      if (modelError) throw modelError;
      setAiModels(modelData || []);

      // Fetch contests
      const { data: contestData, error: contestError } = await supabase
        .from('contests')
        .select('id, title')
        .eq('status', 'active');

      if (contestError) throw contestError;
      setContests(contestData || []);

      // Fetch ads
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .select('id, title')
        .eq('is_active', true);

      if (adError) throw adError;
      setAds(adData || []);
    } catch (error) {
      console.error('Error fetching reference data:', error);
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
      background_color: '#ffffff',
      visibility_rules: '{}'
    });
    setEditingBlock(null);
    setIsBlockFormOpen(false);
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let metadata = {};
      try {
        metadata = JSON.parse(pageFormData.metadata);
      } catch (error) {
        console.error('Invalid JSON in metadata:', error);
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
        const { data, error } = await supabase
          .from('page_layouts')
          .insert([pageData])
          .select();

        if (error) throw error;
        
        // Select the newly created page
        if (data && data.length > 0) {
          setSelectedPage(data[0]);
        }
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
    
    if (!selectedPage) {
      alert('No page selected');
      return;
    }
    
    try {
      let content = {};
      let visibilityRules = {};
      
      try {
        content = JSON.parse(blockFormData.content);
      } catch (error) {
        console.error('Invalid JSON in content:', error);
        alert('Invalid JSON in content field');
        return;
      }
      
      try {
        visibilityRules = JSON.parse(blockFormData.visibility_rules);
      } catch (error) {
        console.error('Invalid JSON in visibility rules:', error);
        alert('Invalid JSON in visibility rules field');
        return;
      }

      const blockData = {
        page_id: selectedPage.id,
        title: blockFormData.title,
        description: blockFormData.description || null,
        block_type: blockFormData.block_type,
        content,
        background_color: blockFormData.background_color,
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
    let metadataStr = '{}';
    try {
      metadataStr = JSON.stringify(page.metadata, null, 2);
    } catch (error) {
      console.error('Error stringifying metadata:', error);
    }
    
    setPageFormData({
      name: page.name,
      slug: page.slug,
      description: page.description || '',
      is_published: page.is_published,
      metadata: metadataStr
    });
    setEditingPage(page);
    setIsPageFormOpen(true);
  };

  const handleEditBlock = (block: UIBlock) => {
    let contentStr = '{}';
    let visibilityRulesStr = '{}';
    
    try {
      contentStr = JSON.stringify(block.content, null, 2);
    } catch (error) {
      console.error('Error stringifying content:', error);
    }
    
    try {
      visibilityRulesStr = JSON.stringify(block.visibility_rules, null, 2);
    } catch (error) {
      console.error('Error stringifying visibility rules:', error);
    }
    
    setBlockFormData({
      title: block.title,
      description: block.description || '',
      block_type: block.block_type,
      content: contentStr,
      background_color: block.background_color || '#ffffff',
      visibility_rules: visibilityRulesStr
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

  const togglePageStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('page_layouts')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchPages();
      
      if (selectedPage?.id === id) {
        setSelectedPage(prev => prev ? { ...prev, is_published: !currentStatus } : null);
      }
    } catch (error) {
      console.error('Error updating page status:', error);
      alert('Error updating page status');
    }
  };

  const moveBlock = async (blockId: string, direction: 'up' | 'down') => {
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
        
        // Refresh blocks
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
        
        // Refresh blocks
        if (selectedPage) {
          await fetchBlocks(selectedPage.id);
        }
      } catch (error) {
        console.error('Error moving block:', error);
        alert('Error moving block');
      }
    }
  };

  const duplicateBlock = async (block: UIBlock) => {
    if (!selectedPage) return;
    
    try {
      const newBlock = {
        ...block,
        id: undefined,
        title: `${block.title} (Copy)`,
        position: blocks.length,
        created_at: undefined,
        updated_at: undefined
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

  const previewPage = (slug: string) => {
    // In a real implementation, this would open a preview of the page
    // For now, we'll just set a URL that could be used
    setPreviewUrl(`/preview/${slug}`);
    setTimeout(() => {
      setPreviewUrl(null);
    }, 3000);
  };

  const getBlockTypeIcon = (type: UIBlock['block_type']) => {
    switch (type) {
      case 'analyzer': return <BarChart2 className="h-4 w-4" />;
      case 'contest': return <Trophy className="h-4 w-4" />;
      case 'leaderboard': return <Target className="h-4 w-4" />;
      case 'ad': return <MonitorPlay className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'custom': return <Layers className="h-4 w-4" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  const getBlockTypeLabel = (type: UIBlock['block_type']) => {
    switch (type) {
      case 'analyzer': return 'Analyzer Card';
      case 'contest': return 'Contest Card';
      case 'leaderboard': return 'Leaderboard';
      case 'ad': return 'Ad Block';
      case 'text': return 'Static Text';
      case 'custom': return 'Custom Component';
      default: return type;
    }
  };

  const getContentFields = () => {
    switch (blockFormData.block_type) {
      case 'analyzer':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Analyzer Model
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.analyzer_id = e.target.value || null;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
                value={JSON.parse(blockFormData.content || '{}').analyzer_id || ''}
              >
                <option value="">Select an analyzer model</option>
                {aiModels.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={JSON.parse(blockFormData.content || '{}').showUploadButton || false}
                  onChange={(e) => {
                    const content = JSON.parse(blockFormData.content || '{}');
                    content.showUploadButton = e.target.checked;
                    setBlockFormData({
                      ...blockFormData,
                      content: JSON.stringify(content, null, 2)
                    });
                  }}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show Upload Button
                </span>
              </label>
            </div>
          </>
        );
      
      case 'contest':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contest
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.contest_id = e.target.value || null;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
                value={JSON.parse(blockFormData.content || '{}').contest_id || ''}
              >
                <option value="">Select a contest</option>
                {contests.map(contest => (
                  <option key={contest.id} value={contest.id}>{contest.title}</option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={JSON.parse(blockFormData.content || '{}').showPrizePool || false}
                  onChange={(e) => {
                    const content = JSON.parse(blockFormData.content || '{}');
                    content.showPrizePool = e.target.checked;
                    setBlockFormData({
                      ...blockFormData,
                      content: JSON.stringify(content, null, 2)
                    });
                  }}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show Prize Pool
                </span>
              </label>
            </div>
          </>
        );
      
      case 'leaderboard':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sport Filter
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.sport = e.target.value || null;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
                value={JSON.parse(blockFormData.content || '{}').sport || ''}
              >
                <option value="">All Sports</option>
                <option value="NFL">NFL</option>
                <option value="NBA">NBA</option>
                <option value="MLB">MLB</option>
                <option value="NHL">NHL</option>
                <option value="Soccer">Soccer</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Entries Limit
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="1"
                max="100"
                value={JSON.parse(blockFormData.content || '{}').limit || 10}
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.limit = parseInt(e.target.value) || 10;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
              />
            </div>
          </>
        );
      
      case 'ad':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ad Campaign
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.ad_id = e.target.value || null;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
                value={JSON.parse(blockFormData.content || '{}').ad_id || ''}
              >
                <option value="">Select an ad campaign</option>
                {ads.map(ad => (
                  <option key={ad.id} value={ad.id}>{ad.title}</option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Placement Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.placement = e.target.value;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
                value={JSON.parse(blockFormData.content || '{}').placement || 'inline'}
              >
                <option value="inline">Inline</option>
                <option value="sidebar">Sidebar</option>
                <option value="banner">Banner</option>
              </select>
            </div>
          </>
        );
      
      case 'text':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Text Content
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={4}
                value={JSON.parse(blockFormData.content || '{}').text || ''}
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.text = e.target.value;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
                placeholder="Enter text content here..."
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Text Size
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.textSize = e.target.value;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
                value={JSON.parse(blockFormData.content || '{}').textSize || 'medium'}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </>
        );
      
      case 'custom':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Component Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={JSON.parse(blockFormData.content || '{}').component || ''}
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.component = e.target.value;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
                placeholder="e.g., UserPicks, RecentActivity"
              />
            </div>
          </>
        );
      
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content (JSON)
            </label>
            <textarea
              name="content"
              value={blockFormData.content}
              onChange={handleBlockInputChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              placeholder="{}"
            />
          </div>
        );
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
          Create New Page
        </button>
      </div>

      {previewUrl && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700 dark:text-green-300">
              Preview available at: <span className="font-medium">{previewUrl}</span>
            </span>
          </div>
          <button
            onClick={() => setPreviewUrl(null)}
            className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Page Form */}
      {isPageFormOpen && (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <form onSubmit={handlePageSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  URL Path *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 sm:text-sm">
                    /
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={pageFormData.slug}
                    onChange={handlePageInputChange}
                    required
                    className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    placeholder="nfl-dashboard"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={pageFormData.description}
                  onChange={handlePageInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Describe the purpose of this page"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Metadata (JSON)
                </label>
                <textarea
                  name="metadata"
                  value={pageFormData.metadata}
                  onChange={handlePageInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                  placeholder='{"icon": "home", "showInNav": true}'
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optional JSON metadata for additional page configuration
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
                  Published (visible to users)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Pages
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {pages.length} total
              </span>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {pages.map((page) => (
                <li 
                  key={page.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    selectedPage?.id === page.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                  onClick={() => setSelectedPage(page)}
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                          {page.name}
                        </p>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          page.is_published
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {page.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePageStatus(page.id, page.is_published);
                          }}
                          className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                          title={page.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {page.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPage(page);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(page.id);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          /{page.slug}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                        <p>
                          Created {new Date(page.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              
              {pages.length === 0 && (
                <li className="px-4 py-12 text-center">
                  <Layout className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pages</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by creating a new page.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setIsPageFormOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      New Page
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Page Builder */}
        <div className="lg:col-span-2">
          {selectedPage ? (
            <div className="space-y-4">
              {/* Page Header */}
              <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedPage.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      /{selectedPage.slug}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => previewPage(selectedPage.slug)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => togglePageStatus(selectedPage.id, selectedPage.is_published)}
                      className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        selectedPage.is_published
                          ? 'border-yellow-300 text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800 dark:hover:bg-yellow-900/50'
                          : 'border-green-300 text-green-800 bg-green-100 hover:bg-green-200 focus:ring-green-500 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/50'
                      }`}
                    >
                      {selectedPage.is_published ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Publish
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {selectedPage.description && (
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {selectedPage.description}
                  </p>
                )}
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(selectedPage.updated_at).toLocaleString()}
                  </div>
                  <button
                    onClick={() => setIsBlockFormOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Block
                  </button>
                </div>
              </div>
              
              {/* Block Form */}
              {isBlockFormOpen && (
                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                  <form onSubmit={handleBlockSubmit} className="p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
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
                          placeholder="e.g., Featured Contest"
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
                          <option value="analyzer">Analyzer Card</option>
                          <option value="contest">Contest Card</option>
                          <option value="leaderboard">Leaderboard</option>
                          <option value="ad">Ad Block</option>
                          <option value="text">Static Text</option>
                          <option value="custom">Custom Component</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Description
                        </label>
                        <input
                          type="text"
                          name="description"
                          value={blockFormData.description}
                          onChange={handleBlockInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                          placeholder="Optional description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Background Color
                        </label>
                        <div className="mt-1 flex items-center">
                          <input
                            type="color"
                            name="background_color"
                            value={blockFormData.background_color}
                            onChange={handleBlockInputChange}
                            className="h-8 w-8 rounded border-gray-300 mr-2"
                          />
                          <input
                            type="text"
                            name="background_color"
                            value={blockFormData.background_color}
                            onChange={handleBlockInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Block Content
                        </label>
                        {getContentFields()}
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
                          placeholder='{"requiredModel": "model-id", "minLevel": 5}'
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Optional JSON rules for conditional visibility
                        </p>
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
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Page Blocks
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {blocks.length} blocks
                  </span>
                </div>
                
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {blocks.map((block, index) => (
                    <li key={block.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            {getBlockTypeIcon(block.block_type)}
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {block.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {getBlockTypeLabel(block.block_type)}
                              {block.description && ` • ${block.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => moveBlock(block.id, 'up')}
                            disabled={index === 0}
                            className={`p-1 rounded ${
                              index === 0
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                            title="Move Up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveBlock(block.id, 'down')}
                            disabled={index === blocks.length - 1}
                            className={`p-1 rounded ${
                              index === blocks.length - 1
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                            title="Move Down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => duplicateBlock(block)}
                            className="p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditBlock(block)}
                            className="p-1 rounded text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-1 rounded text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Block Preview */}
                      <div 
                        className="mt-3 p-3 rounded-md text-sm"
                        style={{ backgroundColor: block.background_color || '#f9fafb' }}
                      >
                        {block.block_type === 'text' && (
                          <div className="prose dark:prose-invert max-w-none">
                            <p>{block.content?.text || 'Text content will appear here'}</p>
                          </div>
                        )}
                        
                        {block.block_type === 'analyzer' && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <BarChart2 className="h-4 w-4 mr-2" />
                            <span>
                              {block.content?.analyzer_id 
                                ? `Linked to analyzer: ${block.content.analyzer_id}`
                                : 'No analyzer selected'}
                              {block.content?.showUploadButton && ' • Upload button enabled'}
                            </span>
                          </div>
                        )}
                        
                        {block.block_type === 'contest' && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <Trophy className="h-4 w-4 mr-2" />
                            <span>
                              {block.content?.contest_id 
                                ? `Linked to contest: ${block.content.contest_id}`
                                : 'No contest selected'}
                              {block.content?.showPrizePool && ' • Prize pool visible'}
                            </span>
                          </div>
                        )}
                        
                        {block.block_type === 'leaderboard' && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <Target className="h-4 w-4 mr-2" />
                            <span>
                              {block.content?.sport 
                                ? `Sport filter: ${block.content.sport}`
                                : 'All sports'}
                              {block.content?.limit && ` • Limit: ${block.content.limit} entries`}
                            </span>
                          </div>
                        )}
                        
                        {block.block_type === 'ad' && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <MonitorPlay className="h-4 w-4 mr-2" />
                            <span>
                              {block.content?.ad_id 
                                ? `Linked to ad: ${block.content.ad_id}`
                                : 'No ad selected'}
                              {block.content?.placement && ` • Placement: ${block.content.placement}`}
                            </span>
                          </div>
                        )}
                        
                        {block.block_type === 'custom' && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <Layers className="h-4 w-4 mr-2" />
                            <span>
                              {block.content?.component 
                                ? `Component: ${block.content.component}`
                                : 'No component specified'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Visibility Rules */}
                      {Object.keys(block.visibility_rules || {}).length > 0 && (
                        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Settings className="h-3 w-3 mr-1" />
                          <span>Has visibility rules</span>
                        </div>
                      )}
                    </li>
                  ))}
                  
                  {blocks.length === 0 && (
                    <li className="px-4 py-12 text-center">
                      <Layers className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No blocks</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by adding a block to this page.
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => setIsBlockFormOpen(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Plus className="-ml-1 mr-2 h-5 w-5" />
                          Add Block
                        </button>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-12 text-center">
              <Layout className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No page selected</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a page from the list or create a new one to start building.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsPageFormOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Create New Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageBuilder;