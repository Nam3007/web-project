import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { CheckCircle, Clock, QrCode, AlertCircle, ArrowLeft, Loader } from 'lucide-react';

// ============================================
// CONFIGURABLE: Change this value for testing
// ============================================
const QR_COUNTDOWN_SECONDS = 120;

// VietQR Bank Details
const BANK_ID = '970403'; // Sacombank
const ACCOUNT_NO = '060252287577';
const ACCOUNT_NAME = 'TRAN QUOC NAM';

function buildVietQRUrl(amount, orderId) {
    const addInfo = encodeURIComponent(`DH ${orderId}`);
    const name = encodeURIComponent(ACCOUNT_NAME);
    return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${Math.round(amount)}&addInfo=${addInfo}&accountName=${name}`;
}

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

            // Step 2: Mark order as paid
            await api.put(`/orders/${orderId}`, { status: 'paid' });
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

    // Auto-confirm when countdown reaches 0
    useEffect(() => {
        if (timeLeft === 0 && !isCompleted && !isProcessing) {
            handleConfirmPayment();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = ((QR_COUNTDOWN_SECONDS - timeLeft) / QR_COUNTDOWN_SECONDS) * 100;

    if (!orderId || !amount) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Payment</h2>
                <p className="text-gray-500 mb-6">Missing order information. Please try again.</p>
                <button
                    onClick={() => navigate('/orders')}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold"
                >
                    Back to Orders
                </button>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce-slow">
                        <CheckCircle className="w-14 h-14 text-green-500" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 bg-green-200 rounded-full animate-ping opacity-25"></div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-500 mb-2">Order #{orderId} has been paid</p>
                <p className="text-2xl font-bold text-green-600 mb-8">
                    {new Intl.NumberFormat('vi-VN').format(amount)} VNĐ
                </p>
                <p className="text-sm text-gray-400 mb-6">Your order is now being prepared by our kitchen.</p>
                <button
                    onClick={() => navigate('/orders')}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
                >
                    View My Orders
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto py-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/orders')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Orders</span>
            </button>

            {/* Main QR Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-[22px] p-6 space-y-6">

                    {/* Header */}
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-3">
                            <QrCode className="w-4 h-4" />
                            QR Bank Transfer
                        </div>
                        <h1 className="text-2xl font-bold text-white">Scan to Pay</h1>
                        <p className="text-gray-400 text-sm mt-1">Order #{orderId}</p>
                    </div>

                    {/* Amount */}
                    <div className="text-center bg-white/5 rounded-2xl p-4 border border-white/10">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Transfer Amount</p>
                        <p className="text-4xl font-bold text-white">
                            {new Intl.NumberFormat('vi-VN').format(amount)}
                            <span className="text-lg text-gray-400 ml-2">VNĐ</span>
                        </p>
                    </div>

                    {/* QR Code Image */}
                    <div className="flex justify-center">
                        <div className="bg-white rounded-2xl p-4 shadow-2xl shadow-black/20">
                            <img
                                src={buildVietQRUrl(amount, orderId)}
                                alt="VietQR Payment Code"
                                className="w-64 h-64 object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="w-64 h-64 items-center justify-center text-gray-400 text-center hidden">
                                <div>
                                    <QrCode className="w-16 h-16 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Failed to load QR code</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Bank</span>
                            <span className="text-white font-medium">Sacombank</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Account</span>
                            <span className="text-white font-mono font-medium">{ACCOUNT_NO}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Name</span>
                            <span className="text-white font-medium">{ACCOUNT_NAME}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Content</span>
                            <span className="text-blue-400 font-mono font-medium">DH {orderId}</span>
                        </div>
                    </div>

                    {/* Countdown Timer */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400 flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                Auto-confirm in
                            </span>
                            <span className={`text-lg font-mono font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-linear rounded-full"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleConfirmPayment}
                            disabled={isProcessing}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    I Have Completed the Transfer
                                </>
                            )}
                        </button>
                        <p className="text-xs text-center text-gray-500">
                            Please transfer the exact amount before confirming
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
