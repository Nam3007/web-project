import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    User,
    XCircle,
    Save,
    Mail,
    Phone,
    DollarSign,
    Briefcase
} from 'lucide-react';

const ROLES = ['waiter', 'chef', 'cashier', 'admin'];

export default function AdminStaffPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);

    const queryClient = useQueryClient();

    // Fetch Staff
    const { data: staffList = [], isLoading } = useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            const res = await api.get('/staff/');
            return res.data;
        }
    });

    // Create/Update Mutation
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (editingStaff) {
                // For update, exclude username if not allowed or not needed
                return api.put(`/staff/${editingStaff.id}`, data);
            } else {
                return api.post('/staff/', data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['staff']);
            handleCloseModal();
        },
        onError: (err) => {
            alert("Failed to save staff: " + (err.response?.data?.detail || err.message));
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return api.delete(`/staff/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['staff']);
        }
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (staff) => {
        setEditingStaff(staff);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStaff(null);
    };

    const filteredStaff = staffList.filter(staff => {
        const matchesSearch =
            staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            staff.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (staff.email && staff.email.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
                    <p className="text-gray-500 text-sm">Manage employee accounts and roles</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm shadow-primary/30"
                >
                    <Plus className="w-5 h-5" />
                    Add New Staff
                </button>
            </div>

            {/* Filters/Search */}
            <div className="max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, username or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                </div>
            </div>

            {/* Staff List Grid */}
            {isLoading ? (
                <div className="text-center py-20">Loading staff...</div>
            ) : filteredStaff.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
                    No staff found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredStaff.map(staff => (
                        <div key={staff.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative group">
                            {/* Actions */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => handleEdit(staff)} className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg bg-white shadow-sm border border-gray-100">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(staff.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg bg-white shadow-sm border border-gray-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 flex items-start gap-4">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <User className="w-8 h-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate" title={staff.full_name}>{staff.full_name}</h3>
                                    <p className="text-sm text-gray-500 mb-1">@{staff.username}</p>

                                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium capitalize mb-4">
                                        {staff.role}
                                    </span>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">{staff.email}</span>
                                        </div>
                                        {staff.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span>{staff.phone}</span>
                                            </div>
                                        )}
                                        {staff.salary && (
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-green-500" />
                                                <span className="font-medium text-green-700">${staff.salary}/hr</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <StaffModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    initialData={editingStaff}
                    onSave={(data) => saveMutation.mutate(data)}
                    isSaving={saveMutation.isPending}
                />
            )}
        </div>
    );
}

function StaffModal({ isOpen, onClose, initialData, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        username: initialData?.username || '',
        password_hashed: '', // Only for create or explicit update
        full_name: initialData?.full_name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        role: initialData?.role || 'waiter',
        salary: initialData?.salary || '',
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = { ...formData };
        if (payload.salary) {
            payload.salary = parseFloat(payload.salary);
        } else {
            delete payload.salary;
        }

        // If editing and password is mostly blank, remove it so we don't overwrite with empty
        if (initialData && !payload.password_hashed) {
            delete payload.password_hashed;
        }

        onSave(payload);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">
                        {initialData ? 'Edit Staff Member' : 'Add New Staff'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <XCircle className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                required
                                type="text"
                                disabled={!!initialData} // Username usually immutable
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm disabled:bg-gray-100 disabled:text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password {initialData && '(Optional)'}</label>
                            <input
                                required={!initialData}
                                type="password"
                                value={formData.password_hashed}
                                onChange={(e) => setFormData({ ...formData, password_hashed: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder={initialData ? "Leave blank to keep current" : "Min 6 characters"}
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            required
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white capitalize"
                                >
                                    {ROLES.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            />
                        </div>
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
                                    Save Staff
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
