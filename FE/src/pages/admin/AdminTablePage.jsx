import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
    Plus,
    Search,
    Trash2,
    XCircle,
    Save,
    Users,
    UtensilsCrossed
} from 'lucide-react';

export default function AdminTablePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState(null);

    const queryClient = useQueryClient();

    // Fetch Tables
    const { data: tables = [], isLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const res = await api.get('/tables/');
            return res.data;
        }
    });

    // Create/Update Mutation
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (editingTable) {
                return api.put(`/tables/${editingTable.id}`, data);
            } else {
                return api.post('/tables/', data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['tables']);
            handleCloseModal();
        },
        onError: (err) => {
            alert("Failed to save table: " + (err.response?.data?.detail || err.message));
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return api.delete(`/tables/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['tables']);
        }
    });

    // Toggle Status Mutation (optional manual override)
    const statusMutation = useMutation({
        mutationFn: async ({ id, is_occupied }) => {
            return api.patch(`/tables/status/${id}/?is_occupied=${is_occupied}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['tables']);
        }
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this table?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (table) => {
        setEditingTable(table);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTable(null);
    };

    const handleToggleStatus = (table) => {
        statusMutation.mutate({ id: table.id, is_occupied: !table.is_occupied });
    }

    const filteredTables = tables.filter(table => {
        return table.table_number.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Table Management</h1>
                    <p className="text-gray-500 text-sm">Organize layout and capacity</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm shadow-primary/30"
                >
                    <Plus className="w-5 h-5" />
                    Add New Table
                </button>
            </div>

            {/* Search */}
            <div className="max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by table number (e.g. T01)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="text-center py-20">Loading tables...</div>
            ) : filteredTables.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
                    No tables found.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredTables.map(table => (
                        <div
                            key={table.id}
                            className={`rounded-2xl border-2 p-4 transition-all hover:shadow-md relative group ${table.is_occupied
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-white border-dashed border-gray-200 hover:border-primary/50'
                                }`}
                        >
                            {/* Delete Action */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }}
                                className="absolute top-2 right-2 p-1.5 bg-white text-gray-400 hover:text-red-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div
                                onClick={() => handleEdit(table)}
                                className="flex flex-col items-center justify-center text-center cursor-pointer h-full py-4 space-y-2"
                            >
                                <div className={`p-3 rounded-full ${table.is_occupied ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    <UtensilsCrossed className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">{table.table_number}</h3>

                                <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium bg-white/50 px-2 py-0.5 rounded-md">
                                    <Users className="w-4 h-4" />
                                    <span>{table.table_size} Seats</span>
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-black/5 text-center">
                                <button
                                    onClick={() => handleToggleStatus(table)}
                                    className={`text-xs font-bold uppercase tracking-wide ${table.is_occupied ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                                        }`}
                                >
                                    {table.is_occupied ? 'Occupied' : 'Free'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <TableModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    initialData={editingTable}
                    onSave={(data) => saveMutation.mutate(data)}
                    isSaving={saveMutation.isPending}
                />
            )}
        </div>
    );
}

function TableModal({ isOpen, onClose, initialData, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        table_number: initialData?.table_number || '',
        table_size: initialData?.table_size || 4,
        is_occupied: initialData?.is_occupied ?? false
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            table_size: parseInt(formData.table_size)
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">
                        {initialData ? 'Edit Table' : 'Add New Table'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <XCircle className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Table Number (e.g. T01)</label>
                        <input
                            required
                            type="text"
                            pattern="^T\d{2}$"
                            title="Format: T01, T02, etc."
                            value={formData.table_number}
                            onChange={(e) => setFormData({ ...formData, table_number: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm uppercase placeholder-gray-300"
                            placeholder="T00"
                        />
                        <p className="text-xs text-gray-400 mt-1">Must be in format Txx (e.g. T05)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Seats)</label>
                        <input
                            required
                            type="number"
                            min="1"
                            max="50"
                            value={formData.table_size}
                            onChange={(e) => setFormData({ ...formData, table_size: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        />
                    </div>

                    {initialData && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_occupied"
                                checked={formData.is_occupied}
                                onChange={(e) => setFormData({ ...formData, is_occupied: e.target.checked })}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="is_occupied" className="text-sm text-gray-700 select-none">Mark as Occupied</label>
                        </div>
                    )}

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
                                    Save Table
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
