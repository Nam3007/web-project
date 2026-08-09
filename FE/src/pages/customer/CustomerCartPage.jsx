import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Minus, Plus, Trash2, ArrowRight, UtensilsCrossed, Truck, MapPin, QrCode, Banknote, ShoppingBag, Tag } from 'lucide-react';
import { WarmPageWrapper, SectionHeading, WarmCard, GoldButton, FlourishOrnament, WarmEmptyState } from '../../components/RestaurantDecorations';

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
            <WarmPageWrapper>
                <WarmEmptyState
                    icon={ShoppingBag}
                    title="Your cart is empty"
                    subtitle="Looks like you haven't added any delicious items yet."
                    action={
                        <GoldButton onClick={() => navigate('/menu')} className="px-8 py-3 text-sm">
                            Browse Menu
                            <ArrowRight className="w-4 h-4" />
                        </GoldButton>
                    }
                />
            </WarmPageWrapper>
        );
    }

    return (
        <WarmPageWrapper pattern="dots">
            <div className="max-w-5xl mx-auto">
                {/* Page Header */}
                <SectionHeading
                    title="Your Cart"
                    subtitle={`${cart.length} item${cart.length > 1 ? 's' : ''} ready to order`}
                    className="mb-8"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Items List (Left) ────────────────────────── */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map((cartItem, idx) => (
                            <div
                                key={cartItem.item.id}
                                className="flex gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-r-border/40 shadow-sm hover:shadow-md hover:border-r-gold/20 transition-all duration-300 animate-fade-in"
                                style={{ animationDelay: `${idx * 80}ms` }}
                            >
                                <div className="w-24 h-24 bg-r-cream rounded-xl overflow-hidden shrink-0 border border-r-border/30">
                                    {cartItem.item.item_image && (
                                        <img src={cartItem.item.item_image} alt={cartItem.item.item_name} className="w-full h-full object-cover" />
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-serif font-bold text-r-text truncate">{cartItem.item.item_name}</h3>
                                            <p className="text-sm text-r-muted line-clamp-1 font-sans">{cartItem.item.item_description}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(cartItem.item.id)}
                                            className="text-r-muted/40 hover:text-red-500 transition-colors p-1 shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-end mt-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(cartItem.item.id, -1)}
                                                className="w-8 h-8 rounded-full border border-r-border flex items-center justify-center text-r-text hover:bg-r-cream hover:border-r-gold/30 transition-colors"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="font-bold w-5 text-center text-r-text font-sans tabular-nums">{cartItem.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(cartItem.item.id, 1)}
                                                className="w-8 h-8 rounded-full border border-r-border flex items-center justify-center text-r-text hover:bg-r-cream hover:border-r-gold/30 transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <span className="font-bold text-lg text-r-gold font-sans tabular-nums">
                                            {(cartItem.item.item_price * cartItem.quantity).toLocaleString('vi-VN')}₫
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Right Column: Details + Summary ──────────── */}
                    <div className="flex flex-col gap-6 h-fit">

                        {/* Dining Details */}
                        <WarmCard>
                            <div className="flex items-center gap-2 mb-4">
                                <UtensilsCrossed className="w-5 h-5 text-r-gold" />
                                <h2 className="text-lg font-serif font-bold text-r-text">Dining Details</h2>
                            </div>

                            {/* Order Type Toggle */}
                            {!activeOrder && (
                                <div className="flex bg-r-cream rounded-xl p-1 gap-1 mb-4 border border-r-border/40">
                                    <button
                                        onClick={() => setOrderType('dine_in')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all font-sans ${
                                            orderType === 'dine_in'
                                                ? 'bg-white text-r-gold shadow-sm border border-r-gold/20'
                                                : 'text-r-muted hover:text-r-text'
                                        }`}
                                    >
                                        <UtensilsCrossed className="w-4 h-4" />
                                        Dine-in
                                    </button>
                                    <button
                                        onClick={() => setOrderType('shipping')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all font-sans ${
                                            orderType === 'shipping'
                                                ? 'bg-white text-r-gold shadow-sm border border-r-gold/20'
                                                : 'text-r-muted hover:text-r-text'
                                        }`}
                                    >
                                        <Truck className="w-4 h-4" />
                                        Delivery
                                    </button>
                                </div>
                            )}

                            {activeOrder ? (
                                <div className="bg-r-gold/10 border border-r-gold/20 rounded-xl p-4 text-sm">
                                    <p className="font-bold mb-1 text-r-text font-sans">Active Order #{activeOrder.id}</p>
                                    <p className="text-r-muted font-sans">You are seated at <span className="font-bold text-r-gold">Table {activeOrder.table_id}</span>.</p>
                                    <p className="mt-2 text-xs text-r-muted/70 font-sans">Items will be added to this order.</p>
                                </div>
                            ) : orderType === 'dine_in' ? (
                                <div>
                                    <label className="block text-sm font-medium text-r-text mb-2 font-sans">Select Your Table</label>
                                    {tablesLoading ? (
                                        <div className="animate-pulse h-12 bg-r-cream rounded-xl" />
                                    ) : (
                                        <select
                                            value={selectedTable}
                                            onChange={(e) => updateSelectedTable(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-4 py-3 border border-r-border rounded-xl focus:outline-none focus:ring-2 focus:ring-r-gold/20 focus:border-r-gold bg-white appearance-none font-sans text-r-text"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238a7562' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                                        >
                                            <option value="">-- Choose a Table --</option>
                                            {orderedTables.map(t => (
                                                <option key={t.id} value={t.id} disabled={t.is_occupied}>
                                                    Table {t.table_number} ({t.table_size} seats) {t.is_occupied ? '- Occupied' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <p className="text-xs text-r-muted/60 mt-2 font-sans">Only available tables are shown.</p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-r-text mb-2 flex items-center gap-1.5 font-sans">
                                        <MapPin className="w-4 h-4 text-r-gold" />
                                        Delivery Address
                                    </label>
                                    <textarea
                                        value={shippingAddress}
                                        onChange={(e) => setShippingAddress(e.target.value)}
                                        placeholder="Enter your full delivery address..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-r-border rounded-xl focus:outline-none focus:ring-2 focus:ring-r-gold/20 focus:border-r-gold resize-none text-sm font-sans text-r-text bg-white placeholder:text-r-muted/50"
                                    />
                                    <p className="text-xs text-r-muted/60 mt-2 font-sans">We'll deliver to this address.</p>
                                </div>
                            )}
                        </WarmCard>

                        {/* Payment Method */}
                        <WarmCard>
                            <div className="flex items-center gap-2 mb-4">
                                <Banknote className="w-5 h-5 text-r-gold" />
                                <h2 className="text-lg font-serif font-bold text-r-text">Payment Method</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* QR */}
                                <button
                                    onClick={() => setPaymentMethod('QR')}
                                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-sans ${
                                        paymentMethod === 'QR'
                                            ? 'border-r-gold bg-r-gold/5 shadow-md shadow-r-gold/10'
                                            : 'border-r-border/50 bg-white hover:border-r-gold/30 hover:bg-r-cream/50'
                                    }`}
                                >
                                    {paymentMethod === 'QR' && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-r-gold rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className={`p-3 rounded-xl ${paymentMethod === 'QR' ? 'bg-r-gold/15' : 'bg-r-cream'}`}>
                                        <QrCode className={`w-7 h-7 ${paymentMethod === 'QR' ? 'text-r-gold' : 'text-r-muted'}`} />
                                    </div>
                                    <span className={`text-sm font-bold ${paymentMethod === 'QR' ? 'text-r-gold' : 'text-r-text'}`}>
                                        QR Transfer
                                    </span>
                                    <span className="text-[10px] text-r-muted">Instant payment</span>
                                </button>

                                {/* Cash */}
                                <button
                                    onClick={() => orderType !== 'shipping' && setPaymentMethod('cash')}
                                    disabled={orderType === 'shipping'}
                                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-sans ${
                                        orderType === 'shipping'
                                            ? 'border-r-border/30 bg-r-cream/30 opacity-50 cursor-not-allowed'
                                            : paymentMethod === 'cash'
                                                ? 'border-green-500 bg-green-50/50 shadow-md shadow-green-100/30'
                                                : 'border-r-border/50 bg-white hover:border-green-300/50 hover:bg-r-cream/50'
                                    }`}
                                >
                                    {paymentMethod === 'cash' && orderType !== 'shipping' && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className={`p-3 rounded-xl ${paymentMethod === 'cash' && orderType !== 'shipping' ? 'bg-green-100/60' : 'bg-r-cream'}`}>
                                        <Banknote className={`w-7 h-7 ${paymentMethod === 'cash' && orderType !== 'shipping' ? 'text-green-600' : 'text-r-muted'}`} />
                                    </div>
                                    <span className={`text-sm font-bold ${paymentMethod === 'cash' && orderType !== 'shipping' ? 'text-green-700' : 'text-r-text'}`}>
                                        Cash
                                    </span>
                                    <span className="text-[10px] text-r-muted">
                                        {orderType === 'shipping' ? 'Not available' : 'Pay at counter'}
                                    </span>
                                </button>
                            </div>

                            {orderType === 'shipping' && (
                                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg mt-3 text-center font-sans border border-amber-200/50">
                                    Delivery orders require QR payment
                                </p>
                            )}
                        </WarmCard>

                        {/* Order Summary */}
                        <WarmCard hover={false}>
                            <h2 className="text-lg font-serif font-bold text-r-text mb-4">Order Summary</h2>

                            {coupons.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-r-text font-sans">
                                        <Tag className="w-4 h-4 text-r-gold" />
                                        Available Coupons
                                    </label>
                                    <select
                                        value={selectedCouponCode}
                                        onChange={(e) => setSelectedCouponCode(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-r-border rounded-xl focus:outline-none focus:ring-2 focus:ring-r-gold/20 focus:border-r-gold text-sm bg-white font-sans text-r-text"
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

                            <div className="space-y-3 pb-5 border-b border-r-border/40">
                                <div className="flex justify-between text-r-muted font-sans text-sm">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">{cartTotal.toLocaleString('vi-VN')}₫</span>
                                </div>
                                <div className="flex justify-between text-r-muted font-sans text-sm">
                                    <span>Tax (8%)</span>
                                    <span className="tabular-nums">{(cartTotal * 0.08).toLocaleString('vi-VN')}₫</span>
                                </div>
                                {selectedCouponCode && (
                                    <div className="flex justify-between text-green-600 font-medium font-sans text-sm">
                                        <span>Discount ({coupons.find(c => c.code === selectedCouponCode)?.discount_percentage}%)</span>
                                        <span className="tabular-nums">-{(cartTotal * (coupons.find(c => c.code === selectedCouponCode)?.discount_percentage / 100)).toLocaleString('vi-VN')}₫</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center py-4 mb-2">
                                <span className="text-lg font-serif font-bold text-r-text">Total</span>
                                <span className="text-2xl font-bold text-r-gold font-sans tabular-nums">
                                    {(() => {
                                        const tax = cartTotal * 0.08;
                                        const discountPercent = selectedCouponCode ? coupons.find(c => c.code === selectedCouponCode)?.discount_percentage : 0;
                                        const discount = cartTotal * (discountPercent / 100);
                                        return (cartTotal + tax - discount).toLocaleString('vi-VN');
                                    })()}₫
                                </span>
                            </div>

                            <GoldButton
                                onClick={() => placeOrderMutation.mutate()}
                                disabled={placeOrderMutation.isPending || (!activeOrder && orderType === 'dine_in' && !selectedTable) || (!activeOrder && orderType === 'shipping' && !shippingAddress.trim())}
                                variant={paymentMethod === 'cash' ? 'dark' : 'solid'}
                                className="w-full py-4 text-base"
                            >
                                {placeOrderMutation.isPending ? 'Processing...' : (
                                    <>
                                        {activeOrder ? 'Add to Order' : paymentMethod === 'QR' ? 'Pay with QR' : 'Place Order (Cash)'}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </GoldButton>

                            <p className="text-xs text-center text-r-muted mt-3 font-sans">
                                {paymentMethod === 'QR'
                                    ? "You'll be redirected to scan the QR code."
                                    : "Waiter will confirm your cash payment."
                                }
                            </p>
                        </WarmCard>
                    </div>
                </div>
            </div>
        </WarmPageWrapper>
    );
}
