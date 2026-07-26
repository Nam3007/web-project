import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Plus, Trash2, Edit2, Save, X, Ticket, Calendar, TrendingUp } from 'lucide-react';

export default function AdminDiscountCouponPage() {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        min_spend: '',
        discount_percentage: '',
        validity_duration: '1',
        validity_unit: 'weeks',
        is_active: true
    });
    
    // Quick options for validity
    const [validityPreset, setValidityPreset] = useState('1_week'); // '1_week', '1_month', 'manual'

    const { data: thresholds = [], isLoading } = useQuery({
        queryKey: ['couponThresholds'],
        queryFn: async () => {
            const res = await api.get('/coupons/thresholds');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            await api.post('/coupons/thresholds', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['couponThresholds'] });
            setIsAdding(false);
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            await api.put(`/coupons/thresholds/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['couponThresholds'] });
            setEditingId(null);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/coupons/thresholds/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['couponThresholds'] });
        }
    });

    const resetForm = () => {
        setFormData({
            min_spend: '',
            discount_percentage: '',
            validity_duration: '1',
            validity_unit: 'weeks',
            is_active: true
        });
        setValidityPreset('1_week');
    };

    const handlePresetChange = (preset) => {
        setValidityPreset(preset);
        if (preset === '1_week') {
            setFormData(prev => ({ ...prev, validity_duration: '1', validity_unit: 'weeks' }));
        } else if (preset === '1_month') {
            setFormData(prev => ({ ...prev, validity_duration: '1', validity_unit: 'months' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            min_spend: parseFloat(formData.min_spend),
            discount_percentage: parseInt(formData.discount_percentage, 10),
            validity_duration: parseInt(formData.validity_duration, 10),
            validity_unit: formData.validity_unit,
            is_active: formData.is_active
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const startEdit = (t) => {
        setEditingId(t.id);
        setFormData({
            min_spend: t.min_spend,
            discount_percentage: t.discount_percentage,
            validity_duration: t.validity_duration.toString(),
            validity_unit: t.validity_unit,
            is_active: t.is_active
        });
        setIsAdding(false);
        
        if (t.validity_duration === 1 && t.validity_unit === 'weeks') {
            setValidityPreset('1_week');
        } else if (t.validity_duration === 1 && t.validity_unit === 'months') {
            setValidityPreset('1_month');
        } else {
            setValidityPreset('manual');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading configurations...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Ticket className="w-8 h-8 text-primary" />
                        Discount Coupons
                    </h1>
                    <p className="text-gray-500 mt-2">Manage automatic coupon generation thresholds</p>
                </div>
                
                {!isAdding && !editingId && (
                    <button
                        onClick={() => { resetForm(); setIsAdding(true); }}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl transition-all shadow-sm font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Add Threshold
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {editingId ? 'Edit Threshold' : 'Create New Threshold'}
                        </h2>
                        <button 
                            onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <TrendingUp className="w-4 h-4 text-gray-400" />
                                    Minimum Spend (VND)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.min_spend}
                                    onChange={(e) => setFormData({ ...formData, min_spend: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="e.g. 500000"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Ticket className="w-4 h-4 text-gray-400" />
                                    Discount Percentage (%)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="100"
                                    value={formData.discount_percentage}
                                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="e.g. 10"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    Coupon Validity Period
                                </label>
                                
                                <div className="flex gap-4 mb-4">
                                    {['1_week', '1_month', 'manual'].map((preset) => (
                                        <label key={preset} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="validityPreset"
                                                checked={validityPreset === preset}
                                                onChange={() => handlePresetChange(preset)}
                                                className="text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-gray-700">
                                                {preset === '1_week' ? '1 Week' : preset === '1_month' ? '1 Month' : 'Manual Entry'}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                {validityPreset === 'manual' && (
                                    <div className="flex gap-4 animate-in fade-in zoom-in duration-200">
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.validity_duration}
                                            onChange={(e) => setFormData({ ...formData, validity_duration: e.target.value })}
                                            className="w-full md:w-1/3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            placeholder="Duration"
                                        />
                                        <select
                                            value={formData.validity_unit}
                                            onChange={(e) => setFormData({ ...formData, validity_unit: e.target.value })}
                                            className="w-full md:w-1/3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        >
                                            <option value="days">Days</option>
                                            <option value="weeks">Weeks</option>
                                            <option value="months">Months</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Active (Currently available for generation)
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-all shadow-sm disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                {editingId ? 'Save Changes' : 'Create Threshold'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Condition</th>
                            <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Discount</th>
                            <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Validity</th>
                            <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
                            <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {thresholds.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-gray-500">
                                    <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p>No coupon thresholds configured yet.</p>
                                </td>
                            </tr>
                        ) : (
                            thresholds.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium text-gray-900">
                                                Spend ≥ {formatCurrency(t.min_spend)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-green-100 text-green-700">
                                            {t.discount_percentage}% OFF
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600 text-sm capitalize">
                                        {t.validity_duration} {t.validity_unit}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                            t.is_active ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                                            {t.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(t)}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if(window.confirm('Are you sure you want to delete this threshold?')) {
                                                        deleteMutation.mutate(t.id);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
