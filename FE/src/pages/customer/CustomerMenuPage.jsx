import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { Search, Plus, Utensils } from 'lucide-react';

const CATEGORIES = ['food', 'drink', 'appetizer', 'dessert'];

export default function CustomerMenuPage() {
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const { addToCart } = useCart();

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
        // Optional: Toast notification
    };

    if (isLoading) return <div className="text-center py-20">Loading menu...</div>;

    return (
        <div className="space-y-8">
            {/* Hero / Header */}
            <div className="relative bg-black rounded-3xl overflow-hidden shadow-xl aspect-[21/9] md:aspect-[21/6]">
                <img
                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    alt="Delicious Food"
                />
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Taste the <span className="text-primary">Extraordinary</span></h1>
                    <p className="text-lg md:text-xl font-medium opacity-90 max-w-lg">
                        Experience culinary excellence at River Side. Fresh ingredients, masterful recipes.
                    </p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 z-10 bg-gray-50 py-4">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === 'ALL'
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        All
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm capitalize ${selectedCategory === cat
                                    ? 'bg-black text-white hover:bg-gray-800'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search dishes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm shadow-sm"
                    />
                </div>
            </div>

            {/* Grid */}
            {filteredMenu.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    No items found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredMenu.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="h-56 overflow-hidden relative">
                                {item.item_image ? (
                                    <img src={item.item_image} alt={item.item_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-300">
                                        <Utensils className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <button
                                        onClick={() => handleAdd(item)}
                                        className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-xl text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">{item.item_name}</h3>
                                    <span className="font-bold text-lg text-primary">${item.item_price.toFixed(2)}</span>
                                </div>
                                <p className="text-gray-500 text-sm line-clamp-2 h-10 mb-4">{item.item_description || 'No description available.'}</p>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
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
