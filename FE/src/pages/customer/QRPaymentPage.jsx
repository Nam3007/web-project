import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { CheckCircle, Clock, QrCode, AlertCircle, ArrowLeft, Loader } from 'lucide-react';

// ============================================
// CONFIGURABLE: Change this value for testing
// ============================================
const QR_COUNTDOWN_SECONDS = 3000;

export default function QRPaymentPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const orderId = searchParams.get('orderId');
    const amount = parseFloat(searchParams.get('amount') || '0');
    const paymentId = searchParams.get('paymentId');

    const [timeLeft, setTimeLeft] = useState(QR_COUNTDOWN_SECONDS);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const intervalRef = useRef(null);

    const { data: qrConfig = {} } = useQuery({
        queryKey: ['vietqr-config'],
        queryFn: async () => (await api.get('/payments/config')).data,
    });

    const { data: paymentVerification } = useQuery({
        queryKey: ['payment-verification', paymentId],
        queryFn: async () => (await api.get(`/payments/${paymentId}/verify`)).data,
        enabled: Boolean(paymentId),
        refetchInterval: isCompleted ? false : 5000,
    });

    useEffect(() => {
        if (paymentVerification?.completed && !isCompleted) {
            setIsCompleted(true);
            clearInterval(intervalRef.current);
        }
    }, [paymentVerification, isCompleted]);

    // Countdown timer
    useEffect(() => {
        if (isCompleted) return;

        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [isCompleted]);

    // Confirm payment mutation
    const confirmPaymentMutation = useMutation({
        mutationFn: async () => {
            // Step 1: Mark payment as completed
            if (paymentId) {
                await api.patch(`/payments/${paymentId}/status?payment_status=completed`);
            }
            // Backend PaymentService automatically marks order as paid and handles chef assignment

        },
        onSuccess: () => {
            setIsCompleted(true);
            clearInterval(intervalRef.current);
            queryClient.invalidateQueries(['myOrders']);
            queryClient.invalidateQueries(['myActiveOrder']);
        },
        onError: (err) => {
            setIsProcessing(false);
            alert('Failed to confirm payment: ' + (err.response?.data?.detail || err.message));
        }
    });

    const handleConfirmPayment = () => {
        setIsProcessing(true);
        confirmPaymentMutation.mutate();
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = ((QR_COUNTDOWN_SECONDS - timeLeft) / QR_COUNTDOWN_SECONDS) * 100;

    if (!orderId || !amount || !paymentId) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center customer-page customer-page-narrow relative">
                <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-10"></div>
                <div className="relative z-10 bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] border border-white/70 shadow-xl shadow-emerald-900/5">
                    <AlertCircle className="w-16 h-16 text-rose-400 mb-6 mx-auto" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 font-serif">Invalid Payment</h2>
                    <p className="text-slate-500 mb-8">Missing order information. Please try again.</p>
                    <button
                        onClick={() => navigate('/orders')}
                        className="px-8 py-3.5 bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-200 hover:-translate-y-0.5 transition-all"
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center customer-page customer-page-narrow relative">
                <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-10"></div>
                <div className="relative z-10 bg-white/90 backdrop-blur-xl p-12 rounded-[2.5rem] border border-white shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
                    <div className="relative mb-8 mx-auto w-24 h-24">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce-slow shadow-inner border border-emerald-200">
                            <CheckCircle className="w-12 h-12 text-emerald-500" />
                        </div>
                        <div className="absolute inset-0 w-24 h-24 bg-emerald-300 rounded-full animate-ping opacity-30"></div>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-3 font-serif">Payment Successful!</h2>
                    <p className="text-slate-500 mb-4 font-medium">Order #{orderId} has been paid</p>
                    <div className="inline-block bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl mb-8">
                        <p className="text-2xl font-bold text-emerald-600">
                            {new Intl.NumberFormat('vi-VN').format(amount)} VNĐ
                        </p>
                    </div>
                    <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">Your order is now being processed and prepared by our kitchen.</p>
                    <button
                        onClick={() => navigate('/active-orders')}
                        className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-200 hover:-translate-y-1 transition-all w-full sm:w-auto"
                    >
                        View My Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-page customer-page-narrow py-10 relative">
            <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-10 z-0"></div>

            <div className="relative z-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 mb-8 transition-colors group bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-sm w-fit"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold">Back to Orders</span>
                </button>

                {/* Main QR Card */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-white shadow-[0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                    <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-[0.03]"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none"></div>
                    
                    <div className="relative z-10 p-8 sm:p-10 space-y-8">
                        {/* Header */}
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-100 shadow-sm">
                                <QrCode className="w-4 h-4" />
                                QR Bank Transfer
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 font-serif">Scan to Pay</h1>
                            <p className="text-slate-500 font-medium mt-2">Order #{orderId}</p>
                        </div>

                        {/* Amount */}
                        <div className="text-center bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-inner">
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-bold">Transfer Amount</p>
                            <p className="text-4xl font-bold text-emerald-600 tabular-nums">
                                {new Intl.NumberFormat('vi-VN').format(amount)}
                                <span className="text-xl text-slate-400 ml-2">VNĐ</span>
                            </p>
                        </div>

                        {/* QR Code Image */}
                        <div className="flex justify-center">
                            <div className="bg-white rounded-[2rem] p-5 shadow-lg border border-slate-100 relative group">
                                <div className="absolute inset-0 bg-emerald-50 rounded-[2rem] transform rotate-3 -z-10 transition-transform group-hover:rotate-6"></div>
                                <div className="absolute inset-0 bg-emerald-100 rounded-[2rem] transform -rotate-3 -z-20 transition-transform group-hover:-rotate-6"></div>
                                <img
                                    src={`${api.defaults.baseURL}/payments/${paymentId}/qr`}
                                    alt="VietQR Payment Code"
                                    className="w-64 h-64 object-contain rounded-xl relative z-10 bg-white"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="w-64 h-64 items-center justify-center text-slate-400 text-center hidden bg-slate-50 rounded-xl relative z-10">
                                    <div>
                                        <QrCode className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                                        <p className="text-sm font-medium">Failed to load QR code</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">Bank</span>
                                <span className="text-slate-900 font-bold bg-white px-3 py-1 rounded-lg border border-slate-200">{qrConfig.bank_id || 'Loading...'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">Account</span>
                                <span className="text-slate-900 font-mono font-bold bg-white px-3 py-1 rounded-lg border border-slate-200">{qrConfig.account_no || 'Loading...'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">Name</span>
                                <span className="text-slate-900 font-bold bg-white px-3 py-1 rounded-lg border border-slate-200">{qrConfig.account_name || 'Loading...'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">Content</span>
                                <span className="text-emerald-600 font-mono font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">DH {orderId}</span>
                            </div>
                        </div>

                        {/* Countdown Timer */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                                    <Clock className="w-4 h-4 text-emerald-500" />
                                    Auto-confirm in
                                </span>
                                <span className={`text-xl font-mono font-bold ${timeLeft <= 30 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-linear rounded-full"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <button
                                onClick={handleConfirmPayment}
                                disabled={isProcessing}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader className="w-6 h-6 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-6 h-6" />
                                        I Have Completed the Transfer
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-center text-slate-500 font-medium">
                                Please ensure the exact amount is transferred before confirming
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
