import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X, 
  Layout, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  ExternalLink,
  Palette,
  Settings,
  Layers,
  FileText,
  BarChart2,
  Image,
  MessageSquare,
  Target,
  Award,
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
  const [selectedPage, setSelectedPage] = useState<PageLayout | null>(null);
  const [blocks, setBlocks] = useState<UIBlock[]>([]);
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

  useEffect(() => {
    fetchPages();
    fetchReferenceData();
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

  const fetchReferenceData = async () => {
    try {
      // Fetch AI models
      const { data: modelsData } = await supabase
        .from('ai_models')
        .select('id, name')
        .eq('is_active', true);
      
      setAiModels(modelsData || []);
      
      // Fetch contests
      const { data: contestsData } = await supabase
        .from('contests')
        .select('id, title')
        .eq('status', 'active');
      
      setContests(contestsData || []);
      
      // Fetch ads
      const { data: adsData } = await supabase
        .from('ads')
        .select('id, title')
        .eq('is_active', true);
      
      setAds(adsData || []);
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
        const { data, error } = await supabase
          .from('page_layouts')
          .insert([pageData])
          .select();

        if (error) throw error;
        
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
      let content;
      let visibilityRules;
      
      try {
        content = JSON.parse(blockFormData.content);
      } catch (error) {
        alert('Invalid JSON in content field');
        return;
      }
      
      try {
        visibilityRules = JSON.parse(blockFormData.visibility_rules);
      } catch (error) {
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
      metadataStr = typeof page.metadata === 'string' 
        ? page.metadata 
        : JSON.stringify(page.metadata, null, 2);
    } catch (e) {
      console.error('Error parsing metadata:', e);
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
      contentStr = typeof block.content === 'string' 
        ? block.content 
        : JSON.stringify(block.content, null, 2);
    } catch (e) {
      console.error('Error parsing content:', e);
    }
    
    try {
      visibilityRulesStr = typeof block.visibility_rules === 'string' 
        ? block.visibility_rules 
        : JSON.stringify(block.visibility_rules, null, 2);
    } catch (e) {
      console.error('Error parsing visibility rules:', e);
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

  const togglePagePublish = async (id: string, currentStatus: boolean) => {
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
      // Swap with previous block
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
        
        // Re-fetch blocks to ensure correct order
        if (selectedPage) {
          await fetchBlocks(selectedPage.id);
        }
      } catch (error) {
        console.error('Error moving block:', error);
        alert('Error moving block');
      }
    } else if (direction === 'down' && blockIndex < newBlocks.length - 1) {
      // Swap with next block
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
        
        // Re-fetch blocks to ensure correct order
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
        position: blocks.length
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
      case 'analyzer': return <Brain className="h-5 w-5 text-blue-500" />;
      case 'contest': return <Target className="h-5 w-5 text-green-500" />;
      case 'leaderboard': return <Award className="h-5 w-5 text-yellow-500" />;
      case 'ad': return <MonitorPlay className="h-5 w-5 text-red-500" />;
      case 'text': return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'custom': return <Settings className="h-5 w-5 text-indigo-500" />;
      default: return <Layers className="h-5 w-5 text-gray-500" />;
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
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="showUploadButton"
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
              <label htmlFor="showUploadButton" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Show Upload Button
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
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="showPrizePool"
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
              <label htmlFor="showPrizePool" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Show Prize Pool
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
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., NFL, NBA, or leave empty for all"
                value={JSON.parse(blockFormData.content || '{}').sport || ''}
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.sport = e.target.value;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 mt-2">
                Entry Limit
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Number of entries to show"
                value={JSON.parse(blockFormData.content || '{}').limit || '10'}
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
                  content.campaign_id = e.target.value || null;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
                value={JSON.parse(blockFormData.content || '{}').campaign_id || ''}
              >
                <option value="">Select an ad campaign</option>
                {ads.map(ad => (
                  <option key={ad.id} value={ad.id}>{ad.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 mt-2">
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
                placeholder="Enter text content"
                value={JSON.parse(blockFormData.content || '{}').text || ''}
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.text = e.target.value;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 mt-2">
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
                placeholder="e.g., UserPicks, RecentActivity"
                value={JSON.parse(blockFormData.content || '{}').component || ''}
                onChange={(e) => {
                  const content = JSON.parse(blockFormData.content || '{}');
                  content.component = e.target.value;
                  setBlockFormData({
                    ...blockFormData,
                    content: JSON.stringify(content, null, 2)
                  });
                }}
              />
            </div>
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Component Props (JSON)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                rows={4}
                placeholder='{"limit": 5, "showHeader": true}'
                value={JSON.stringify(JSON.parse(blockFormData.content || '{}').props || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const props = JSON.parse(e.target.value);
                    const content = JSON.parse(blockFormData.content || '{}');
                    content.props = props;
                    setBlockFormData({
                      ...blockFormData,
                      content: JSON.stringify(content, null, 2)
                    });
                  } catch (error) {
                    // Don't update if invalid JSON
                    console.error('Invalid JSON:', error);
                  }
                }}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              rows={6}
              value={blockFormData.content}
              onChange={(e) => setBlockFormData({ ...blockFormData, content: e.target.value })}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-1">
          {/* Page Form */}
          {isPageFormOpen && (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6">
              <form onSubmit={handlePageSubmit} className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingPage ? 'Edit Page' : 'Create New Page'}
                </h3>
                
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
                      URL Slug *
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 sm:text-sm">
                        /pages/
                      </span>
                      <input
                        type="text"
                        name="slug"
                        value={pageFormData.slug}
                        onChange={handlePageInputChange}
                        required
                        className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                        placeholder="nfl-dashboard"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      URL-friendly name (lowercase, no spaces)
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
                      placeholder="Brief description of this page"
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
                      placeholder='{"icon": "home", "showInNav": true}'
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

          {/* Pages List */}
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Your Pages
              </h3>
              
              {pages.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pages.map((page) => (
                    <li 
                      key={page.id}
                      className={`py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedPage?.id === page.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                      onClick={() => setSelectedPage(page)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {page.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            /pages/{page.slug}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Created: {new Date(page.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePagePublish(page.id, page.is_published);
                            }}
                            className={`p-1 rounded ${
                              page.is_published
                                ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                                : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
                            }`}
                            title={page.is_published ? 'Unpublish' : 'Publish'}
                          >
                            {page.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
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
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <Layout className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pages</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by creating your first page.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Builder */}
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
                      <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                        {selectedPage.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => togglePagePublish(selectedPage.id, selectedPage.is_published)}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                          selectedPage.is_published
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {selectedPage.is_published ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </button>
                      
                      <Link
                        to={`/pages/${selectedPage.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Preview
                      </Link>
                      
                      <button
                        onClick={() => handleEditPage(selectedPage)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block Form */}
              {isBlockFormOpen && (
                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                  <form onSubmit={handleBlockSubmit} className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {editingBlock ? 'Edit Block' : 'Add New Block'}
                    </h3>
                    
                    <div className="space-y-4">
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
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={blockFormData.description}
                          onChange={handleBlockInputChange}
                          rows={2}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          placeholder="Brief description of this block"
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
                          <option value="text">Text</option>
                          <option value="analyzer">Analyzer</option>
                          <option value="contest">Contest</option>
                          <option value="leaderboard">Leaderboard</option>
                          <option value="ad">Ad</option>
                          <option value="custom">Custom Component</option>
                        </select>
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
                            className="h-8 w-8 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            name="background_color"
                            value={blockFormData.background_color}
                            onChange={handleBlockInputChange}
                            className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Block Content
                        </label>
                        <div className="mt-1 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                          {getContentFields()}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Visibility Rules (JSON)
                        </label>
                        <textarea
                          name="visibility_rules"
                          value={blockFormData.visibility_rules}
                          onChange={handleBlockInputChange}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                          placeholder='{"userType": "premium", "minLevel": 5}'
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Optional rules to control block visibility
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
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Page Blocks
                    </h3>
                    <button
                      onClick={() => setIsBlockFormOpen(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Block
                    </button>
                  </div>
                  
                  {blocks.length > 0 ? (
                    <div className="space-y-4">
                      {blocks.map((block, index) => (
                        <div 
                          key={block.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <div className="mr-3">
                                {getBlockTypeIcon(block.block_type)}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {block.title}
                                </h4>
                                {block.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {block.description}
                                  </p>
                                )}
                                <div className="flex items-center mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    {block.block_type}
                                  </span>
                                  {block.background_color && (
                                    <div className="ml-2 flex items-center">
                                      <div 
                                        className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 mr-1"
                                        style={{ backgroundColor: block.background_color }}
                                      />
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {block.background_color}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
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
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                title="Duplicate"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditBlock(block)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBlock(block.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Layers className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No blocks</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by adding your first block to this page.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-12 text-center">
              <Layout className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Page Selected</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Select a page from the list or create a new one to start building.
              </p>
              <button
                onClick={() => setIsPageFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageBuilder;