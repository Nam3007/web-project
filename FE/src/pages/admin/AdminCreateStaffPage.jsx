import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
    ArrowLeft,
    Save,
    User,
    Lock,
    Mail,
    Phone,
    DollarSign,
    Briefcase,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

const ROLES = ['waiter', 'chef', 'cashier', 'admin'];

export default function AdminCreateStaffPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password_hashed: '',
        full_name: '',
        email: '',
        phone: '',
        role: 'waiter',
        salary: '',
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Create Staff Mutation
    const createMutation = useMutation({
        mutationFn: async (data) => {
            return api.post('/staff/', data);
        },
        onSuccess: () => {
            setShowSuccess(true);
            setErrorMessage('');
            // Redirect after a short delay to show success message
            setTimeout(() => {
                navigate('/admin/staff');
            }, 1500);
        },
        onError: (err) => {
            setErrorMessage(err.response?.data?.detail || err.message || 'Failed to create staff account');
            setShowSuccess(false);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMessage('');

        const payload = { ...formData };

        // Convert salary to float if provided
        if (payload.salary) {
            payload.salary = parseFloat(payload.salary);
        } else {
            delete payload.salary;
        }

        // Remove empty phone if not provided
        if (!payload.phone) {
            delete payload.phone;
        }

        createMutation.mutate(payload);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrorMessage(''); // Clear error when user starts typing
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
            <div className="max-w-3xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/staff')}
                        className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Staff List</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Create New Staff Account</h1>
                    <p className="text-gray-500 mt-2">Add a new employee to the system</p>
                </div>

                {/* Success Alert */}
                {showSuccess && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-green-900">Success!</h3>
                            <p className="text-sm text-green-700">Staff account created successfully. Redirecting...</p>
                        </div>
                    </div>
                )}

                {/* Error Alert */}
                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-red-900">Error</h3>
                            <p className="text-sm text-red-700">{errorMessage}</p>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        {/* Form Content */}
                        <div className="p-8 space-y-6">
                            {/* Account Credentials Section */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <Lock className="w-5 h-5 text-primary" />
                                    Account Credentials
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Username <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                required
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => handleInputChange('username', e.target.value)}
                                                placeholder="e.g., john_doe"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Used for login</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                required
                                                type="password"
                                                value={formData.password_hashed}
                                                onChange={(e) => handleInputChange('password_hashed', e.target.value)}
                                                placeholder="Minimum 6 characters"
                                                minLength={6}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information Section */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <User className="w-5 h-5 text-primary" />
                                    Personal Information
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                                        placeholder="e.g., John Doe"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="staff@example.com"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                placeholder="(123) 456-7890"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Details Section */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <Briefcase className="w-5 h-5 text-primary" />
                                    Employment Details
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Role <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <select
                                                value={formData.role}
                                                onChange={(e) => handleInputChange('role', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white capitalize appearance-none transition-all cursor-pointer"
                                            >
                                                {ROLES.map(role => (
                                                    <option key={role} value={role} className="capitalize">
                                                        {role}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Hourly Rate ($)
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={formData.salary}
                                                onChange={(e) => handleInputChange('salary', e.target.value)}
                                                placeholder="25.00"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Optional</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/staff')}
                                className="px-6 py-2.5 text-gray-700 hover:bg-white border border-gray-200 rounded-lg font-medium transition-all hover:shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || showSuccess}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Create Staff Account
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Note */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> The new staff member will be able to log in immediately using the username and password you provide.
                        Make sure to communicate these credentials securely.
                    </p>
                </div>
            </div>
        </div>
    );
}
