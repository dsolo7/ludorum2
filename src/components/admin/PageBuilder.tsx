import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X, 
  Layout, 
  Layers, 
  MoveUp, 
  MoveDown,
  Eye, 
  EyeOff,
  Copy,
  Bot,
  Trophy,
  BarChart2,
  MonitorPlay,
  Type,
  Puzzle,
  Palette,
  Coins,
  Target,
  Calendar,
  Users,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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

interface AdPlacement {
  id: string;
  name: string;
  display_name: string;
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
    metadata: { showInNav: false, icon: '' }
  });
  const [blockFormData, setBlockFormData] = useState({
    title: '',
    description: '',
    block_type: 'text' as UIBlock['block_type'],
    content: {},
    background_color: '#ffffff',
    visibility_rules: {}
  });
  
  // Options for block configuration
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPages();
    fetchDropdownOptions();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchBlocks(selectedPage.id);
      setPreviewUrl(`/pages/${selectedPage.slug}`);
    } else {
      setBlocks([]);
      setPreviewUrl(null);
    }
  }, [selectedPage]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('page_layouts')
        .select('*')
        .order('name');

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
        .order('position');

      if (error) throw error;
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      // Fetch AI models
      const { data: modelsData, error: modelsError } = await supabase
        .from('ai_models')
        .select('id, name')
        .eq('is_active', true);

      if (modelsError) throw modelsError;
      setAiModels(modelsData || []);

      // Fetch contests
      const { data: contestsData, error: contestsError } = await supabase
        .from('contests')
        .select('id, title')
        .eq('status', 'active');

      if (contestsError) throw contestsError;
      setContests(contestsData || []);

      // Fetch ad placements
      const { data: placementsData, error: placementsError } = await supabase
        .from('ad_placements')
        .select('id, name, display_name')
        .eq('is_active', true);

      if (placementsError) throw placementsError;
      setAdPlacements(placementsData || []);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const handlePageInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name === 'showInNav') {
      setPageFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          showInNav: (e.target as HTMLInputElement).checked
        }
      }));
    } else if (name === 'icon') {
      setPageFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          icon: value
        }
      }));
    } else {
      setPageFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleBlockInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name === 'block_type') {
      // Reset content when block type changes
      setBlockFormData(prev => ({
        ...prev,
        block_type: value as UIBlock['block_type'],
        content: {}
      }));
    } else if (name.startsWith('content.')) {
      const contentField = name.split('.')[1];
      setBlockFormData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [contentField]: type === 'checkbox' 
            ? (e.target as HTMLInputElement).checked 
            : type === 'number' 
              ? parseInt(value) 
              : value
        }
      }));
    } else if (name.startsWith('visibility.')) {
      const visibilityField = name.split('.')[1];
      setBlockFormData(prev => ({
        ...prev,
        visibility_rules: {
          ...prev.visibility_rules,
          [visibilityField]: type === 'checkbox' 
            ? (e.target as HTMLInputElement).checked 
            : value
        }
      }));
    } else {
      setBlockFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const resetPageForm = () => {
    setPageFormData({
      name: '',
      slug: '',
      description: '',
      is_published: false,
      metadata: { showInNav: false, icon: '' }
    });
    setEditingPage(null);
    setIsPageFormOpen(false);
  };

  const resetBlockForm = () => {
    setBlockFormData({
      title: '',
      description: '',
      block_type: 'text',
      content: {},
      background_color: '#ffffff',
      visibility_rules: {}
    });
    setEditingBlock(null);
    setIsBlockFormOpen(false);
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const pageData = {
        name: pageFormData.name,
        slug: pageFormData.slug.toLowerCase().replace(/\s+/g, '-'),
        description: pageFormData.description || null,
        is_published: pageFormData.is_published,
        metadata: pageFormData.metadata
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;
    setIsSaving(true);
    
    try {
      const blockData = {
        page_id: selectedPage.id,
        title: blockFormData.title,
        description: blockFormData.description || null,
        block_type: blockFormData.block_type,
        content: blockFormData.content,
        background_color: blockFormData.background_color || null,
        visibility_rules: blockFormData.visibility_rules,
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPage = (page: PageLayout) => {
    const metadata = typeof page.metadata === 'string' 
      ? JSON.parse(page.metadata) 
      : page.metadata || {};
      
    setPageFormData({
      name: page.name,
      slug: page.slug,
      description: page.description || '',
      is_published: page.is_published,
      metadata: {
        showInNav: metadata.showInNav || false,
        icon: metadata.icon || ''
      }
    });
    setEditingPage(page);
    setIsPageFormOpen(true);
  };

  const handleEditBlock = (block: UIBlock) => {
    setBlockFormData({
      title: block.title,
      description: block.description || '',
      block_type: block.block_type,
      content: block.content || {},
      background_color: block.background_color || '#ffffff',
      visibility_rules: block.visibility_rules || {}
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

  const handleDuplicateBlock = async (block: UIBlock) => {
    if (!selectedPage) return;
    
    try {
      const newBlock = {
        ...block,
        id: undefined,
        title: `${block.title} (Copy)`,
        position: blocks.length
      };
      
      delete newBlock.id;
      
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

  const handleTogglePagePublish = async (id: string, currentStatus: boolean) => {
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

  const handleMoveBlock = async (blockId: string, direction: 'up' | 'down') => {
    if (!selectedPage) return;
    
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const newBlocks = [...blocks];
    
    if (direction === 'up' && blockIndex > 0) {
      // Swap with previous block
      const temp = newBlocks[blockIndex].position;
      newBlocks[blockIndex].position = newBlocks[blockIndex - 1].position;
      newBlocks[blockIndex - 1].position = temp;
      
      // Update positions in database
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
        
        await fetchBlocks(selectedPage.id);
      } catch (error) {
        console.error('Error moving block:', error);
        alert('Error moving block');
      }
    } else if (direction === 'down' && blockIndex < newBlocks.length - 1) {
      // Swap with next block
      const temp = newBlocks[blockIndex].position;
      newBlocks[blockIndex].position = newBlocks[blockIndex + 1].position;
      newBlocks[blockIndex + 1].position = temp;
      
      // Update positions in database
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
        
        await fetchBlocks(selectedPage.id);
      } catch (error) {
        console.error('Error moving block:', error);
        alert('Error moving block');
      }
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination || !selectedPage) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    const reorderedBlocks = Array.from(blocks);
    const [removed] = reorderedBlocks.splice(sourceIndex, 1);
    reorderedBlocks.splice(destinationIndex, 0, removed);
    
    // Update positions
    const updatedBlocks = reorderedBlocks.map((block, index) => ({
      ...block,
      position: index
    }));
    
    setBlocks(updatedBlocks);
    
    // Update in database
    try {
      for (const block of updatedBlocks) {
        await supabase
          .from('ui_blocks')
          .update({ position: block.position })
          .eq('id', block.id);
      }
    } catch (error) {
      console.error('Error reordering blocks:', error);
      alert('Error reordering blocks');
      // Refresh to get correct order
      await fetchBlocks(selectedPage.id);
    }
  };

  const getBlockTypeIcon = (type: UIBlock['block_type']) => {
    switch (type) {
      case 'analyzer': return <Bot className="h-5 w-5 text-blue-500" />;
      case 'contest': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'leaderboard': return <BarChart2 className="h-5 w-5 text-purple-500" />;
      case 'ad': return <MonitorPlay className="h-5 w-5 text-green-500" />;
      case 'text': return <Type className="h-5 w-5 text-gray-500" />;
      case 'custom': return <Puzzle className="h-5 w-5 text-indigo-500" />;
      default: return <Layers className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderBlockForm = () => {
    return (
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6">
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

            {/* Block-specific settings */}
            <div className="sm:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2 text-indigo-500" />
                Block Settings
              </h3>
              
              {blockFormData.block_type === 'analyzer' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      AI Model
                    </label>
                    <select
                      name="content.model_id"
                      value={blockFormData.content.model_id || ''}
                      onChange={handleBlockInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    >
                      <option value="">Any Model</option>
                      {aiModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Token Cost
                    </label>
                    <input
                      type="number"
                      name="content.token_cost"
                      value={blockFormData.content.token_cost || ''}
                      onChange={handleBlockInputChange}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                      placeholder="Leave empty to use model default"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="content.showUploadButton"
                      checked={blockFormData.content.showUploadButton || false}
                      onChange={handleBlockInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Show Image Upload Button
                    </label>
                  </div>
                </div>
              )}
              
              {blockFormData.block_type === 'contest' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contest
                    </label>
                    <select
                      name="content.contest_id"
                      value={blockFormData.content.contest_id || ''}
                      onChange={handleBlockInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    >
                      <option value="">Select Contest</option>
                      {contests.map(contest => (
                        <option key={contest.id} value={contest.id}>
                          {contest.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="content.showPrizePool"
                      checked={blockFormData.content.showPrizePool || false}
                      onChange={handleBlockInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Show Prize Pool
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="content.showEntryCount"
                      checked={blockFormData.content.showEntryCount || false}
                      onChange={handleBlockInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Show Entry Count
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="content.showTokenCost"
                      checked={blockFormData.content.showTokenCost || false}
                      onChange={handleBlockInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Show Token Cost
                    </label>
                  </div>
                </div>
              )}
              
              {blockFormData.block_type === 'leaderboard' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sport
                    </label>
                    <select
                      name="content.sport"
                      value={blockFormData.content.sport || ''}
                      onChange={handleBlockInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    >
                      <option value="">All Sports</option>
                      <option value="NFL">NFL</option>
                      <option value="NBA">NBA</option>
                      <option value="MLB">MLB</option>
                      <option value="NHL">NHL</option>
                      <option value="Soccer">Soccer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Entries to Show
                    </label>
                    <input
                      type="number"
                      name="content.limit"
                      value={blockFormData.content.limit || '10'}
                      onChange={handleBlockInputChange}
                      min="1"
                      max="100"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time Period
                    </label>
                    <select
                      name="content.timePeriod"
                      value={blockFormData.content.timePeriod || 'all'}
                      onChange={handleBlockInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    >
                      <option value="all">All Time</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="season">Current Season</option>
                    </select>
                  </div>
                </div>
              )}
              
              {blockFormData.block_type === 'ad' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ad Placement
                    </label>
                    <select
                      name="content.placement"
                      value={blockFormData.content.placement || ''}
                      onChange={handleBlockInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    >
                      <option value="">Select Placement</option>
                      {adPlacements.map(placement => (
                        <option key={placement.id} value={placement.name}>
                          {placement.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sport Category (for targeting)
                    </label>
                    <select
                      name="content.sportCategory"
                      value={blockFormData.content.sportCategory || ''}
                      onChange={handleBlockInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    >
                      <option value="">All Sports</option>
                      <option value="NFL">NFL</option>
                      <option value="NBA">NBA</option>
                      <option value="MLB">MLB</option>
                      <option value="NHL">NHL</option>
                      <option value="Soccer">Soccer</option>
                    </select>
                  </div>
                </div>
              )}
              
              {blockFormData.block_type === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Text Content
                    </label>
                    <textarea
                      name="content.text"
                      value={blockFormData.content.text || ''}
                      onChange={handleBlockInputChange}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder="Enter text content here"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Text Size
                    </label>
                    <select
                      name="content.textSize"
                      value={blockFormData.content.textSize || 'medium'}
                      onChange={handleBlockInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
              )}
              
              {blockFormData.block_type === 'custom' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Component Name
                    </label>
                    <select
                      name="content.component"
                      value={blockFormData.content.component || ''}
                      onChange={handleBlockInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    >
                      <option value="">Select Component</option>
                      <option value="UserAchievements">User Achievements</option>
                      <option value="UserPicks">User Picks</option>
                      <option value="TokenHistory">Token History</option>
                      <option value="UpcomingGames">Upcoming Games</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Component Props (JSON)
                    </label>
                    <textarea
                      name="content.props"
                      value={blockFormData.content.props || '{}'}
                      onChange={handleBlockInputChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                      placeholder='{"limit": 5, "showHeader": true}'
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Visibility Rules */}
            <div className="sm:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-indigo-500" />
                Visibility Rules
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sport Filter
                  </label>
                  <select
                    name="visibility.sport"
                    value={blockFormData.visibility_rules.sport || ''}
                    onChange={handleBlockInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  >
                    <option value="">All Sports</option>
                    <option value="NFL">NFL</option>
                    <option value="NBA">NBA</option>
                    <option value="MLB">MLB</option>
                    <option value="NHL">NHL</option>
                    <option value="Soccer">Soccer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    User Status
                  </label>
                  <select
                    name="visibility.userStatus"
                    value={blockFormData.visibility_rules.userStatus || ''}
                    onChange={handleBlockInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  >
                    <option value="">All Users</option>
                    <option value="free">Free Users</option>
                    <option value="paid">Paid Subscribers</option>
                    <option value="elite">Elite Subscribers</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="visibility.startDate"
                      value={blockFormData.visibility_rules.startDate || ''}
                      onChange={handleBlockInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="visibility.endDate"
                      value={blockFormData.visibility_rules.endDate || ''}
                      onChange={handleBlockInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="visibility.requiresTokens"
                    checked={blockFormData.visibility_rules.requiresTokens || false}
                    onChange={handleBlockInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Requires Tokens to View
                  </label>
                </div>
                
                {blockFormData.visibility_rules.requiresTokens && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Token Cost
                    </label>
                    <input
                      type="number"
                      name="visibility.tokenCost"
                      value={blockFormData.visibility_rules.tokenCost || '1'}
                      onChange={handleBlockInputChange}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    />
                  </div>
                )}
              </div>
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
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingBlock ? 'Update' : 'Create'} Block
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderPageForm = () => {
    return (
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6">
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
                URL Slug *
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
                Will be accessible at /pages/your-slug
              </p>
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
                placeholder="Brief description of this page"
              />
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

            <div className="flex items-center">
              <input
                type="checkbox"
                name="showInNav"
                checked={pageFormData.metadata.showInNav}
                onChange={handlePageInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Show in Navigation
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Icon (for navigation)
              </label>
              <input
                type="text"
                name="icon"
                value={pageFormData.metadata.icon}
                onChange={handlePageInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                placeholder="e.g., home, football, chart"
              />
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
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingPage ? 'Update' : 'Create'} Page
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
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
        <div className="flex space-x-3">
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Page
            </a>
          )}
          <button
            onClick={() => setIsPageFormOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </button>
        </div>
      </div>

      {/* Page Form */}
      {isPageFormOpen && renderPageForm()}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Pages</h2>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {pages.map((page) => (
                <li 
                  key={page.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    selectedPage?.id === page.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                  onClick={() => setSelectedPage(page)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center ${
                        page.is_published ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        <Layout className="h-6 w-6" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{page.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">/pages/{page.slug}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePagePublish(page.id, page.is_published);
                        }}
                        className={`p-1 rounded-full ${
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
                        className="p-1 rounded-full text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(page.id);
                        }}
                        className="p-1 rounded-full text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {pages.length === 0 && (
                <li className="p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No pages found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Create your first page to get started
                  </p>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Blocks List */}
        <div className="lg:col-span-3">
          {selectedPage ? (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedPage.name} Blocks
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPage.is_published ? 'Published' : 'Draft'} • {blocks.length} blocks
                  </p>
                </div>
                <button
                  onClick={() => setIsBlockFormOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Block
                </button>
              </div>

              {/* Block Form */}
              {isBlockFormOpen && renderBlockForm()}

              {/* Blocks List */}
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="blocks">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="p-4"
                    >
                      {blocks.length > 0 ? (
                        <div className="space-y-4">
                          {blocks.map((block, index) => (
                            <Draggable key={block.id} draggableId={block.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <div className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center" {...provided.dragHandleProps}>
                                        <div className="flex-shrink-0 h-10 w-10 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                          {getBlockTypeIcon(block.block_type)}
                                        </div>
                                        <div className="ml-3">
                                          <p className="text-sm font-medium text-gray-900 dark:text-white">{block.title}</p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {block.block_type.charAt(0).toUpperCase() + block.block_type.slice(1)} • Position: {block.position + 1}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleMoveBlock(block.id, 'up')}
                                          disabled={index === 0}
                                          className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 disabled:opacity-30"
                                          title="Move Up"
                                        >
                                          <MoveUp className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleMoveBlock(block.id, 'down')}
                                          disabled={index === blocks.length - 1}
                                          className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 disabled:opacity-30"
                                          title="Move Down"
                                        >
                                          <MoveDown className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDuplicateBlock(block)}
                                          className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                                          title="Duplicate"
                                        >
                                          <Copy className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleEditBlock(block)}
                                          className="p-1 rounded-full text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                          title="Edit"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteBlock(block.id)}
                                          className="p-1 rounded-full text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                          title="Delete"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {/* Block Preview */}
                                    <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        {block.description && (
                                          <p className="mb-1">{block.description}</p>
                                        )}
                                        
                                        {/* Block-specific preview */}
                                        {block.block_type === 'analyzer' && (
                                          <div className="flex items-center space-x-2">
                                            <Bot className="h-3 w-3" />
                                            <span>
                                              {block.content?.model_id 
                                                ? `Specific model: ${aiModels.find(m => m.id === block.content.model_id)?.name || 'Unknown'}`
                                                : 'Any model'}
                                            </span>
                                            {block.content?.token_cost && (
                                              <>
                                                <Coins className="h-3 w-3" />
                                                <span>{block.content.token_cost} tokens</span>
                                              </>
                                            )}
                                          </div>
                                        )}
                                        
                                        {block.block_type === 'contest' && (
                                          <div className="flex items-center space-x-2">
                                            <Trophy className="h-3 w-3" />
                                            <span>
                                              {block.content?.contest_id 
                                                ? `Contest: ${contests.find(c => c.id === block.content.contest_id)?.title || 'Unknown'}`
                                                : 'No specific contest'}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {block.block_type === 'leaderboard' && (
                                          <div className="flex items-center space-x-2">
                                            <BarChart2 className="h-3 w-3" />
                                            <span>
                                              {block.content?.sport ? `Sport: ${block.content.sport}` : 'All sports'} • 
                                              Limit: {block.content?.limit || 10} • 
                                              Period: {block.content?.timePeriod || 'All time'}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {block.block_type === 'ad' && (
                                          <div className="flex items-center space-x-2">
                                            <MonitorPlay className="h-3 w-3" />
                                            <span>
                                              Placement: {block.content?.placement || 'Default'} • 
                                              {block.content?.sportCategory ? `Sport: ${block.content.sportCategory}` : 'All sports'}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {block.block_type === 'text' && (
                                          <div className="flex items-center space-x-2">
                                            <Type className="h-3 w-3" />
                                            <span>
                                              Size: {block.content?.textSize || 'Medium'} • 
                                              {block.content?.text ? `${block.content.text.substring(0, 30)}...` : 'No text'}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {block.block_type === 'custom' && (
                                          <div className="flex items-center space-x-2">
                                            <Puzzle className="h-3 w-3" />
                                            <span>
                                              Component: {block.content?.component || 'None selected'}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Visibility Rules Preview */}
                                      {Object.keys(block.visibility_rules || {}).length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {block.visibility_rules.sport && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                              <Target className="h-3 w-3 mr-1" />
                                              Sport: {block.visibility_rules.sport}
                                            </span>
                                          )}
                                          
                                          {block.visibility_rules.userStatus && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                              <Users className="h-3 w-3 mr-1" />
                                              {block.visibility_rules.userStatus} users
                                            </span>
                                          )}
                                          
                                          {(block.visibility_rules.startDate || block.visibility_rules.endDate) && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                              <Calendar className="h-3 w-3 mr-1" />
                                              Date restricted
                                            </span>
                                          )}
                                          
                                          {block.visibility_rules.requiresTokens && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                              <Coins className="h-3 w-3 mr-1" />
                                              {block.visibility_rules.tokenCost || 1} tokens
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Layers className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No blocks</h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Get started by adding your first block to this page.
                          </p>
                          <div className="mt-6">
                            <button
                              onClick={() => setIsBlockFormOpen(true)}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Block
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-12 text-center">
              <Layout className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No page selected</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a page from the list or create a new one to get started.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsPageFormOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Page
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