import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Minus, Plus, Trash2, ArrowRight, UtensilsCrossed } from 'lucide-react';

export default function CustomerCartPage() {
    const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedTable, setSelectedTable] = useState('');

    // Fetch Tables
    const { data: tables = [], isLoading: tablesLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const res = await api.get('/tables/');
            return res.data;
        }
    });

    // Fetch Active Orders to see if we should append
    const { data: activeOrder } = useQuery({
        queryKey: ['myActiveOrder'],
        queryFn: async () => {
            // In a real app, endpoint should be /orders/active/me
            // Here we fetch all and filter client side for demo
            const res = await api.get('/orders/');
            const myOrders = res.data.filter(o => o.customer_id === user.id);
            // Find most recent active order
            const active = myOrders
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .find(o => o.status !== 'paid' && o.status !== 'cancelled' && o.status !== 'completed');
            return active || null;
        }
    });

    // Auto-select table if active order exists
    // We can do this by deriving state or initializing differently, but effect is okay if guarded or we use default state.
    // To avoid set-state-in-effect error, we can just use the activeOrder directly in render or use a simpler check.
    useEffect(() => {
        if (activeOrder && activeOrder.table_id && selectedTable !== activeOrder.table_id.toString()) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedTable(activeOrder.table_id.toString());
        }
    }, [activeOrder, selectedTable]);

    const placeOrderMutation = useMutation({
        mutationFn: async () => {
            let orderId = activeOrder?.id;

            // 1. If NO active order, create one
            if (!orderId) {
                if (!selectedTable) throw new Error("Please select a table.");

                const orderRes = await api.post('/orders/', {
                    customer_id: user.id,
                    table_id: parseInt(selectedTable),
                    staff_id: null,
                    notes: 'Customer mobile order'
                });
                orderId = orderRes.data.id;
            }

            // 2. Add Items
            for (const cartItem of cart) {
                await api.post('/order-items/', {
                    order_id: orderId,
                    menu_item_id: cartItem.item.id,
                    quantity: cartItem.quantity,
                    notes: cartItem.notes || ''
                });
            }
            return orderId;
        },
        onSuccess: () => {
            clearCart();
            alert(activeOrder ? "Items added to your existing order!" : "Order placed successfully! Please wait for your food.");
            navigate('/orders');
        },
        onError: (err) => {
            alert("Failed to place order: " + err.message);
        }
    });

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
                    <Trash2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8">Looks like you haven't added any delicious items yet.</p>
                <button
                    onClick={() => navigate('/menu')}
                    className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
                >
                    Browse Menu
                </button>
            </div>
        )
    }



    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items List (Left) */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((cartItem) => (
                        <div key={cartItem.item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                                {cartItem.item.item_image && (
                                    <img src={cartItem.item.item_image} className="w-full h-full object-cover" />
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{cartItem.item.item_name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-1">{cartItem.item.item_description}</p>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(cartItem.item.id)}
                                        className="text-gray-300 hover:text-red-500"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateQuantity(cartItem.item.id, -1)}
                                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-bold w-4 text-center">{cartItem.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(cartItem.item.id, 1)}
                                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="font-bold text-lg text-primary">
                                        ${(cartItem.item.item_price * cartItem.quantity).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Column: Table Selection + Summary */}
                <div className="flex flex-col gap-6 h-fit">

                    {/* Table Selection */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-2 mb-4 text-gray-800">
                            <UtensilsCrossed className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-bold">Dining Details</h2>
                        </div>

                        {activeOrder ? (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                                <p className="font-bold mb-1">Active Order #{activeOrder.id}</p>
                                <p>You are seated at <span className="font-bold">Table {activeOrder.table_id}</span>.</p>
                                <p className="mt-2 text-xs opacity-75">Items will be added to this order.</p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Table</label>
                                {tablesLoading ? (
                                    <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                                ) : (
                                    <select
                                        value={selectedTable}
                                        onChange={(e) => setSelectedTable(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                                    >
                                        <option value="">-- Choose a Table --</option>
                                        {tables.map(t => (
                                            <option key={t.id} value={t.id} disabled={t.is_occupied}>
                                                Table {t.table_number} ({t.table_size} seats) {t.is_occupied ? '- Occupied' : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                    Only available tables are shown.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>

                        <div className="space-y-3 pb-6 border-b border-gray-100">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax (8%)</span>
                                <span>${(cartTotal * 0.08).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                                <span>Total</span>
                                <span>${(cartTotal * 1.08).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => placeOrderMutation.mutate()}
                            disabled={placeOrderMutation.isPending || (!selectedTable && !activeOrder)}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {placeOrderMutation.isPending ? 'Processing...' : (
                                <>
                                    {activeOrder ? 'Add to Order' : 'Place Order'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                        <p className="text-xs text-center text-gray-400">
                            {activeOrder ?
                                "Creating a new shipment for your table." :
                                "By placing this order you agree to our Terms."
                            }
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
