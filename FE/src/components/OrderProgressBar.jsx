import { Check, Clock, ChefHat, UtensilsCrossed, Truck, PackageCheck, CreditCard, ShieldCheck, CircleDot } from 'lucide-react';

const DINE_IN_STEPS = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'paid', label: 'Paid', icon: CreditCard },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: UtensilsCrossed },
    { key: 'served', label: 'Served', icon: PackageCheck },
    { key: 'completed', label: 'Completed', icon: Check },
];

const SHIPPING_STEPS = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'paid', label: 'Paid', icon: CreditCard },
    { key: 'pending_confirmation', label: 'Confirming', icon: ShieldCheck },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: UtensilsCrossed },
    { key: 'delivering', label: 'Delivering', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: PackageCheck },
    { key: 'completed', label: 'Completed', icon: Check },
];

// Map queued status to the same visual position as its preceding step
const STATUS_ALIASES = {
    queued: 'paid',
};

export default function OrderProgressBar({ status, orderType = 'dine_in' }) {
    const steps = orderType === 'shipping' ? SHIPPING_STEPS : DINE_IN_STEPS;
    const resolvedStatus = STATUS_ALIASES[status] || status;

    // Handle cancelled specially
    if (status === 'cancelled') {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
                <CircleDot className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-red-600">Order Cancelled</span>
            </div>
        );
    }

    const currentIdx = steps.findIndex(s => s.key === resolvedStatus);

    return (
        <div className="w-full">
            {/* Desktop / Tablet view */}
            <div className="hidden sm:flex items-center w-full">
                {steps.map((step, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isPending = idx > currentIdx;
                    const StepIcon = step.icon;

                    return (
                        <div key={step.key} className="flex items-center flex-1 last:flex-none">
                            {/* Step circle + label */}
                            <div className="flex flex-col items-center relative">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                                        isCompleted
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                                            : isCurrent
                                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-300 ring-4 ring-blue-100'
                                                : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <StepIcon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                                    )}
                                </div>
                                <span
                                    className={`text-[10px] mt-1.5 font-semibold whitespace-nowrap ${
                                        isCompleted
                                            ? 'text-emerald-600'
                                            : isCurrent
                                                ? 'text-blue-600'
                                                : 'text-gray-400'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector line */}
                            {idx < steps.length - 1 && (
                                <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-gray-200">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${
                                            idx < currentIdx
                                                ? 'w-full bg-emerald-400'
                                                : idx === currentIdx
                                                    ? 'w-1/2 bg-gradient-to-r from-blue-400 to-transparent'
                                                    : 'w-0'
                                        }`}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile view — compact */}
            <div className="flex sm:hidden items-center w-full gap-0.5">
                {steps.map((step, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const StepIcon = step.icon;

                    return (
                        <div key={step.key} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                        isCompleted
                                            ? 'bg-emerald-500 text-white'
                                            : isCurrent
                                                ? 'bg-blue-500 text-white ring-2 ring-blue-200'
                                                : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        <StepIcon className={`w-3 h-3 ${isCurrent ? 'animate-pulse' : ''}`} />
                                    )}
                                </div>
                                {isCurrent && (
                                    <span className="text-[9px] mt-1 font-bold text-blue-600 whitespace-nowrap">
                                        {step.label}
                                    </span>
                                )}
                            </div>

                            {idx < steps.length - 1 && (
                                <div className="flex-1 h-0.5 mx-0.5 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            idx < currentIdx ? 'w-full bg-emerald-400' : 'w-0'
                                        }`}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
