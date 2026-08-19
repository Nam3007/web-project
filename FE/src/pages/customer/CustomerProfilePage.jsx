import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    Ticket,
    CheckCircle2,
    Copy,
    Check,
    Sparkles,
    Shield,
    Clock,
    AlertCircle,
    ArrowRight,
    ShoppingBag,
    Crown,
    Save
} from 'lucide-react';

export default function CustomerProfilePage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'settings'

    // Form State
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);
    const [notification, setNotification] = useState(null);

    // 1. Fetch Customer Full Profile
    const { data: customerProfile, isLoading: loadingProfile } = useQuery({
        queryKey: ['customerProfile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const res = await api.get(`/customers/${user.id}`);
            return res.data;
        },
        enabled: !!user?.id
    });

    // 2. Fetch Available Coupons
    const { data: myCoupons = [], isLoading: loadingCoupons } = useQuery({
        queryKey: ['myCoupons', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const res = await api.get(`/coupons/customer/${user.id}`);
            return res.data;
        },
        enabled: !!user?.id,
        refetchInterval: 10000
    });

    // Populate form when profile data loads
    useEffect(() => {
        if (customerProfile) {
            setFullName(customerProfile.full_name || '');
            setPhone(customerProfile.phone || '');
            setEmail(customerProfile.email || '');
            setUsername(customerProfile.username || '');
        }
    }, [customerProfile]);

    // Update Profile Mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (payload) => {
            return api.put(`/customers/${user.id}`, payload);
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries(['customerProfile']);
            if (updateUser && res.data?.full_name) {
                updateUser({ full_name: res.data.full_name });
            }
            setNewPassword('');
            setConfirmPassword('');
            setNotification({ type: 'success', message: 'Profile updated successfully!' });
            setTimeout(() => setNotification(null), 4000);
        },
        onError: (err) => {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to update profile';
            setNotification({ type: 'error', message: errorMsg });
            setTimeout(() => setNotification(null), 5000);
        }
    });

    const handleSaveProfile = (e) => {
        e.preventDefault();

        if (!fullName.trim()) {
            setNotification({ type: 'error', message: 'Full name cannot be empty.' });
            return;
        }

        if (newPassword && newPassword.length < 6) {
            setNotification({ type: 'error', message: 'New password must be at least 6 characters.' });
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            setNotification({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        const payload = {
            full_name: fullName.trim(),
            phone: phone.trim() || null
        };

        if (newPassword) {
            payload.password_hashed = newPassword;
        }

        updateProfileMutation.mutate(payload);
    };

    const handleCopyCoupon = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2500);
    };

    const handleUseCoupon = (code) => {
        navigator.clipboard.writeText(code);
        navigate('/cart');
    };

    const isVip = customerProfile?.role === 'vip_customer';
    const activeCoupons = myCoupons.filter(c => !c.is_used && new Date(c.expires_at) > new Date());

    return (
        <div className="customer-page customer-page-wide pb-16 space-y-8">
            
            {/* Notification Banner */}
            {notification && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm animate-fade-in ${
                    notification.type === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <p className="text-sm font-semibold flex-1">{notification.message}</p>
                </div>
            )}

            {/* Profile Header Card */}
            <div className="bg-white/95 backdrop-blur rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                    {/* User Avatar */}
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold font-serif shadow-lg shadow-emerald-200/60 ring-4 ring-emerald-50">
                        {customerProfile?.full_name ? customerProfile.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                            <h2 className="text-2xl font-bold font-serif text-slate-900">{customerProfile?.full_name || user?.full_name}</h2>
                            {isVip ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                                    VIP Member
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                    Regular Member
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono">@{customerProfile?.username || user?.username} • {customerProfile?.email}</p>
                        <p className="text-xs text-slate-400">
                            Member since {customerProfile?.created_at ? new Date(customerProfile.created_at).toLocaleDateString('en-GB') : '2026'}
                        </p>
                    </div>
                </div>

                {/* Tab Navigation Buttons */}
                <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 w-full sm:w-auto justify-center">
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                            activeTab === 'coupons'
                                ? 'bg-primary text-white shadow-md shadow-emerald-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                    >
                        <Ticket className="w-4 h-4" />
                        My Coupons
                        {activeCoupons.length > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${activeTab === 'coupons' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                                {activeCoupons.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                            activeTab === 'settings'
                                ? 'bg-primary text-white shadow-md shadow-emerald-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                    >
                        <User className="w-4 h-4" />
                        Profile Settings
                    </button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  TAB 1: AVAILABLE COUPONS & VOUCHERS                           */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'coupons' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-emerald-100/60 pb-4">
                        <div>
                            <h3 className="text-xl font-bold font-serif text-slate-900">Your Discount Coupons</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Apply voucher codes during checkout in your Cart to enjoy instant percentage discounts.</p>
                        </div>
                    </div>

                    {loadingCoupons ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-44 bg-white/70 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : activeCoupons.length === 0 ? (
                        <div className="bg-white/95 backdrop-blur rounded-[2rem] p-12 text-center border border-dashed border-slate-200 space-y-4">
                            <Ticket className="w-14 h-14 text-slate-300 mx-auto" />
                            <div className="space-y-1">
                                <h4 className="text-lg font-bold font-serif text-slate-800">No Active Coupons Found</h4>
                                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                                    You currently do not have any active discount vouchers. Place orders exceeding the minimum spend threshold to automatically earn discount coupons!
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/menu')}
                                className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 hover:bg-emerald-600 transition-all"
                            >
                                Browse Menu & Order
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeCoupons.map(coupon => {
                                const expDate = new Date(coupon.expires_at);
                                const isCopied = copiedCode === coupon.code;

                                return (
                                    <div
                                        key={coupon.id}
                                        className="relative bg-white rounded-[2rem] p-6 shadow-sm border border-emerald-100/80 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                                    >
                                        {/* Background Decor */}
                                        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-100/40 to-accent/10 rounded-full blur-2xl -z-10 group-hover:scale-125 transition-transform duration-500" />

                                        <div className="space-y-4">
                                            {/* Voucher Badge Header */}
                                            <div className="flex items-center justify-between">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                                                    {coupon.discount_percentage}% OFF
                                                </span>
                                                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Expires {expDate.toLocaleDateString('en-GB')}
                                                </span>
                                            </div>

                                            {/* Code Display Box */}
                                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between group-hover:border-primary/40 transition-colors">
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Voucher Code</span>
                                                    <span className="font-mono font-extrabold text-base text-slate-900 tracking-wider select-all">
                                                        {coupon.code}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => handleCopyCoupon(coupon.code)}
                                                    className={`p-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 ${
                                                        isCopied
                                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-primary hover:border-primary/40'
                                                    }`}
                                                    title="Copy Code"
                                                >
                                                    {isCopied ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5" />
                                                            Copy
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action: Use In Cart */}
                                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-400">Valid for any dine-in/shipping order</span>
                                            <button
                                                onClick={() => handleUseCoupon(coupon.code)}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-700 transition-colors"
                                            >
                                                Use in Cart
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  TAB 2: PROFILE & PASSWORD SETTINGS                            */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'settings' && (
                <div className="bg-white/95 backdrop-blur rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-slate-200/80 max-w-3xl mx-auto space-y-8 animate-fade-in">
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold font-serif text-slate-900">Update Profile Details</h3>
                        <p className="text-xs text-slate-500 mt-1">Keep your personal information and contact details up-to-date.</p>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        
                        {/* Name & Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Your full name"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:border-primary focus:bg-white focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="e.g. 0912345678"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:border-primary focus:bg-white focus:outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Username & Email (Account Identifiers) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Username (Read-only)
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                    <input
                                        type="text"
                                        disabled
                                        value={username}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200/60 rounded-2xl text-sm font-semibold text-slate-500 cursor-not-allowed select-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Email Address (Account ID)
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                    <input
                                        type="email"
                                        disabled
                                        value={email}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200/60 rounded-2xl text-sm font-semibold text-slate-500 cursor-not-allowed select-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security: Change Password */}
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-slate-500" />
                                        Change Password (Optional)
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Leave blank if you wish to keep your current password.</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                                >
                                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">New Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:border-primary focus:bg-white focus:outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Confirm New Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:border-primary focus:bg-white focus:outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={updateProfileMutation.isPending}
                                className="px-8 py-3.5 bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-200/60 flex items-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Save className="w-4 h-4" />
                                {updateProfileMutation.isPending ? 'Saving Changes...' : 'Save Profile Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
