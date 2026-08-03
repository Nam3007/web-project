import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Minus, Plus, Trash2, ArrowRight, UtensilsCrossed, Truck, MapPin, QrCode, Banknote } from 'lucide-react';

const SELECTED_TABLE_STORAGE_KEY = 'selectedTable';

function readStoredSelectedTable() {
    const saved = localStorage.getItem(SELECTED_TABLE_STORAGE_KEY);

    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
}

export default function CustomerCartPage() {
    const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedTable, setSelectedTable] = useState('');
    const [orderType, setOrderType] = useState('dine_in');
    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('QR');
    const [selectedCouponCode, setSelectedCouponCode] = useState('');

    // Fetch user coupons
    const { data: coupons = [] } = useQuery({
        queryKey: ['myCoupons', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const res = await api.get(`/coupons/customer/${user.id}`);
            return res.data;
        },
        enabled: !!user?.id
    });

    // Fetch Tables
    const { data: tables = [], isLoading: tablesLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const res = await api.get('/tables/');
            return res.data;
        }
    });

    const orderedTables = [...tables].sort((a, b) => {
        const leftNumber = Number(a.table_number);
        const rightNumber = Number(b.table_number);

        if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
            return String(a.table_number).localeCompare(String(b.table_number));
        }

        return leftNumber - rightNumber;
    });

    const updateSelectedTable = async (nextTableId) => {
        const storedTable = readStoredSelectedTable();
        const previousTableId = storedTable?.id;

        if (!nextTableId) {
            if (previousTableId) {
                await api.patch(`/tables/status/${previousTableId}/`, { is_occupied: false });
                localStorage.removeItem(SELECTED_TABLE_STORAGE_KEY);
            }

            setSelectedTable('');
            return;
        }

        if (previousTableId === nextTableId) {
            setSelectedTable(nextTableId.toString());
            return;
        }

        try {
            if (previousTableId) {
                await api.patch(`/tables/status/${previousTableId}/`, { is_occupied: false });
            }

            await api.patch(`/tables/status/${nextTableId}/`, { is_occupied: true });

            const nextSelectedTable = {
                id: nextTableId,
                table_number: tables.find(table => table.id === nextTableId)?.table_number,
                table_size: tables.find(table => table.id === nextTableId)?.table_size,
                is_occupied: true,
            };

            localStorage.setItem(SELECTED_TABLE_STORAGE_KEY, JSON.stringify(nextSelectedTable));
            setSelectedTable(nextTableId.toString());
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        } catch (error) {
            if (previousTableId) {
                try {
                    await api.patch(`/tables/status/${previousTableId}/`, { is_occupied: true });
                } catch {
                    // Ignore rollback errors; surface the original failure below.
                }
            }

            alert(error.response?.data?.detail || 'Failed to update table status.');
        }
    };

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
    useEffect(() => {
        if (activeOrder && activeOrder.table_id && selectedTable !== activeOrder.table_id.toString()) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedTable(activeOrder.table_id.toString());
        }
    }, [activeOrder, selectedTable]);

    // Pre-fill table from localStorage (set by CustomerTablePage)
    useEffect(() => {
        const saved = localStorage.getItem('selectedTable');
        if (saved && !activeOrder) {
            try {
                const parsed = JSON.parse(saved);
                setSelectedTable(parsed.id.toString());
            } catch (_) { /* ignore malformed data */ }
        }
    // Only run once on mount — activeOrder may not be loaded yet, handled by the effect above
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Force QR when shipping is selected
    useEffect(() => {
        if (orderType === 'shipping') {
            setPaymentMethod('QR');
        }
    }, [orderType]);

    const placeOrderMutation = useMutation({
        mutationFn: async () => {
            let orderId = activeOrder?.id;

            // 1. If NO active order, create one
            if (!orderId) {
                if (orderType === 'dine_in' && !selectedTable) throw new Error('Please select a table.');
                if (orderType === 'shipping' && !shippingAddress.trim()) throw new Error('Please enter a shipping address.');

                const orderPayload = {
                    customer_id: user.id,
                    staff_id: null,
                    notes: orderType === 'shipping' ? 'Customer online shipping order' : 'Customer mobile order',
                    order_type: orderType,
                };

                if (orderType === 'dine_in') {
                    orderPayload.table_id = parseInt(selectedTable);
                } else {
                    orderPayload.shipping_address = shippingAddress.trim();
                }

                const orderRes = await api.post('/orders/', orderPayload);
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

            // 2.5 Apply coupon if selected
            if (selectedCouponCode) {
                await api.patch(`/orders/${orderId}/apply-coupon`, {
                    coupon_code: selectedCouponCode
                });
            }

            // 3. Create payment record
            const paymentRes = await api.post('/payments/', {
                order_id: orderId,
                payment_method: paymentMethod
            });

            // 4. Update order with payment method
            await api.put(`/orders/${orderId}`, {
                payment_method: paymentMethod
            });

            return { orderId, paymentId: paymentRes.data.id, amount: paymentRes.data.amount_paid };
        },
        onSuccess: (data) => {
            clearCart();
            localStorage.removeItem('selectedTable'); // clear pre-selected table after order
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            queryClient.invalidateQueries({ queryKey: ['myActiveOrder'] });
            if (paymentMethod === 'QR') {
                // Redirect to QR payment page
                navigate(`/qr-payment?orderId=${data.orderId}&amount=${data.amount}&paymentId=${data.paymentId}`);
            } else {
                // Cash: redirect to orders page, waiter will confirm
                alert('Order placed! Please wait for the waiter to confirm your cash payment.');
                navigate('/orders');
            }
        },
        onError: (err) => {
            alert('Failed to place order: ' + err.message);
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
        <div className="customer-page customer-page-regular">
            <h1 className="customer-page-title">Your Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items List (Left) */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((cartItem) => (
                        <div key={cartItem.item.id} className="customer-card flex gap-4 p-4">
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
                                        {(cartItem.item.item_price * cartItem.quantity).toLocaleString('vi-VN')}₫ 
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Column: Table Selection + Summary */}
                <div className="flex flex-col gap-6 h-fit">

                    {/* Dining Details */}
                    <div className="customer-card p-6 transition-all hover:shadow-md">
                        <div className="flex items-center gap-2 mb-4 text-gray-800">
                            <UtensilsCrossed className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-bold">Dining Details</h2>
                        </div>

                        {/* Order Type Toggle */}
                        {!activeOrder && (
                            <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-4">
                                <button
                                    onClick={() => setOrderType('dine_in')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                        orderType === 'dine_in'
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <UtensilsCrossed className="w-4 h-4" />
                                    Dine-in
                                </button>
                                <button
                                    onClick={() => setOrderType('shipping')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                        orderType === 'shipping'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Truck className="w-4 h-4" />
                                    Shipping
                                </button>
                            </div>
                        )}

                        {activeOrder ? (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                                <p className="font-bold mb-1">Active Order #{activeOrder.id}</p>
                                <p>You are seated at <span className="font-bold">Table {activeOrder.table_id}</span>.</p>
                                <p className="mt-2 text-xs opacity-75">Items will be added to this order.</p>
                            </div>
                        ) : orderType === 'dine_in' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Table</label>
                                {tablesLoading ? (
                                    <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                                ) : (
                                    <select
                                        value={selectedTable}
                                        onChange={(e) => updateSelectedTable(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                                    >
                                        <option value="">-- Choose a Table --</option>
                                        {orderedTables.map(t => (
                                            <option key={t.id} value={t.id} disabled={t.is_occupied}>
                                                Table {t.table_number} ({t.table_size} seats) {t.is_occupied ? '- Occupied' : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-xs text-gray-400 mt-2">Only available tables are shown.</p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                    Delivery Address
                                </label>
                                <textarea
                                    value={shippingAddress}
                                    onChange={(e) => setShippingAddress(e.target.value)}
                                    placeholder="Enter your full delivery address..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-2">We'll deliver to this address.</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Method Selection */}
                    <div className="customer-card p-6 transition-all hover:shadow-md">
                        <div className="flex items-center gap-2 mb-4 text-gray-800">
                            <Banknote className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-bold">Payment Method</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* QR Payment Option */}
                            <button
                                onClick={() => setPaymentMethod('QR')}
                                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                    paymentMethod === 'QR'
                                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {paymentMethod === 'QR' && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                                <div className={`p-3 rounded-xl ${paymentMethod === 'QR' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                    <QrCode className={`w-7 h-7 ${paymentMethod === 'QR' ? 'text-blue-600' : 'text-gray-500'}`} />
                                </div>
                                <span className={`text-sm font-bold ${paymentMethod === 'QR' ? 'text-blue-700' : 'text-gray-600'}`}>
                                    QR Transfer
                                </span>
                                <span className="text-[10px] text-gray-400">Instant payment</span>
                            </button>

                            {/* Cash Option — disabled for shipping */}
                            <button
                                onClick={() => orderType !== 'shipping' && setPaymentMethod('cash')}
                                disabled={orderType === 'shipping'}
                                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                    orderType === 'shipping'
                                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                        : paymentMethod === 'cash'
                                            ? 'border-green-500 bg-green-50 shadow-md shadow-green-100'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {paymentMethod === 'cash' && orderType !== 'shipping' && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                                <div className={`p-3 rounded-xl ${paymentMethod === 'cash' && orderType !== 'shipping' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    <Banknote className={`w-7 h-7 ${paymentMethod === 'cash' && orderType !== 'shipping' ? 'text-green-600' : 'text-gray-500'}`} />
                                </div>
                                <span className={`text-sm font-bold ${paymentMethod === 'cash' && orderType !== 'shipping' ? 'text-green-700' : 'text-gray-600'}`}>
                                    Cash
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {orderType === 'shipping' ? 'Not available' : 'Pay at counter'}
                                </span>
                            </button>
                        </div>

                        {orderType === 'shipping' && (
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-3 text-center">
                                Shipping orders require QR payment
                            </p>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="customer-card p-6 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>

                        {coupons.length > 0 && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Available Coupons
                                </label>
                                <select 
                                    value={selectedCouponCode}
                                    onChange={(e) => setSelectedCouponCode(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50"
                                >
                                    <option value="">-- Select a Coupon --</option>
                                    {coupons.map(coupon => (
                                        <option key={coupon.id} value={coupon.code}>
                                            {coupon.discount_percentage}% OFF (Code: {coupon.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-3 pb-6 border-b border-gray-100">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{cartTotal.toLocaleString('vi-VN')}₫ </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax (8%)</span>
                                <span>{(cartTotal * 0.08).toLocaleString('vi-VN')}₫ </span>
                            </div>
                            {selectedCouponCode && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Discount ({coupons.find(c => c.code === selectedCouponCode)?.discount_percentage}%)</span>
                                    <span>-{(cartTotal * (coupons.find(c => c.code === selectedCouponCode)?.discount_percentage / 100)).toLocaleString('vi-VN')}₫</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                                <span>Total</span>
                                <span>
                                    {(() => {
                                        const tax = cartTotal * 0.08;
                                        const discountPercent = selectedCouponCode ? coupons.find(c => c.code === selectedCouponCode)?.discount_percentage : 0;
                                        const discount = cartTotal * (discountPercent / 100);
                                        return (cartTotal + tax - discount).toLocaleString('vi-VN');
                                    })()}₫
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => placeOrderMutation.mutate()}
                            disabled={placeOrderMutation.isPending || (!activeOrder && orderType === 'dine_in' && !selectedTable) || (!activeOrder && orderType === 'shipping' && !shippingAddress.trim())}
                            className={`w-full py-4 text-white rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                paymentMethod === 'QR'
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                                    : 'bg-green-600 hover:bg-green-700 shadow-green-600/30'
                            }`}
                        >
                            {placeOrderMutation.isPending ? 'Processing...' : (
                                <>
                                    {activeOrder ? 'Add to Order' : paymentMethod === 'QR' ? 'Pay with QR' : 'Place Order (Cash)'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                        <p className="text-xs text-center text-gray-400">
                            {paymentMethod === 'QR'
                                ? "You'll be redirected to scan the QR code."
                                : "Waiter will confirm your cash payment."
                            }
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
