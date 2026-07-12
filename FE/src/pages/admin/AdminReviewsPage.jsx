import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { StarDisplay } from '../../components/RatingModal';
import {
    Search,
    Star,
    MessageSquare,
    Utensils,
    ChevronDown,
    Calendar,
    Filter,
    BarChart3,
    Loader2,
} from 'lucide-react';

export default function AdminReviewsPage() {
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    const CATEGORIES = ['food', 'drink', 'appetizer', 'dessert'];

    // Fetch all menu items
    const { data: menuItems = [], isLoading: menuLoading } = useQuery({
        queryKey: ['menuItems'],
        queryFn: async () => {
            const res = await api.get('/menu-items/');
            return res.data;
        },
    });

    // Fetch reviews for selected item
    const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
        queryKey: ['itemReviews', selectedItemId],
        queryFn: async () => {
            const res = await api.get(`/item-ratings/menu-item/${selectedItemId}`);
            return res.data;
        },
        enabled: !!selectedItemId,
    });

    // Fetch summary for selected item
    const { data: summary = null } = useQuery({
        queryKey: ['itemSummary', selectedItemId],
        queryFn: async () => {
            const res = await api.get(`/item-ratings/summary/${selectedItemId}`);
            return res.data;
        },
        enabled: !!selectedItemId,
    });

    const selectedItem = menuItems.find((item) => item.id === selectedItemId);

    // Filter menu items
    const filteredItems = menuItems.filter((item) => {
        const matchesType = filterType === 'ALL' || item.item_type === filterType;
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    // Rating distribution (for selected item)
    const getRatingDistribution = () => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach((r) => {
            const bucket = Math.ceil(r.rating);
            dist[bucket] = (dist[bucket] || 0) + 1;
        });
        return dist;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Reviews & Ratings</h1>
                <p className="text-gray-500 text-sm">Select a menu item to view customer reviews</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Item selector */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Search & Filter */}
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none bg-white cursor-pointer capitalize"
                            >
                                <option value="ALL">All Categories</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Items list */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-h-[60vh] overflow-y-auto">
                        {menuLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">
                                No items found
                            </div>
                        ) : (
                            filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedItemId(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-gray-50 last:border-b-0 ${
                                        selectedItemId === item.id
                                            ? 'bg-primary/5 border-l-4 border-l-primary'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    {item.item_image ? (
                                        <img
                                            src={item.item_image}
                                            alt={item.item_name}
                                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                            <Utensils className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm truncate">
                                            {item.item_name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 capitalize">{item.item_type}</span>
                                            {item.average_rating && (
                                                <span className="flex items-center gap-0.5 text-xs text-amber-600 font-bold">
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    {Number(item.average_rating).toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Review details */}
                <div className="lg:col-span-2 space-y-6">
                    {!selectedItemId ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-24">
                            <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
                            <h2 className="text-xl font-bold text-gray-400 mb-1">Select an Item</h2>
                            <p className="text-gray-400 text-sm">
                                Choose a menu item to view its reviews and ratings
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Item summary card */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 flex items-center gap-4">
                                    {selectedItem?.item_image ? (
                                        <img
                                            src={selectedItem.item_image}
                                            alt={selectedItem.item_name}
                                            className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-md">
                                            <Utensils className="w-7 h-7 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {selectedItem?.item_name}
                                        </h2>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {selectedItem?.item_type}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 justify-end mb-1">
                                            <StarDisplay
                                                rating={summary?.average_rating}
                                                size="md"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {summary?.total_ratings || 0} review{(summary?.total_ratings || 0) !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Rating distribution */}
                                {summary && summary.total_ratings > 0 && (
                                    <div className="px-6 py-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <BarChart3 className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-semibold text-gray-600">
                                                Rating Distribution
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {[5, 4, 3, 2, 1].map((star) => {
                                                const dist = getRatingDistribution();
                                                const count = dist[star] || 0;
                                                const pct =
                                                    summary.total_ratings > 0
                                                        ? (count / summary.total_ratings) * 100
                                                        : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-3">
                                                            {star}
                                                        </span>
                                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-400 font-medium w-6 text-right">
                                                            {count}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reviews list */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-gray-400" />
                                    Customer Reviews
                                </h3>

                                {reviewsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-12">
                                        <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                        <p className="text-gray-400 text-sm">
                                            No reviews yet for this item
                                        </p>
                                    </div>
                                ) : (
                                    reviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-primary">
                                                            C{review.customer_id}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            Customer #{review.customer_id}
                                                        </p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(review.created_at).toLocaleDateString()}{' '}
                                                            {new Date(review.created_at).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <StarDisplay rating={review.rating} size="sm" />
                                            </div>

                                            {review.review_text && (
                                                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3 mt-3 leading-relaxed">
                                                    "{review.review_text}"
                                                </p>
                                            )}

                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                                                    Order #{review.order_id}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
