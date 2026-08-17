import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Minus, Plus, Trash2, ArrowRight, UtensilsCrossed, Truck, MapPin, QrCode, Banknote, CheckCircle2, AlertCircle } from 'lucide-react';

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
            try {
                const res = await api.get(`/orders/active/customer/${user.id}`);
                const myOrders = res.data || [];
                // Find most recent active order
                const active = myOrders
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .find(o => o.status !== 'paid' && o.status !== 'cancelled' && o.status !== 'completed');
                return active || null;
            } catch (err) {
                if (err.response?.status === 404) return null;
                throw err;
            }
        },
        enabled: !!user
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
        if (tablesLoading || activeOrder) return;
        const saved = localStorage.getItem('selectedTable');
        if (saved && !selectedTable) {
            try {
                const parsed = JSON.parse(saved);
                setSelectedTable(parsed.id.toString());
            } catch (_) { /* ignore malformed data */ }
        }
    }, [tablesLoading, activeOrder, selectedTable]);

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
            <div className="customer-page customer-page-regular pb-12 relative">
                <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-10 z-0"></div>
                
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/80 px-6 py-24 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl z-10 mt-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 opacity-50"></div>
                    
                    <div className="relative mx-auto flex flex-col items-center justify-center">
                        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 shadow-inner">
                            <Trash2 className="w-12 h-12 text-emerald-200" />
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700/75">Your Basket</p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 font-serif">Your cart is empty</h2>
                        <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">Looks like you haven't added any delicious items yet. Browse our curated menu to start building your meal.</p>
                        <button
                            onClick={() => navigate('/menu')}
                            className="mt-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-300"
                        >
                            Browse Menu
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="customer-page customer-page-wide pb-12 relative">
            <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-10 z-0"></div>
            
            <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Your Cart</h1>
                        <p className="text-sm text-slate-500 mt-1">Review your items and complete your order.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Items List (Left) - Takes 7 columns */}
                    <div className="lg:col-span-7 space-y-4">
                        {cart.map((cartItem) => (
                            <div key={cartItem.item.id} className="group flex gap-5 rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5">
                                <div className="w-28 h-28 shrink-0 overflow-hidden rounded-[1.25rem] bg-slate-100 relative">
                                    {cartItem.item.item_image ? (
                                        <img src={cartItem.item.item_image} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={cartItem.item.item_name} />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-300"><UtensilsCrossed className="w-8 h-8" /></div>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col justify-between py-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-emerald-700">{cartItem.item.item_name}</h3>
                                            <p className="mt-1 line-clamp-1 text-sm text-slate-500">{cartItem.item.item_description}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(cartItem.item.id)}
                                            className="rounded-full p-2 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                                            aria-label={`Remove ${cartItem.item.item_name} from cart`}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                                            <button
                                                onClick={() => updateQuantity(cartItem.item.id, -1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm transition-colors hover:text-emerald-600"
                                                aria-label={`Decrease quantity of ${cartItem.item.item_name}`}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-bold text-slate-700">{cartItem.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(cartItem.item.id, 1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm transition-colors hover:text-emerald-600"
                                                aria-label={`Increase quantity of ${cartItem.item.item_name}`}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold text-slate-400 mb-0.5">{cartItem.item.item_price.toLocaleString('vi-VN')}₫ each</p>
                                            <span className="text-lg font-bold text-emerald-700">
                                                {(cartItem.item.item_price * cartItem.quantity).toLocaleString('vi-VN')}₫
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Column: Table Selection + Summary - Takes 5 columns */}
                    <div className="lg:col-span-5 flex flex-col gap-6 h-fit">

                        {/* Dining Details */}
                        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 sm:p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -z-10 translate-x-1/2 -translate-y-1/2 opacity-70"></div>
                            
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-emerald-100/50 text-emerald-600">
                                    <UtensilsCrossed className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 font-serif">Dining Details</h2>
                            </div>

                            {/* Order Type Toggle */}
                            {!activeOrder && (
                                <div className="mb-6 flex gap-1 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/50">
                                    <button
                                        onClick={() => setOrderType('dine_in')}
                                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${orderType === 'dine_in'
                                                ? 'bg-white text-emerald-700 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                            }`}
                                    >
                                        <UtensilsCrossed className="w-4 h-4" />
                                        Dine-in
                                    </button>
                                    <button
                                        onClick={() => setOrderType('shipping')}
                                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${orderType === 'shipping'
                                                ? 'bg-white text-sky-700 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                            }`}
                                    >
                                        <Truck className="w-4 h-4" />
                                        Shipping
                                    </button>
                                </div>
                            )}

                            {activeOrder ? (
                                <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                                    <p className="font-bold text-emerald-900">Active Order #{activeOrder.id}</p>
                                    <p className="text-emerald-800 text-sm mt-1">You are seated at <span className="font-bold">Table {activeOrder.table_id}</span>.</p>
                                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-emerald-600/80">Items will be added to this order</p>
                                </div>
                            ) : orderType === 'dine_in' ? (
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Select Your Table</label>
                                    {tablesLoading ? (
                                        <div className="h-12 animate-pulse rounded-xl bg-slate-100"></div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={selectedTable}
                                                onChange={(e) => updateSelectedTable(e.target.value ? Number(e.target.value) : null)}
                                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 shadow-sm"
                                            >
                                                <option value="">-- Choose a Table --</option>
                                                {orderedTables.map(t => {
                                                    // Don't disable the table the user already selected
                                                    const isPreSelected = selectedTable && t.id.toString() === selectedTable;
                                                    return (
                                                        <option key={t.id} value={t.id} disabled={t.is_occupied && !isPreSelected}>
                                                            Table {t.table_number} ({t.table_size} seats) {t.is_occupied && !isPreSelected ? '- Occupied' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <MapPin className="w-4 h-4 text-sky-500" />
                                        Delivery Address
                                    </label>
                                    <textarea
                                        value={shippingAddress}
                                        onChange={(e) => setShippingAddress(e.target.value)}
                                        placeholder="Enter your full delivery address..."
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100 shadow-sm"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Payment Method Selection */}
                        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 sm:p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-sky-100/50 text-sky-600">
                                    <Banknote className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 font-serif">Payment Method</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* QR Payment Option */}
                                <button
                                    onClick={() => setPaymentMethod('QR')}
                                    className={`relative flex flex-col items-center gap-3 rounded-[1.25rem] border-2 p-5 transition-all duration-300 ${paymentMethod === 'QR'
                                            ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100/50'
                                            : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {paymentMethod === 'QR' && (
                                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 shadow-sm shadow-sky-200 animate-bounce-slow">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <div className={`rounded-xl p-3.5 transition-colors ${paymentMethod === 'QR' ? 'bg-sky-100/80 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                                        <QrCode className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <span className={`block text-sm font-bold ${paymentMethod === 'QR' ? 'text-sky-700' : 'text-slate-600'}`}>QR Transfer</span>
                                        <span className="text-[10px] font-medium text-slate-400">Instant confirm</span>
                                    </div>
                                </button>

                                {/* Cash Option */}
                                <button
                                    onClick={() => orderType !== 'shipping' && setPaymentMethod('cash')}
                                    disabled={orderType === 'shipping'}
                                    className={`relative flex flex-col items-center gap-3 rounded-[1.25rem] border-2 p-5 transition-all duration-300 ${orderType === 'shipping'
                                            ? 'cursor-not-allowed border-slate-100 bg-slate-50/50 opacity-50'
                                            : paymentMethod === 'cash'
                                                ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100/50'
                                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {paymentMethod === 'cash' && orderType !== 'shipping' && (
                                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 animate-bounce-slow">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <div className={`rounded-xl p-3.5 transition-colors ${paymentMethod === 'cash' && orderType !== 'shipping' ? 'bg-emerald-100/80 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                        <Banknote className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <span className={`block text-sm font-bold ${paymentMethod === 'cash' && orderType !== 'shipping' ? 'text-emerald-700' : 'text-slate-600'}`}>Cash</span>
                                        <span className="text-[10px] font-medium text-slate-400">{orderType === 'shipping' ? 'Not available' : 'Pay at counter'}</span>
                                    </div>
                                </button>
                            </div>

                            {orderType === 'shipping' && (
                                <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-amber-700">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <p className="text-xs font-medium">Shipping orders require QR payment.</p>
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 sm:p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-50/30"></div>
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold text-slate-900 font-serif mb-6">Summary</h2>

                                {coupons.length > 0 && (
                                    <div className="mb-6 space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Available Coupons</label>
                                        <div className="relative">
                                            <select
                                                value={selectedCouponCode}
                                                onChange={(e) => setSelectedCouponCode(e.target.value)}
                                                className="w-full appearance-none rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm font-medium text-emerald-900 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                            >
                                                <option value="">-- No Coupon Selected --</option>
                                                {coupons.map(coupon => (
                                                    <option key={coupon.id} value={coupon.code}>
                                                        {coupon.discount_percentage}% OFF ({coupon.code})
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-600">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 border-b border-slate-200 pb-6">
                                    <div className="flex justify-between text-sm font-medium text-slate-600">
                                        <span>Subtotal</span>
                                        <span>{cartTotal.toLocaleString('vi-VN')}₫</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-slate-600">
                                        <span>Tax (8%)</span>
                                        <span>{(cartTotal * 0.08).toLocaleString('vi-VN')}₫</span>
                                    </div>
                                    {selectedCouponCode && (
                                        <div className="flex justify-between text-sm font-bold text-emerald-600">
                                            <span>Discount ({coupons.find(c => c.code === selectedCouponCode)?.discount_percentage}%)</span>
                                            <span>-{(cartTotal * (coupons.find(c => c.code === selectedCouponCode)?.discount_percentage / 100)).toLocaleString('vi-VN')}₫</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex justify-between pt-6 mb-8">
                                    <span className="text-xl font-bold text-slate-900">Total</span>
                                    <span className="text-2xl font-bold text-emerald-700">
                                        {(() => {
                                            const tax = cartTotal * 0.08;
                                            const discountPercent = selectedCouponCode ? coupons.find(c => c.code === selectedCouponCode)?.discount_percentage : 0;
                                            const discount = cartTotal * (discountPercent / 100);
                                            return (cartTotal + tax - discount).toLocaleString('vi-VN');
                                        })()}₫
                                    </span>
                                </div>

                                <button
                                    onClick={() => placeOrderMutation.mutate()}
                                    disabled={placeOrderMutation.isPending || (!activeOrder && orderType === 'dine_in' && !selectedTable) || (!activeOrder && orderType === 'shipping' && !shippingAddress.trim())}
                                    className={`group relative w-full overflow-hidden flex items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                                        paymentMethod === 'QR'
                                            ? 'bg-gradient-to-r from-sky-500 to-sky-600 hover:shadow-sky-300/50 hover:from-sky-600 hover:to-sky-700'
                                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-emerald-300/50 hover:from-emerald-600 hover:to-emerald-700'
                                    }`}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                                    <span className="relative z-10 flex items-center gap-2">
                                        {placeOrderMutation.isPending ? 'Processing...' : (
                                            <>
                                                {activeOrder ? 'Add to Existing Order' : paymentMethod === 'QR' ? 'Pay with QR' : 'Place Order (Cash)'}
                                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </span>
                                </button>
                                <p className="mt-4 text-center text-xs font-medium text-slate-400">
                                    {paymentMethod === 'QR'
                                        ? "You'll be redirected to scan the QR code."
                                        : "Waiter will confirm your cash payment."
                                    }
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
