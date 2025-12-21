import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { User, Lock, Mail, Phone, UserCircle, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CustomerRegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password_hashed: '',
        full_name: '',
        email: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = { ...formData };
            // Remove empty phone if not provided
            if (!payload.phone) {
                delete payload.phone;
            }

            await api.post('/customers/', payload);
            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
                    <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] rounded-full bg-secondary/10 blur-[100px]" />
                </div>

                <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl w-full max-w-md p-8 relative z-10">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
                        <p className="text-gray-600">Your account has been created successfully. Redirecting to login...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 relative overflow-hidden py-12 px-4">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
                <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] rounded-full bg-secondary/10 blur-[100px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-accent/20 blur-[100px]" />
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl w-full max-w-md relative z-10 transition-all duration-300 hover:shadow-2xl hover:bg-white/80">
                {/* Header */}
                <div className="text-center pt-8 px-8 pb-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
                        Create Account
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Join River Side Restaurant
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mx-8 mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
                    {/* Username */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                            Username *
                        </label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                required
                                type="text"
                                minLength={3}
                                maxLength={50}
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 placeholder:text-gray-400"
                                placeholder="Choose a username"
                            />
                        </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                            Full Name *
                        </label>
                        <div className="relative group">
                            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                required
                                type="text"
                                maxLength={100}
                                value={formData.full_name}
                                onChange={(e) => handleInputChange('full_name', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 placeholder:text-gray-400"
                                placeholder="Your full name"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                            Email *
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 placeholder:text-gray-400"
                                placeholder="your@email.com"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                            Phone (Optional)
                        </label>
                        <div className="relative group">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 placeholder:text-gray-400"
                                placeholder="(123) 456-7890"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                            Password *
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                required
                                type="password"
                                minLength={6}
                                value={formData.password_hashed}
                                onChange={(e) => handleInputChange('password_hashed', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 placeholder:text-gray-400"
                                placeholder="••••••••"
                            />
                        </div>
                        <p className="text-xs text-gray-500 ml-1">Minimum 6 characters</p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Create Account
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Login Link */}
                <div className="px-8 pb-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
