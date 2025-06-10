import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, MapPin, Settings, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdPlacement {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  placement_type: string;
  max_ads: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Ad {
  id: string;
  title: string;
  ad_type: string;
  is_active: boolean;
}

interface PlacementAssignment {
  id: string;
  ad_id: string;
  placement_id: string;
  priority: number;
  is_active: boolean;
  ads?: Ad;
}

const AdPlacements: React.FC = () => {
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [assignments, setAssignments] = useState<PlacementAssignment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<AdPlacement | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<AdPlacement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    placement_type: 'sidebar',
    max_ads: 3,
    is_active: true
  });
  const [assignmentData, setAssignmentData] = useState({
    ad_id: '',
    priority: 0
  });

  const placementTypes = [
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'inline', label: 'Inline' },
    { value: 'banner', label: 'Banner' },
    { value: 'modal', label: 'Modal' },
    { value: 'overlay', label: 'Overlay' }
  ];

  useEffect(() => {
    fetchPlacements();
    fetchAds();
  }, []);

  useEffect(() => {
    if (selectedPlacement) {
      fetchAssignments(selectedPlacement.id);
    }
  }, [selectedPlacement]);

  const fetchPlacements = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_placements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlacements(data || []);
    } catch (error) {
      console.error('Error fetching ad placements:', error);
    }
  };

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, ad_type, is_active')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const fetchAssignments = async (placementId: string) => {
    try {
      const { data, error } = await supabase
        .from('ad_placement_assignments')
        .select(`
          *,
          ads (id, title, ad_type, is_active)
        `)
        .eq('placement_id', placementId)
        .order('priority', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleAssignmentInputChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setAssignmentData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      placement_type: 'sidebar',
      max_ads: 3,
      is_active: true
    });
    setEditingPlacement(null);
    setIsFormOpen(false);
  };

  const resetAssignmentForm = () => {
    setAssignmentData({
      ad_id: '',
      priority: 0
    });
    setIsAssignmentFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const placementData = {
        name: formData.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: formData.display_name,
        description: formData.description || null,
        placement_type: formData.placement_type,
        max_ads: formData.max_ads,
        is_active: formData.is_active
      };

      if (editingPlacement) {
        const { error } = await supabase
          .from('ad_placements')
          .update(placementData)
          .eq('id', editingPlacement.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ad_placements')
          .insert([placementData]);

        if (error) throw error;
      }

      await fetchPlacements();
      resetForm();
    } catch (error) {
      console.error('Error saving placement:', error);
      alert('Error saving placement');
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlacement) return;

    try {
      const { error } = await supabase
        .from('ad_placement_assignments')
        .insert([{
          ad_id: assignmentData.ad_id,
          placement_id: selectedPlacement.id,
          priority: assignmentData.priority
        }]);

      if (error) throw error;

      await fetchAssignments(selectedPlacement.id);
      resetAssignmentForm();
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Error creating assignment');
    }
  };

  const handleEdit = (placement: AdPlacement) => {
    setFormData({
      name: placement.name,
      display_name: placement.display_name,
      description: placement.description || '',
      placement_type: placement.placement_type,
      max_ads: placement.max_ads,
      is_active: placement.is_active
    });
    setEditingPlacement(placement);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this placement? This will also remove all ad assignments.')) return;

    try {
      const { error } = await supabase
        .from('ad_placements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPlacements();
      
      // Close assignment panel if this placement was selected
      if (selectedPlacement?.id === id) {
        setSelectedPlacement(null);
      }
    } catch (error) {
      console.error('Error deleting placement:', error);
      alert('Error deleting placement');
    }
  };

  const togglePlacementStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ad_placements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchPlacements();
    } catch (error) {
      console.error('Error updating placement status:', error);
      alert('Error updating placement status');
    }
  };

  const toggleAssignmentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ad_placement_assignments')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      if (selectedPlacement) {
        await fetchAssignments(selectedPlacement.id);
      }
    } catch (error) {
      console.error('Error updating assignment status:', error);
      alert('Error updating assignment status');
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this ad assignment?')) return;

    try {
      const { error } = await supabase
        .from('ad_placement_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      if (selectedPlacement) {
        await fetchAssignments(selectedPlacement.id);
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Error deleting assignment');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sidebar': return '📱';
      case 'inline': return '📄';
      case 'banner': return '🏷️';
      case 'modal': return '🪟';
      case 'overlay': return '🎯';
      default: return '📍';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Ad Placements</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define and manage where ads appear throughout the application
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Placement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placements List */}
        <div className="lg:col-span-2">
          {/* Form */}
          {isFormOpen && (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                      placeholder="e.g., Dashboard Sidebar"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Internal Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                      placeholder="e.g., dashboard_sidebar"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Used in code to reference this placement
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Placement Type *
                    </label>
                    <select
                      name="placement_type"
                      value={formData.placement_type}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    >
                      {placementTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Max Ads *
                    </label>
                    <input
                      type="number"
                      name="max_ads"
                      value={formData.max_ads}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="10"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder="Describe where this placement appears"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
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
                    {editingPlacement ? 'Update' : 'Create'} Placement
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Placements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {placements.map((placement) => (
              <div
                key={placement.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
                  selectedPlacement?.id === placement.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedPlacement(placement)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTypeIcon(placement.placement_type)}</span>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {placement.display_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {placement.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlacementStatus(placement.id, placement.is_active);
                        }}
                        className={`p-1 rounded ${
                          placement.is_active
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 hover:text-gray-500'
                        }`}
                      >
                        {placement.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(placement);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(placement.id);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Type: {placement.placement_type}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Max: {placement.max_ads} ads
                      </span>
                    </div>
                    {placement.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {placement.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      placement.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {placement.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {selectedPlacement?.id === placement.id && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {placements.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No placements</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first ad placement.
              </p>
            </div>
          )}
        </div>

        {/* Assignment Panel */}
        <div className="lg:col-span-1">
          {selectedPlacement ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  {selectedPlacement.display_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage ad assignments for this placement
                </p>
              </div>

              <div className="p-4">
                {/* Add Assignment Form */}
                {isAssignmentFormOpen ? (
                  <form onSubmit={handleAssignmentSubmit} className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Select Ad
                        </label>
                        <select
                          name="ad_id"
                          value={assignmentData.ad_id}
                          onChange={handleAssignmentInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                        >
                          <option value="">Choose an ad...</option>
                          {ads.filter(ad => 
                            !assignments.some(assignment => assignment.ad_id === ad.id)
                          ).map(ad => (
                            <option key={ad.id} value={ad.id}>
                              {ad.title} ({ad.ad_type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Priority
                        </label>
                        <input
                          type="number"
                          name="priority"
                          value={assignmentData.priority}
                          onChange={handleAssignmentInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={resetAssignmentForm}
                        className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAssignmentFormOpen(true)}
                    className="w-full mb-4 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Assign Ad to Placement
                  </button>
                )}

                {/* Assignments List */}
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {assignment.ads?.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Priority: {assignment.priority} • {assignment.ads?.ad_type}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleAssignmentStatus(assignment.id, assignment.is_active)}
                          className={`p-1 rounded ${
                            assignment.is_active
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-gray-400 hover:text-gray-500'
                          }`}
                        >
                          {assignment.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={() => deleteAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {assignments.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No ads assigned to this placement yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
              <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a placement to manage its ad assignments
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdPlacements;