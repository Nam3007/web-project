import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { Search, Plus, Utensils, CheckCircle2, X, Sparkles, Flame, Leaf, Sandwich } from 'lucide-react';
import { StarDisplay } from '../../components/RatingModal';

const CATEGORIES = ['ALL', 'food', 'drink', 'appetizer', 'dessert'];
const CATEGORY_META = {
    ALL: { label: 'All picks', icon: Sparkles, tone: 'from-emerald-600 to-teal-600', description: 'Every dish worth exploring' },
    food: { label: 'Food', icon: Flame, tone: 'from-orange-500 to-rose-500', description: 'Main dishes and signatures' },
    drink: { label: 'Drinks', icon: Leaf, tone: 'from-sky-500 to-cyan-500', description: 'Cold and hot beverages' },
    appetizer: { label: 'Starters', icon: Sandwich, tone: 'from-amber-500 to-yellow-500', description: 'Light bites to begin with' },
    dessert: { label: 'Desserts', icon: Sparkles, tone: 'from-pink-500 to-fuchsia-500', description: 'Sweet finishes' },
};

export default function CustomerMenuPage() {
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState(null);
    const { addToCart } = useCart();
    const location = useLocation();

    // Show success banner if navigated from table selection
    useEffect(() => {
        if (location.state?.tableConfirmed) {
            setNotification(`Table ${location.state.tableNumber} selected successfully. Please proceed to select menu items.`);
            // Auto-dismiss after 4 seconds
            const timer = setTimeout(() => setNotification(null), 4000);
            // Clear state so banner doesn't reappear on re-render
            window.history.replaceState({}, '');
            return () => clearTimeout(timer);
        }
    }, [location.state]);

    // Fetch Menu
    const { data: menuItems = [], isLoading } = useQuery({
        queryKey: ['menuItems'],
        queryFn: async () => {
            const res = await api.get('/menu-items/');
            return res.data; // Filter by is_available?
        }
    });

    const availableItems = menuItems.filter(item => item.is_available);

    const filteredMenu = availableItems.filter(item => {
        const matchesType = selectedCategory === 'ALL' || item.item_type === selectedCategory;
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const activeCategoryMeta = CATEGORY_META[selectedCategory] || CATEGORY_META.ALL;

    const handleAdd = (item) => {
        addToCart(item);
        // Optional: Toast notification
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-64 rounded-[2rem] bg-white/70 animate-pulse" />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="h-96 rounded-[1.75rem] bg-white/70 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-6">

            <div className="space-y-6">
                {/* Hero / Header */}
                <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-900 text-white shadow-[0_22px_60px_rgba(15,23,42,0.22)]">
                    <img
                        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
                        className="absolute inset-0 h-full w-full object-cover opacity-30"
                        alt="Restaurant dishes"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/80 to-emerald-950/70" />
                    <div className="relative flex min-h-[22rem] flex-col justify-between p-6 sm:p-8">
                        <div className="max-w-2xl space-y-4">
                            <p className="text-xs font-medium text-emerald-200">
                                Menu Explorer
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                                Our <span className="text-emerald-400">Menu</span>
                            </h1>
                            <p className="max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
                                Browse our dishes, filter by category, and build your cart for dine-in or delivery.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                ['Discover', 'Search and filter dishes quickly'],
                                ['Choose', 'Compare prices, photos, and ratings'],
                                ['Add', 'Build your cart before checkout'],
                            ].map(([title, text]) => (
                                <div key={title} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                    <p className="text-sm font-semibold text-white">{title}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-200/80">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Table Confirmation Notification */}
            {notification && (
                <div className="flex items-center gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 shadow-sm animate-fade-in">
                    <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow shadow-emerald-200">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <p className="flex-1 text-sm font-medium text-emerald-800">{notification}</p>
                    <button
                        onClick={() => setNotification(null)}
                        className="p-1 text-emerald-400 hover:text-emerald-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {/* Filters and Search */}
            <div className="sticky top-24 z-20 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0">
                    {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`group flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                            >
                                {cat === 'ALL' ? <Sparkles className="h-4 w-4" /> : null}
                                <span className="capitalize">{cat === 'ALL' ? 'All' : cat}</span>
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full xl:w-96">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm shadow-sm outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            {filteredMenu.length === 0 ? (
                <div className="rounded-[1.75rem] border border-slate-200 bg-white py-20 text-center text-slate-500 shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                        <Utensils className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-semibold text-slate-700">No items found.</p>
                    <p className="mt-2 text-sm text-slate-500">Try another category or search term to discover more dishes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredMenu.map(item => (
                        <div key={item.id} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                            <div className="relative h-56 overflow-hidden">
                                {item.item_image ? (
                                    <img src={item.item_image} alt={item.item_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300">
                                        <Utensils className="h-12 w-12" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end p-4">
                                    <button
                                        onClick={() => handleAdd(item)}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-slate-900 transition-colors hover:bg-emerald-500 hover:text-white"
                                    >
                                        <Plus className="h-5 w-5" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3 p-5">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <h3 className="text-xl font-semibold tracking-tight text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">{item.item_name}</h3>
                                        <p className="text-xs font-medium text-slate-500">Fresh from the kitchen</p>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{item.item_price.toLocaleString('vi-VN')}₫</span>
                                </div>
                                {item.average_rating && (
                                    <div>
                                        <StarDisplay rating={item.average_rating} size="sm" />
                                    </div>
                                )}
                                <p className="min-h-10 text-sm leading-6 text-slate-500 line-clamp-2">{item.item_description || 'No description available.'}</p>
                                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    Available
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
