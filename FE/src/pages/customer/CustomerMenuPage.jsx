import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { Search, Plus, Utensils, CheckCircle2, X, ShoppingBag } from 'lucide-react';
import { StarDisplay } from '../../components/RatingModal';
import { WarmPageWrapper, FlourishOrnament, BackgroundPattern } from '../../components/RestaurantDecorations';

const CATEGORIES = ['food', 'drink', 'appetizer', 'dessert'];

const CATEGORY_EMOJI = {
    food: '🍽️',
    drink: '🍷',
    appetizer: '🥗',
    dessert: '🍰',
};

export default function CustomerMenuPage() {
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState(null);
    const [addedItemId, setAddedItemId] = useState(null);
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

    const handleAdd = (item) => {
        addToCart(item);
        setAddedItemId(item.id);
        setTimeout(() => setAddedItemId(null), 1200);
    };

    if (isLoading) {
        return (
            <WarmPageWrapper pattern="utensils">
                <div className="space-y-8 animate-pulse">
                    <div className="h-64 bg-r-warm/10 rounded-3xl" />
                    <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-10 w-24 bg-r-warm/10 rounded-full" />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-72 bg-r-warm/10 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </WarmPageWrapper>
        );
    }

    return (
        <WarmPageWrapper pattern="utensils">
            <div className="space-y-8">
                {/* Table Confirmation Notification */}
                {notification && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl shadow-sm animate-fade-in">
                        <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shrink-0 shadow shadow-green-200">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <p className="flex-1 text-sm font-medium text-green-800 font-sans">{notification}</p>
                        <button
                            onClick={() => setNotification(null)}
                            className="p-1 text-green-400 hover:text-green-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ── Hero Section ─────────────────────────────────── */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[21/9] md:aspect-[21/6] grain-overlay">
                    <img
                        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
                        className="absolute inset-0 w-full h-full object-cover"
                        alt="Delicious Food"
                    />
                    {/* Warm amber overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-r-dark/85 via-r-wood/70 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-r-dark/60 to-transparent" />

                    {/* Hero content */}
                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 z-10">
                        <p className="text-r-gold text-xs md:text-sm uppercase tracking-[0.25em] font-sans font-semibold mb-2 md:mb-3">
                            River Side Restaurant
                        </p>
                        <h1 className="text-3xl md:text-5xl font-serif font-extrabold text-r-cream mb-3 md:mb-4 tracking-tight leading-tight">
                            Taste the <span className="text-r-gold">Extraordinary</span>
                        </h1>
                        <p className="text-base md:text-lg text-r-cream/70 max-w-lg font-sans font-light">
                            Experience culinary excellence. Fresh ingredients, masterful recipes,
                            unforgettable flavors.
                        </p>
                        <FlourishOrnament className="mt-4 md:mt-6 opacity-60 !justify-start" size="md" />
                    </div>
                </div>

                {/* ── Filters and Search ───────────────────────────── */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-16 md:top-18 z-10 bg-r-ivory/90 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 border-b border-r-border/30">
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                        <button
                            onClick={() => setSelectedCategory('ALL')}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm font-sans ${
                                selectedCategory === 'ALL'
                                    ? 'bg-r-dark text-r-gold border border-r-gold/30 shadow-md'
                                    : 'bg-white text-r-text hover:bg-r-cream border border-r-border/60'
                            }`}
                        >
                            ✨ All
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm capitalize font-sans ${
                                    selectedCategory === cat
                                        ? 'bg-r-dark text-r-gold border border-r-gold/30 shadow-md'
                                        : 'bg-white text-r-text hover:bg-r-cream border border-r-border/60'
                                }`}
                            >
                                {CATEGORY_EMOJI[cat] || ''} {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-r-muted/60" />
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-r-border/60 rounded-full focus:outline-none focus:ring-2 focus:ring-r-gold/30 focus:border-r-gold bg-white text-sm shadow-sm font-sans text-r-text placeholder:text-r-muted/50"
                        />
                    </div>
                </div>

                {/* ── Menu Grid ────────────────────────────────────── */}
                {filteredMenu.length === 0 ? (
                    <div className="text-center py-20 text-r-muted font-sans">
                        <Utensils className="w-12 h-12 mx-auto mb-4 text-r-muted/30" />
                        <p className="text-lg font-serif font-semibold text-r-text mb-1">No dishes found</p>
                        <p className="text-sm">Try a different category or search term.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                        {filteredMenu.map((item, idx) => (
                            <div
                                key={item.id}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-r-border/40 overflow-hidden hover:shadow-xl hover:shadow-r-gold/5 hover:-translate-y-1 hover:border-r-gold/30 transition-all duration-300 group animate-fade-in-up"
                                style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
                            >
                                {/* Image */}
                                <div className="h-52 overflow-hidden relative">
                                    {item.item_image ? (
                                        <img
                                            src={item.item_image}
                                            alt={item.item_name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-r-cream text-r-muted/30">
                                            <Utensils className="w-12 h-12" />
                                        </div>
                                    )}

                                    {/* Hover overlay with add button */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-r-dark/70 via-r-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <button
                                            onClick={() => handleAdd(item)}
                                            className="w-full py-3 bg-r-gold hover:bg-r-gold-light text-r-dark font-bold rounded-xl flex items-center justify-center gap-2 transition-colors font-sans shadow-lg shadow-r-gold/30 active:scale-[0.97]"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Add to Cart
                                        </button>
                                    </div>

                                    {/* Category badge */}
                                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-r-dark/70 backdrop-blur-sm text-r-gold text-[10px] font-bold uppercase tracking-wider rounded-lg border border-r-gold/20 font-sans">
                                        {item.item_type}
                                    </div>

                                    {/* Added feedback */}
                                    {addedItemId === item.id && (
                                        <div className="absolute inset-0 bg-r-dark/60 flex items-center justify-center animate-fade-in">
                                            <div className="flex items-center gap-2 bg-r-gold text-r-dark px-4 py-2 rounded-xl font-bold font-sans text-sm shadow-xl">
                                                <CheckCircle2 className="w-5 h-5" />
                                                Added!
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-1.5 gap-2">
                                        <h3 className="font-serif font-bold text-lg text-r-text line-clamp-1 group-hover:text-r-gold transition-colors">
                                            {item.item_name}
                                        </h3>
                                        <span className="font-bold text-base text-r-gold whitespace-nowrap font-sans tabular-nums">
                                            {item.item_price.toLocaleString('vi-VN')}₫
                                        </span>
                                    </div>

                                    {item.average_rating && (
                                        <div className="mb-2">
                                            <StarDisplay rating={item.average_rating} size="sm" />
                                        </div>
                                    )}

                                    <p className="text-r-muted text-sm line-clamp-2 h-10 mb-4 font-sans leading-relaxed">
                                        {item.item_description || 'No description available.'}
                                    </p>

                                    {/* Bottom bar */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-green-600 uppercase tracking-wider font-sans">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Available
                                        </div>
                                        <button
                                            onClick={() => handleAdd(item)}
                                            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-r-gold/10 text-r-gold text-xs font-bold rounded-lg border border-r-gold/20 hover:bg-r-gold/20 transition-colors font-sans active:scale-[0.95]"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </WarmPageWrapper>
    );
}
