import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { Search, Plus, Utensils, CheckCircle2, X, Sparkles, Flame, Leaf, Sandwich, Coffee, ShoppingBag, ChevronRight, ChevronDown, Star, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, DollarSign } from 'lucide-react';
import { StarDisplay } from '../../components/RatingModal';

const CATEGORIES = ['ALL', 'food', 'drink', 'appetizer', 'dessert'];
const CATEGORY_META = {
    ALL: { label: 'Discover All', icon: Sparkles, color: 'text-accent' },
    food: { label: 'Mains', icon: Flame, color: 'text-highlight' },
    drink: { label: 'Beverages', icon: Coffee, color: 'text-sky-500' },
    appetizer: { label: 'Starters', icon: Sandwich, color: 'text-accent' },
    dessert: { label: 'Sweets', icon: Leaf, color: 'text-pink-500' },
};

export default function CustomerMenuPage() {
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [priceSort, setPriceSort] = useState('none'); // 'none' | 'asc' (smaller/cheaper first) | 'desc' (larger/expensive first)
    const [priceRange, setPriceRange] = useState('ALL'); // 'ALL' | 'under50k' | '50k-100k' | 'above100k' | 'custom'
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [notification, setNotification] = useState(null);
    const [featuredItemId, setFeaturedItemId] = useState(null);
    const [isImageTransitioning, setIsImageTransitioning] = useState(false);
    const { addToCart, cartCount, cartTotal } = useCart();
    const location = useLocation();
    const navigate = useNavigate();

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

    // Top 4 most rated items
    const topRatedItems = useMemo(() => {
        return [...availableItems]
            .filter(item => item.average_rating && item.average_rating > 0)
            .sort((a, b) => b.average_rating - a.average_rating)
            .slice(0, 4);
    }, [availableItems]);

    // Set initial featured item to #1 rated
    useEffect(() => {
        if (topRatedItems.length > 0 && !featuredItemId) {
            setFeaturedItemId(topRatedItems[0].id);
        }
    }, [topRatedItems, featuredItemId]);

    const featuredItem = topRatedItems.find(item => item.id === featuredItemId) || topRatedItems[0];

    // Smooth image transition when switching featured item
    const handleSelectFeatured = (itemId) => {
        if (itemId === featuredItemId) return;
        setIsImageTransitioning(true);
        setTimeout(() => {
            setFeaturedItemId(itemId);
            setTimeout(() => setIsImageTransitioning(false), 50);
        }, 250);
    };

    const filteredMenu = useMemo(() => {
        const result = availableItems.filter(item => {
            const matchesType = selectedCategory === 'ALL' || item.item_type === selectedCategory;
            const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesPrice = true;
            const price = Number(item.item_price) || 0;

            if (priceRange === 'under50k') {
                matchesPrice = price < 50000;
            } else if (priceRange === '50k-100k') {
                matchesPrice = price >= 50000 && price <= 100000;
            } else if (priceRange === 'above100k') {
                matchesPrice = price > 100000;
            } else if (priceRange === 'custom') {
                if (minPrice && price < Number(minPrice)) matchesPrice = false;
                if (maxPrice && price > Number(maxPrice)) matchesPrice = false;
            }

            return matchesType && matchesSearch && matchesPrice;
        });

        if (priceSort === 'asc') {
            result.sort((a, b) => Number(a.item_price) - Number(b.item_price));
        } else if (priceSort === 'desc') {
            result.sort((a, b) => Number(b.item_price) - Number(a.item_price));
        }

        return result;
    }, [availableItems, selectedCategory, searchQuery, priceRange, minPrice, maxPrice, priceSort]);

    const handleAdd = (item) => {
        addToCart(item);
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="min-h-[80vh] rounded-[2.5rem] bg-white/60 animate-pulse" />
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="h-96 rounded-[1.5rem] bg-white/40 animate-pulse" />
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

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  HERO — Figma "Food Zone" Style Layout                        */}
            {/*  Left: Big heading | Center: Plate image | Right: 4 cards     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {topRatedItems.length > 0 && featuredItem && (
                <section className="relative min-h-[calc(100vh-14rem)] bg-hero-surface rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col mb-16 animate-fade-in">
                    {/* Subtle decorative dots */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />

                    {/* Main content grid */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr_1fr] gap-6 lg:gap-10 items-center px-8 sm:px-12 lg:px-16 py-10 lg:py-8">
                        
                        {/* ─── LEFT: Big Heading ─── */}
                        <div className="space-y-6 text-center lg:text-left order-1 lg:order-1 animate-fade-in-left">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-slate-900 font-serif leading-[0.92] tracking-tight">
                                Flavor<br />
                                <span className="italic text-accent">Zone</span>
                            </h1>
                            <div className="flex items-center gap-4 justify-center lg:justify-start">
                                <div className="w-10 h-[2px] bg-slate-300 rounded-full" />
                                <p className="text-xs sm:text-sm text-slate-400 uppercase tracking-[0.15em] max-w-[220px] leading-relaxed">
                                    Discover our finest Vietnamese cuisine, crafted with passion.
                                </p>
                            </div>
                        </div>

                        {/* ─── CENTER: Large Plate Image ─── */}
                        <div className="flex items-center justify-center order-2 lg:order-2 py-4 lg:py-0">
                            <div className="relative">
                                {/* Glow behind plate */}
                                <div className="absolute inset-0 scale-110 rounded-full bg-accent/[0.07] blur-3xl transition-all duration-700" />
                                <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-accent/10 via-transparent to-amber-100/20 blur-2xl" />

                                {/* Plate */}
                                <div className={`relative w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 xl:w-[22rem] xl:h-[22rem] rounded-full overflow-hidden border-[6px] border-white shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-500 ${isImageTransitioning ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
                                    {featuredItem.item_image ? (
                                        <img 
                                            src={featuredItem.item_image}
                                            alt={featuredItem.item_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-slate-50 text-slate-300">
                                            <Utensils className="h-16 w-16" />
                                        </div>
                                    )}
                                </div>

                                {/* Star rating floating badge */}
                                {featuredItem.average_rating && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100">
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        <span className="text-sm font-bold text-slate-700">{Number(featuredItem.average_rating).toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── RIGHT: Top 4 Rated Food Cards ─── */}
                        <div className="flex flex-col gap-3 order-3 lg:order-3">
                            {topRatedItems.map((item, idx) => {
                                const isActive = featuredItem?.id === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelectFeatured(item.id)}
                                        className={`group flex items-center gap-4 p-3 sm:p-3.5 rounded-2xl text-left transition-all duration-400 opacity-0 animate-slide-up stagger-${idx + 1}
                                            ${isActive 
                                                ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-[1.03]' 
                                                : 'bg-white hover:bg-slate-50 border border-slate-100/80 shadow-sm hover:shadow-md hover:scale-[1.01]'
                                            }`}
                                    >
                                        {/* Circular thumbnail */}
                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 transition-all duration-300 ${isActive ? 'border-2 border-white/60 shadow-md' : 'border-2 border-slate-100 shadow-sm'}`}>
                                            {item.item_image ? (
                                                <img src={item.item_image} alt={item.item_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                    <Utensils className="w-5 h-5 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-extrabold text-xs sm:text-sm uppercase tracking-wide line-clamp-1 transition-colors ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                                {item.item_name}
                                            </h3>
                                            <p className={`text-[11px] sm:text-xs line-clamp-1 mt-0.5 transition-colors ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                                                {item.item_description || 'A delicious choice for your meal'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ─── BOTTOM: CTA Button ─── */}
                    <div className="flex justify-center pb-10 px-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <button
                            onClick={() => {
                                if (featuredItem) {
                                    handleAdd(featuredItem);
                                    setNotification(`✓ ${featuredItem.item_name} added to cart successfully!`);
                                    setTimeout(() => setNotification(null), 3000);
                                }
                            }}
                            className="group inline-flex items-center gap-5 bg-accent hover:bg-amber-500 text-white pl-8 pr-10 py-4 rounded-full font-bold text-sm sm:text-base shadow-xl shadow-accent/25 transition-all duration-300 hover:scale-105 hover:shadow-accent/35 active:scale-[0.98]"
                        >
                            <span className="font-extrabold text-base sm:text-lg">{featuredItem?.item_price?.toLocaleString('vi-VN')}₫</span>
                            <span className="w-8 h-[1.5px] bg-white/40 rounded-full" />
                            <span className="tracking-widest uppercase text-sm">Order Now</span>
                        </button>
                    </div>

                    {/* Scroll hint */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                        <ChevronDown className="w-5 h-5 text-slate-300 animate-scroll-hint" />
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  MENU SECTION — Category Filters + Full Menu Grid             */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* Section Title */}
            <div className="flex items-center gap-6 mb-8 px-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-text-light font-serif tracking-tight whitespace-nowrap">Full Menu</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-text-light/20 via-text-light/10 to-transparent" />
            </div>

            {/* Filter and Search Bar */}
            <div className="sticky top-24 z-30 mb-8 rounded-[2rem] border border-white/20 bg-white/10 p-3 sm:p-4 shadow-lg shadow-black/10 backdrop-blur-xl space-y-3">
                {/* Category & Search Row */}
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 hide-scrollbar px-1">
                        {CATEGORIES.map(cat => {
                            const meta = CATEGORY_META[cat];
                            const Icon = meta.icon;
                            const isActive = selectedCategory === cat;
                            return (
                                <button 
                                    key={cat} 
                                    onClick={() => setSelectedCategory(cat)} 
                                    className={`group flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-bold whitespace-nowrap transition-all duration-300 ${isActive ? 'bg-accent text-white shadow-md shadow-accent/20 border border-accent' : 'bg-white/10 text-white/70 border border-white/10 hover:border-accent/40 hover:bg-accent/10 hover:text-white'}`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : meta.color} transition-colors`} />
                                    <span>{meta.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative w-full xl:w-96 px-1 xl:px-0">
                        <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                        <input 
                            type="text" 
                            placeholder="Search dishes (e.g., Pho, Banh Mi)..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full rounded-full border-2 border-white/10 bg-white/10 pl-12 pr-6 py-3.5 text-sm shadow-sm outline-none transition-all focus:border-accent/40 focus:ring-4 focus:ring-accent/10 font-medium text-white placeholder:text-white/40" 
                        />
                    </div>
                </div>

                {/* Price Filter & Sort Sub-Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 px-1 text-xs">
                    
                    {/* Left: Price Range Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                        <span className="text-white/50 font-bold uppercase tracking-wider text-[11px] shrink-0 mr-1">Price Range:</span>
                        {[
                            { id: 'ALL', label: 'All Prices' },
                            { id: 'under50k', label: '< 50,000₫' },
                            { id: '50k-100k', label: '50,000₫ – 100,000₫' },
                            { id: 'above100k', label: '> 100,000₫' },
                        ].map(range => (
                            <button
                                key={range.id}
                                onClick={() => setPriceRange(range.id)}
                                className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                                    priceRange === range.id
                                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                                        : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/10'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    {/* Right: Price Sort (Low to High / High to Low) */}
                    <div className="flex items-center gap-2">
                        <span className="text-white/50 font-bold uppercase tracking-wider text-[11px]">Sort:</span>
                        
                        {/* Smaller price first (Low to High) */}
                        <button
                            onClick={() => setPriceSort(priceSort === 'asc' ? 'none' : 'asc')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all ${
                                priceSort === 'asc'
                                    ? 'bg-accent text-white shadow-sm font-bold'
                                    : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/10'
                            }`}
                            title="Sort by smaller / cheaper price first"
                        >
                            <ArrowUp className="w-3.5 h-3.5" />
                            Price: Low → High
                        </button>

                        {/* Larger price first (High to Low) */}
                        <button
                            onClick={() => setPriceSort(priceSort === 'desc' ? 'none' : 'desc')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all ${
                                priceSort === 'desc'
                                    ? 'bg-accent text-white shadow-sm font-bold'
                                    : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/10'
                            }`}
                            title="Sort by larger / expensive price first"
                        >
                            <ArrowDown className="w-3.5 h-3.5" />
                            Price: High → Low
                        </button>

                        {(priceRange !== 'ALL' || priceSort !== 'none' || searchQuery || selectedCategory !== 'ALL') && (
                            <button
                                onClick={() => {
                                    setPriceRange('ALL');
                                    setPriceSort('none');
                                    setSearchQuery('');
                                    setSelectedCategory('ALL');
                                }}
                                className="px-2.5 py-1 text-[11px] text-white/60 hover:text-white underline font-semibold ml-1"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Menu Grid */}
            {filteredMenu.length === 0 ? (
                <div className="rounded-[2rem] border-2 border-dashed border-white/20 bg-white/5 py-24 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white/30 shadow-inner">
                        <Utensils className="h-10 w-10" />
                    </div>
                    <p className="text-xl font-bold text-text-light font-serif">No dishes found</p>
                    <p className="mt-2 text-text-muted mb-6">Try adjusting your category, price range, or search term.</p>
                    <button 
                        onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setPriceRange('ALL'); setPriceSort('none'); }}
                        className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-2.5 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all hover:bg-white/20"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {filteredMenu.map((item, idx) => (
                        <div 
                            key={item.id} 
                            className={`menu-dark-card group flex flex-col overflow-hidden relative opacity-0 animate-fade-in-scale stagger-${(idx % 9) + 1}`}
                        >
                            {/* Shimmer overlay on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer pointer-events-none z-0 rounded-[1.5rem]" />
                            
                            {/* Image */}
                            <div className="relative h-64 overflow-hidden z-10 p-2">
                                <div className="w-full h-full rounded-[1.25rem] overflow-hidden relative">
                                    {item.item_image ? (
                                        <img 
                                            src={item.item_image} 
                                            loading="lazy" 
                                            decoding="async" 
                                            alt={item.item_name} 
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-surface-dark text-text-muted">
                                            <Utensils className="h-12 w-12" />
                                        </div>
                                    )}
                                    {/* Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60" />
                                    
                                    {/* Price Badge */}
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md shadow-lg px-3.5 py-1.5 rounded-xl border border-white">
                                        <span className="font-bold text-slate-900">{item.item_price.toLocaleString('vi-VN')}</span>
                                        <span className="text-xs font-semibold text-accent ml-1">₫</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex flex-col p-6 z-10">
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="line-clamp-1 text-xl font-bold tracking-tight text-text-light font-serif group-hover:text-accent transition-colors duration-300">{item.item_name}</h3>
                                    </div>
                                    {item.average_rating ? (
                                        <div className="mb-2"><StarDisplay rating={item.average_rating} size="sm" /></div>
                                    ) : (
                                        <div className="h-4 mb-2" />
                                    )}
                                </div>
                                
                                <p className="flex-1 line-clamp-2 text-sm leading-relaxed text-text-muted mb-6">{item.item_description || 'A delicious choice for your meal.'}</p>
                                
                                <button 
                                    onClick={() => handleAdd(item)} 
                                    className="relative overflow-hidden w-full group/btn flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-3.5 font-bold text-text-muted transition-all duration-300 hover:bg-accent hover:border-accent hover:text-white hover:shadow-lg hover:shadow-accent/20"
                                >
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                    <Plus className="h-5 w-5 relative z-10" />
                                    <span className="relative z-10">Add to Order</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  FLOATING CART BUTTON — Mobile                                */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {cartCount > 0 && (
                <div className="md:hidden fixed bottom-20 left-4 right-4 z-40 animate-fade-in">
                    <button 
                        onClick={() => navigate('/cart')}
                        className="w-full flex items-center justify-between bg-gradient-to-r from-accent to-amber-500 text-white p-4 rounded-[1.25rem] shadow-[0_8px_30px_rgba(245,158,11,0.3)] transition-transform active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ShoppingBag className="w-6 h-6" />
                                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-accent shadow-sm">
                                    {cartCount}
                                </span>
                            </div>
                            <span className="font-bold tracking-wide">View Cart</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-lg">
                            {cartTotal?.toLocaleString('vi-VN')}₫
                            <ChevronRight className="w-5 h-5 opacity-80" />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
