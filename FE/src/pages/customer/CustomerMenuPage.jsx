import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { Search, Plus, Utensils, CheckCircle2, X, Sparkles, Flame, Leaf, Sandwich, Coffee } from 'lucide-react';
import { StarDisplay } from '../../components/RatingModal';

const CATEGORIES = ['ALL', 'food', 'drink', 'appetizer', 'dessert'];
const CATEGORY_META = {
    ALL: { label: 'Discover All', icon: Sparkles, color: 'text-primary' },
    food: { label: 'Mains', icon: Flame, color: 'text-highlight' },
    drink: { label: 'Beverages', icon: Coffee, color: 'text-sky-500' },
    appetizer: { label: 'Starters', icon: Sandwich, color: 'text-accent' },
    dessert: { label: 'Sweets', icon: Leaf, color: 'text-pink-500' },
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
            const timer = setTimeout(() => setNotification(null), 4000);
            window.history.replaceState({}, '');
            return () => clearTimeout(timer);
        }
    }, [location.state]);

    // Fetch Menu
    const { data: menuItems = [], isLoading } = useQuery({
        queryKey: ['menuItems'],
        queryFn: async () => {
            const res = await api.get('/menu-items/');
            return res.data;
        }
    });

    const availableItems = menuItems.filter(item => item.is_available);

    const filteredMenu = availableItems.filter(item => {
        const matchesType = selectedCategory === 'ALL' || item.item_type === selectedCategory;
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const handleAdd = (item) => {
        addToCart(item);
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="h-72 rounded-[2rem] bg-slate-200/50 animate-pulse" />
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="h-96 rounded-[1.5rem] bg-white shadow-sm animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="customer-page customer-page-wide pb-12">
            
            {notification && (
                <div className="mb-6 flex items-center gap-4 rounded-2xl border-l-4 border-primary bg-emerald-50 p-4 shadow-sm animate-fade-in">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="flex-1 text-sm font-semibold text-emerald-900">{notification}</p>
                    <button onClick={() => setNotification(null)} className="p-2 text-emerald-600 transition-colors hover:text-emerald-800 hover:bg-emerald-100/50 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Parallax Hero Section */}
            <section className="relative overflow-hidden rounded-[2.5rem] shadow-xl group h-[28rem] mb-12">
                <div className="absolute inset-1 ">
                    <img 
                        src="src/assets/vietnamese-food-hero.jpg" 
                        className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000 ease-out" 
                        alt="Fresh Vietnamese Food" 
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-900/40" />
                <div className="absolute inset-0 vietnam-pattern opacity-20 pointer-events-none"></div>
                
                <div className="relative h-full flex flex-col justify-center p-8 sm:p-12 z-10">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md mb-6 shadow-lg shadow-black/10">
                        <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                        Authentic Flavors, Modern Twist
                    </div>
                    <div className="max-w-2xl space-y-4">
                        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-serif leading-tight">
                            The Essence of <br />
                            <span className="text-accent italic">Vietnamese Cuisine</span>
                        </h1>
                        <p className="max-w-xl text-base leading-relaxed text-slate-200">
                            Discover our carefully curated menu featuring fresh herbs, rich broths, and vibrant flavors. Every dish is a journey.
                        </p>
                    </div>
                </div>
            </section>

            {/* Filter and Search Bar */}
            <div className="sticky top-24 z-30 mb-8 rounded-[2rem] border border-white/60 bg-white/70 p-3 sm:p-4 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 hide-scrollbar px-1">
                        {CATEGORIES.map(cat => {
                            const meta = CATEGORY_META[cat];
                            const Icon = meta.icon;
                            const isActive = selectedCategory === cat;
                            return (
                                <button 
                                    key={cat} 
                                    onClick={() => setSelectedCategory(cat)} 
                                    className={`group flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-bold whitespace-nowrap transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-md shadow-emerald-200 border border-primary' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary/50 hover:bg-emerald-50 hover:text-primary'}`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : meta.color} transition-colors`} />
                                    <span>{meta.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative w-full xl:w-96 px-1 xl:px-0">
                        <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search dishes (e.g., Pho, Banh Mi)..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full rounded-full border-2 border-slate-100 bg-white pl-12 pr-6 py-3.5 text-sm shadow-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/10 font-medium text-slate-700 placeholder:text-slate-400" 
                        />
                    </div>
                </div>
            </div>

            {/* Menu Grid */}
            {filteredMenu.length === 0 ? (
                <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/50 py-24 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300 shadow-inner">
                        <Utensils className="h-10 w-10" />
                    </div>
                    <p className="text-xl font-bold text-slate-700 font-serif">No dishes found</p>
                    <p className="mt-2 text-slate-500">Try adjusting your category or search term.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {filteredMenu.map(item => (
                        <div key={item.id} className="group flex flex-col overflow-hidden rounded-[1.5rem] bg-white border border-slate-100 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-900/5 relative">
                            {/* Decorative Background */}
                            <div className="absolute inset-0 vietnam-pattern opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none z-0"></div>
                            
                            <div className="relative h-64 overflow-hidden z-10 p-2">
                                <div className="w-full h-full rounded-[1rem] overflow-hidden relative">
                                    {item.item_image ? (
                                        <img src={item.item_image} alt={item.item_name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-slate-50 text-slate-300">
                                            <Utensils className="h-12 w-12" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-60"></div>
                                    
                                    {/* Price Badge */}
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur shadow-lg px-3.5 py-1.5 rounded-xl border border-white">
                                        <span className="font-bold text-slate-900">{item.item_price.toLocaleString('vi-VN')}</span>
                                        <span className="text-xs font-semibold text-primary ml-1">₫</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col p-6 z-10 bg-white">
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="line-clamp-1 text-xl font-bold tracking-tight text-slate-900 font-serif group-hover:text-primary transition-colors">{item.item_name}</h3>
                                    </div>
                                    {item.average_rating ? (
                                        <div className="mb-2"><StarDisplay rating={item.average_rating} size="sm" /></div>
                                    ) : (
                                        <div className="h-4 mb-2"></div>
                                    )}
                                </div>
                                
                                <p className="flex-1 line-clamp-2 text-sm leading-relaxed text-slate-500 mb-6">{item.item_description || 'A delicious choice for your meal.'}</p>
                                
                                <button 
                                    onClick={() => handleAdd(item)} 
                                    className="relative overflow-hidden w-full group/btn flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 py-3.5 font-bold text-slate-700 transition-all hover:bg-primary hover:border-primary hover:text-white hover:shadow-lg hover:shadow-primary/30"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                    <Plus className="h-5 w-5 relative z-10" />
                                    <span className="relative z-10">Add to Order</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
