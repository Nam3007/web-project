import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Image as ImageIcon,
    XCircle,
    Save,
    Utensils,
    Upload,
    X
} from 'lucide-react';
import { StarDisplay } from '../../components/RatingModal';

const CATEGORIES = ['food', 'drink', 'appetizer', 'dessert'];

export default function AdminMenuPage() {
    const [filterType, setFilterType] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const queryClient = useQueryClient();

    // Fetch Menu Items
    const { data: menuItems = [], isLoading } = useQuery({
        queryKey: ['menuItems'],
        queryFn: async () => {
            const res = await api.get('/menu-items/');
            return res.data;
        }
    });

    // Create/Update Mutation
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (editingItem) {
                return api.put(`/menu-items/${editingItem.id}`, data);
            } else {
                return api.post('/menu-items/', data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            handleCloseModal();
        },
        onError: (err) => {
            alert("Failed to save item: " + (err.response?.data?.detail || err.message));
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return api.delete(`/menu-items/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
        }
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const filteredItems = menuItems.filter(item => {
        const matchesType = filterType === 'ALL' || item.item_type === filterType;
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
                    <p className="text-gray-500 text-sm">Organize and manage your restaurant menu</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm shadow-primary/30"
                >
                    <Plus className="w-5 h-5" />
                    Add New Item
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search item name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none bg-white cursor-pointer capitalize"
                    >
                        <option value="ALL">All Categories</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="text-center py-20">Loading menu...</div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
                    No items found. Add some or adjust filters!
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                                {item.item_image ? (
                                    <img src={item.item_image} alt={item.item_name} className="w-full h-full object-cover" />
                                ) : (
                                    <Utensils className="w-12 h-12 text-gray-300" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-2 bg-white rounded-full text-gray-700 hover:text-primary transition-colors"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 line-clamp-1" title={item.item_name}>{item.item_name}</h3>
                                    <span className="text-sm font-bold text-primary">{item.item_price.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem] mb-3">{item.item_description || 'No description'}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium capitalize">
                                        {item.item_type}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {item.average_rating && (
                                            <StarDisplay rating={item.average_rating} size="sm" />
                                        )}
                                        <span className={`text-xs font-medium ${item.is_available ? 'text-green-600' : 'text-red-500'}`}>
                                            {item.is_available ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <MenuItemModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    initialData={editingItem}
                    onSave={(data) => saveMutation.mutate(data)}
                    isSaving={saveMutation.isPending}
                />
            )}
        </div>
    );
}

function MenuItemModal({ isOpen, onClose, initialData, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        item_name: initialData?.item_name || '',
        item_price: initialData?.item_price || '',
        item_type: initialData?.item_type || 'food',
        item_description: initialData?.item_description || '',
        item_image: initialData?.item_image || '',
        is_available: initialData?.is_available ?? true
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadError('');
        setIsUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            const res = await fetch('http://localhost:8000/upload/menu-image', {
                method: 'POST',
                body: data,
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Upload failed');
            }
            const json = await res.json();
            setFormData(prev => ({ ...prev, item_image: json.url }));
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            item_price: parseFloat(formData.item_price)
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">
                        {initialData ? 'Edit Menu Item' : 'Add New Item'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <XCircle className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                        <input
                            required
                            type="text"
                            value={formData.item_name}
                            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            placeholder="e.g. Grilled Salmon"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (VND)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.item_price}
                                onChange={(e) => setFormData({ ...formData, item_price: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={formData.item_type}
                                onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formData.item_description}
                            onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                            placeholder="Briefly describe the dish..."
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>

                        {/* Preview */}
                        {formData.item_image ? (
                            <div className="relative mb-3 w-full h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                <img
                                    src={formData.item_image}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, item_image: '' }))}
                                    className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full shadow text-gray-500 hover:text-red-500 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            /* Drop zone */
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        <span className="text-sm font-medium text-primary">Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8" />
                                        <span className="text-sm font-medium">Click to upload image</span>
                                        <span className="text-xs">JPG, PNG, WEBP up to 5 MB</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleImageUpload}
                            className="hidden"
                        />

                        {/* Upload error */}
                        {uploadError && (
                            <p className="mt-1 text-xs text-red-500">{uploadError}</p>
                        )}

                        {/* Manual URL fallback */}
                        <div className="mt-2 relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                            <input
                                type="url"
                                value={formData.item_image}
                                onChange={(e) => setFormData({ ...formData, item_image: e.target.value })}
                                className="w-full pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs text-gray-500"
                                placeholder="Or paste an image URL..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_available"
                            checked={formData.is_available}
                            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="is_available" className="text-sm text-gray-700 select-none">Available for ordering</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/30 disabled:opacity-70"
                        >
                            {isSaving ? 'Saving...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Item
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
