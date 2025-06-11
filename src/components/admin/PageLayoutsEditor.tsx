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
  Globe,
  Search,
  Filter,
  ArrowUpDown
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

const PageLayoutsEditor: React.FC = () => {
  const [pages, setPages] = useState<PageLayout[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'updated_at'>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    visibility_rules: '{}',
    is_published: false,
    default: false
  });

  useEffect(() => {
    fetchPages();
  }, [sortField, sortDirection]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('page_layouts')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      visibility_rules: '{}',
      is_published: false,
      default: false
    });
    setEditingPage(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let visibilityRules;
      try {
        visibilityRules = JSON.parse(formData.visibility_rules);
      } catch (error) {
        alert('Invalid JSON in visibility rules field');
        return;
      }

      const pageData = {
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description || null,
        is_published: formData.is_published,
        metadata: {
          default: formData.default,
          visibility_rules: visibilityRules
        }
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
      resetForm();
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Error saving page');
    }
  };

  const handleEdit = (page: PageLayout) => {
    const metadata = typeof page.metadata === 'string' 
      ? JSON.parse(page.metadata) 
      : page.metadata || {};
    
    setFormData({
      name: page.name,
      slug: page.slug,
      description: page.description || '',
      visibility_rules: JSON.stringify(metadata.visibility_rules || {}, null, 2),
      is_published: page.is_published,
      default: metadata.default || false
    });
    setEditingPage(page);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page? This will also delete all blocks on the page.')) return;

    try {
      const { error } = await supabase
        .from('page_layouts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Error deleting page');
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
    } catch (error) {
      console.error('Error updating page status:', error);
      alert('Error updating page status');
    }
  };

  const toggleSort = (field: 'name' | 'updated_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredPages = pages.filter(page => 
    page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (page.description && page.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Layout className="h-6 w-6 mr-2 text-indigo-600" />
            Page Layouts
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage page layouts for your users
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Page
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search pages..."
          />
        </div>
        <button
          onClick={() => setSearchTerm('')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Filter className="h-4 w-4 mr-2" />
          Clear
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
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
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="e.g., nfl-dashboard"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be used in the URL: /pages/{formData.slug || 'example-slug'}
                </p>
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
                  placeholder="Page description (optional)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Visibility Rules (JSON)
                </label>
                <textarea
                  name="visibility_rules"
                  value={formData.visibility_rules}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                  placeholder='{"requiresAuth": true, "roles": ["user", "admin"], "minTokens": 100}'
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Define who can access this page
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Published
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="default"
                  name="default"
                  checked={formData.default}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="default" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Default Page
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
                {editingPage ? 'Update' : 'Create'} Page
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pages List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center">
                  Name
                  {sortField === 'name' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Slug
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Default
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('updated_at')}
              >
                <div className="flex items-center">
                  Last Updated
                  {sortField === 'updated_at' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPages.map((page) => {
              const metadata = typeof page.metadata === 'string' 
                ? JSON.parse(page.metadata) 
                : page.metadata || {};
              
              return (
                <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{page.name}</div>
                    {page.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{page.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    /{page.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => togglePagePublished(page.id, page.is_published)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        page.is_published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {page.is_published ? (
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {metadata.default ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Default
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(page.updated_at).toLocaleDateString()} {new Date(page.updated_at).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <a
                        href={`/pages/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="View Page"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleEdit(page)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Edit Page"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Page"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredPages.length === 0 && (
          <div className="text-center py-12">
            <Layout className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pages found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search term.' : 'Get started by creating your first page.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageLayoutsEditor;