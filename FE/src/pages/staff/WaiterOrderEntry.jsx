import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
    Search,
    ShoppingCart,
    Minus,
    Plus,
    CreditCard,
    User,
    Utensils,
    Trash2
} from 'lucide-react';

const CATEGORIES = ['food', 'drink', 'appetizer', 'dessert'];

export default function WaiterOrderEntry() {
    const [searchParams] = useSearchParams();
    const tableId = searchParams.get('tableId');
    const tableNum = searchParams.get('tableNum');
    const existingOrderId = searchParams.get('orderId'); // Optional: if present, we are adding to this order

    const navigate = useNavigate();
    const { user } = useAuth();

    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]); // { item, quantity, notes }
    const [customerId, setCustomerId] = useState('');

    // Fetch Menu
    const { data: menuItems = [] } = useQuery({
        queryKey: ['menuItems'],
        queryFn: async () => {
            const res = await api.get('/menu-items/');
            return res.data;
        }
    });

    // Fetch Customers
    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await api.get('/customers/');
            return res.data;
        }
    });

    // If existing order, fetch it to pre-fill customer
    useQuery({
        queryKey: ['existingOrder', existingOrderId],
        queryFn: async () => {
            if (!existingOrderId) return null;
            const res = await api.get(`/orders/${existingOrderId}`);
            setCustomerId(res.data.customer_id);
            return res.data;
        },
        enabled: !!existingOrderId
    });

    // Create Order Mutation (New or Update)
    const placeOrderMutation = useMutation({
        mutationFn: async (orderData) => {
            let workingOrderId = existingOrderId;

            // 1. If NO existing order, create one (POST /orders/)
            if (!workingOrderId) {
                const orderRes = await api.post('/orders/', {
                    customer_id: orderData.customer_id,
                    table_id: parseInt(tableId),
                    staff_id: user.id,
                    notes: 'Created by waiter'
                });
                workingOrderId = orderRes.data.id;
            }

            // 2. Add New Items (POST /order-items/)
            // We iterate and post each item. 
            for (const cartItem of orderData.items) {
                await api.post('/order-items/', {
                    order_id: workingOrderId,
                    menu_item_id: cartItem.item.id,
                    quantity: cartItem.quantity,
                    notes: cartItem.notes || ''
                });
            }

            return workingOrderId;
        },
        onSuccess: () => {
            alert(existingOrderId ? 'Items added to order!' : 'Order placed successfully!');
            navigate('/staff/orders'); // Go to active orders list
        },
        onError: (err) => {
            alert('Failed to place order: ' + (err.response?.data?.detail || err.message));
        }
    });

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.item.id === item.id);
            if (existing) {
                return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { item, quantity: 1, notes: '' }];
        });
    };

    const updateQuantity = (itemId, delta) => {
        setCart(prev => prev.map(i => {
            if (i.item.id === itemId) return { ...i, quantity: Math.max(1, i.quantity + delta) };
            return i;
        }));
    };

    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(i => i.item.id !== itemId));
    };

    const handlePlaceOrder = () => {
        if (!customerId) {
            alert("Please select a customer.");
            return;
        }
        if (cart.length === 0) {
            alert("Cart is empty.");
            return;
        }

        placeOrderMutation.mutate({
            customer_id: parseInt(customerId),
            items: cart
        });
    };

    const filteredMenu = menuItems.filter(item => {
        const matchesType = selectedCategory === 'ALL' || item.item_type === selectedCategory;
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const cartTotal = cart.reduce((sum, i) => sum + (i.item.item_price * i.quantity), 0);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
            {/* Menu Selection (Left) */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">
                                {existingOrderId ? `Add Items: Order #${existingOrderId}` : `New Order: Table ${tableNum}`}
                            </h1>
                            <p className="text-sm text-gray-500">Select items to add</p>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            />
                        </div>
                    </div>
                    {/* ... (Categories - Same as before) ... */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setSelectedCategory('ALL')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'ALL' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All Items
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredMenu.map(item => (
                            <div
                                key={item.id}
                                onClick={() => addToCart(item)}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group active:scale-95"
                            >
                                <div className="h-32 bg-gray-50 relative">
                                    {item.item_image ? (
                                        <img src={item.item_image} alt={item.item_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-300">
                                            <Utensils className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Plus className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.item_name}</h3>
                                    <p className="text-primary font-bold mt-1">${item.item_price.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart (Right) */}
            <div className="w-full lg:w-96 bg-white rounded-xl border border-gray-200 shadow-xl flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        {existingOrderId ? 'Additional Items' : 'Current Order'}
                    </h2>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Customer</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={customerId}
                            disabled={!!existingOrderId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="">Select Customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.full_name} ({c.username})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 flex flex-col items-center gap-2">
                            <ShoppingCart className="w-10 h-10 opacity-20" />
                            <p>Select items to add</p>
                        </div>
                    ) : (
                        cart.map((cartItem) => (
                            <div key={cartItem.item.id} className="flex gap-3">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-medium text-gray-900 text-sm">{cartItem.item.item_name}</h4>
                                        <span className="font-semibold text-gray-900 text-sm">
                                            ${(cartItem.item.item_price * cartItem.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">${cartItem.item.item_price}/ea</p>

                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                            <button
                                                onClick={() => updateQuantity(cartItem.item.id, -1)}
                                                className="p-1 hover:bg-white rounded shadow-sm text-gray-600"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-bold w-6 text-center">{cartItem.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(cartItem.item.id, 1)}
                                                className="p-1 hover:bg-white rounded shadow-sm text-gray-600"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <button onClick={() => removeFromCart(cartItem.item.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                        <span>Total (New)</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={placeOrderMutation.isPending || cart.length === 0}
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {placeOrderMutation.isPending ? 'Processing...' : (
                            <>
                                {existingOrderId ? 'Add Items to Order' : 'Place Order'}
                                <CreditCard className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
