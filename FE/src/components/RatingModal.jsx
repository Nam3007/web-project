import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Star, X, Send, SkipForward, Loader2 } from 'lucide-react';

/**
 * Half-star interactive rating selector.
 * Click left half of star = whole number (e.g. 1.0)
 * Click right half = half increment (e.g. 1.5)
 */
function StarSelector({ value, onChange }) {
    const [hoverValue, setHoverValue] = useState(0);
    const displayValue = hoverValue || value;

    return (
        <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverValue(0)}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isFull = displayValue >= star;
                const isHalf = !isFull && displayValue >= star - 0.5;

                return (
                    <div key={star} className="relative w-8 h-8 cursor-pointer">
                        {/* Left half — whole number (star - 0.5 mapped to left click = star - 0.5... actually: left = X.0 if star=1 left=0.5... let me re-read the spec) */}
                        {/* Spec: left-to-right, click left half = X.0, right half = X.5 */}
                        {/* Actually for star N: left half click = N-0.5, right half click = N */}
                        {/* Wait, re-reading: "from left to right, 1-5 with increment 0.5" and "select stars (from left to right)" */}
                        {/* Standard half-star: left half = N-0.5, right half = N */}

                        {/* Left half: sets value to star - 0.5 */}
                        <div
                            className="absolute inset-y-0 left-0 w-1/2 z-10"
                            onMouseEnter={() => setHoverValue(star - 0.5)}
                            onClick={() => onChange(star - 0.5)}
                        />
                        {/* Right half: sets value to star */}
                        <div
                            className="absolute inset-y-0 right-0 w-1/2 z-10"
                            onMouseEnter={() => setHoverValue(star)}
                            onClick={() => onChange(star)}
                        />

                        {/* Star visual */}
                        <div className="relative w-8 h-8">
                            {/* Empty star background */}
                            <Star className="w-8 h-8 text-gray-200 absolute inset-0" />

                            {/* Filled portion */}
                            {(isFull || isHalf) && (
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: isFull ? '100%' : '50%' }}
                                >
                                    <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <span className="ml-2 text-sm font-bold text-gray-600 min-w-[2rem]">
                {displayValue > 0 ? displayValue.toFixed(1) : '—'}
            </span>
        </div>
    );
}

/**
 * Compact star display (read-only) for showing average ratings.
 */
export function StarDisplay({ rating, size = 'sm', showValue = true, count = null }) {
    const numRating = Number(rating) || 0;
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
    const textClass = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

    if (numRating === 0) return null;

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
                const isFull = numRating >= star;
                const isHalf = !isFull && numRating >= star - 0.5;

                return (
                    <div key={star} className={`relative ${sizeClass}`}>
                        <Star className={`${sizeClass} text-gray-200`} />
                        {(isFull || isHalf) && (
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: isFull ? '100%' : '50%' }}
                            >
                                <Star className={`${sizeClass} text-amber-400 fill-amber-400`} />
                            </div>
                        )}
                    </div>
                );
            })}
            {showValue && (
                <span className={`${textClass} font-bold text-gray-600 ml-0.5`}>
                    {numRating.toFixed(1)}
                </span>
            )}
            {count !== null && count > 0 && (
                <span className={`${textClass} text-gray-400 ml-0.5`}>
                    ({count})
                </span>
            )}
        </div>
    );
}


/**
 * RatingModal — shown after order completion.
 * Displays all distinct menu items from the order and lets the customer
 * rate each one with 0.5-increment stars and an optional text review.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - orderId: number
 * - customerId: number | string
 * - orderItems: Array<{ menu_item_id, item_name, item_image? }>
 *   (distinct items from the order — quantity irrelevant)
 */
export default function RatingModal({ isOpen, onClose, orderId, customerId, orderItems = [] }) {
    const queryClient = useQueryClient();

    // State: { [menu_item_id]: { rating: number, review_text: string } }
    const [ratings, setRatings] = useState(() => {
        const initial = {};
        orderItems.forEach((item) => {
            initial[item.menu_item_id] = { rating: 0, review_text: '' };
        });
        return initial;
    });

    const submitMutation = useMutation({
        mutationFn: async (payload) => {
            return api.post('/item-ratings/bulk', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            queryClient.invalidateQueries(['myOrders']);
            queryClient.invalidateQueries(['myShippingOrders']);
            // Mark this order as rated in localStorage
            localStorage.setItem(`rated_order_${orderId}`, 'true');
            onClose();
        },
        onError: (err) => {
            alert('Failed to submit ratings: ' + (err.response?.data?.detail || err.message));
        },
    });

    const handleSetRating = (menuItemId, value) => {
        setRatings((prev) => ({
            ...prev,
            [menuItemId]: { ...prev[menuItemId], rating: value },
        }));
    };

    const handleSetReview = (menuItemId, text) => {
        setRatings((prev) => ({
            ...prev,
            [menuItemId]: { ...prev[menuItemId], review_text: text },
        }));
    };

    const handleSubmit = () => {
        // Filter out items with no rating selected
        const ratingsList = Object.entries(ratings)
            .filter(([, val]) => val.rating > 0)
            .map(([menuItemId, val]) => ({
                menu_item_id: parseInt(menuItemId),
                rating: val.rating,
                review_text: val.review_text || null,
            }));

        if (ratingsList.length === 0) {
            alert('Please rate at least one item.');
            return;
        }

        submitMutation.mutate({
            order_id: orderId,
            customer_id: parseInt(customerId),
            ratings: ratingsList,
        });
    };

    const handleSkip = () => {
        localStorage.setItem(`skipped_rating_${orderId}`, Date.now().toString());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            Rate Your Experience
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Order #{orderId} — How was everything?
                        </p>
                    </div>
                    <button
                        onClick={handleSkip}
                        className="p-2 hover:bg-white/80 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    {orderItems.map((item) => (
                        <div
                            key={item.menu_item_id}
                            className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100"
                        >
                            {/* Item header */}
                            <div className="flex items-center gap-3">
                                {item.item_image ? (
                                    <img
                                        src={item.item_image}
                                        alt={item.item_name}
                                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <Star className="w-5 h-5 text-gray-400" />
                                    </div>
                                )}
                                <h4 className="font-bold text-gray-800">{item.item_name}</h4>
                            </div>

                            {/* Star selector */}
                            <StarSelector
                                value={ratings[item.menu_item_id]?.rating || 0}
                                onChange={(val) => handleSetRating(item.menu_item_id, val)}
                            />

                            {/* Review text */}
                            <textarea
                                value={ratings[item.menu_item_id]?.review_text || ''}
                                onChange={(e) => handleSetReview(item.menu_item_id, e.target.value)}
                                placeholder="Write a review (optional)..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 bg-white"
                            />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                    <button
                        onClick={handleSkip}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors"
                    >
                        <SkipForward className="w-4 h-4" />
                        Skip
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition-all disabled:opacity-60 text-sm"
                    >
                        {submitMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Submit Ratings
                    </button>
                </div>
            </div>
        </div>
    );
}
