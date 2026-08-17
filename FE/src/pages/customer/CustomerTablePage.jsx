import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Users, UtensilsCrossed, Grid3x3, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CustomerTablePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState('grid');
    const [selectedTable, setSelectedTable] = useState(null);

    // Fetch all tables
    const { data: tables = [], isLoading: isLoadingTables } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const res = await api.get('/tables/');
            return res.data;
        }
    });

    // Check if the customer has an active order
    const { data: activeOrder, isLoading: isLoadingOrder } = useQuery({
        queryKey: ['myActiveOrder'],
        queryFn: async () => {
            try {
                const res = await api.get(`/orders/active/customer/${user.id}`);
                return res.data; // Can be an array or single order depending on backend
            } catch (err) {
                if (err.response?.status === 404) return null;
                throw err;
            }
        },
        enabled: !!user
    });

    // The backend returns completed orders (within 24h) for rating 
    const activeOrders = Array.isArray(activeOrder) ? activeOrder : (activeOrder ? [activeOrder] : []);
    const activeOrderData = activeOrders.find(o => o.status !== 'completed' && o.status !== 'cancelled') || null;
    const tableSelectionLocked = !!activeOrderData;

    useEffect(() => {
        if (tableSelectionLocked && activeOrderData?.table_id && tables.length > 0) {
            const currentTable = tables.find(t => t.id === activeOrderData.table_id);
            if (currentTable) {
                setSelectedTable(currentTable);
            }
        }
    }, [tableSelectionLocked, activeOrderData, tables]);

    const handleTableSelect = (table) => {
        if (tableSelectionLocked || table.is_occupied) return;
        setSelectedTable(table);
    };

    const handleConfirmTable = () => {
        if (!selectedTable) return;
        localStorage.setItem('selectedTable', JSON.stringify({
            id: selectedTable.id,
            table_number: selectedTable.table_number,
            table_size: selectedTable.table_size,
            is_occupied: true,
        }));
        navigate('/menu', { state: { tableConfirmed: true, tableNumber: selectedTable.table_number } });
    };

    const orderedTables = [...tables].sort((a, b) => {
        const numA = parseInt(a.table_number.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.table_number.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
    });

    const availableCount = tables.filter(t => !t.is_occupied).length;
    const occupiedCount = tables.filter(t => t.is_occupied).length;

    if (isLoadingTables || isLoadingOrder) {
        return (
            <div className="space-y-8">
                <div className="h-32 rounded-[2rem] bg-slate-200/50 animate-pulse" />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-48 rounded-[1.5rem] bg-slate-200/50 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="customer-page customer-page-wide pb-12 relative">
            <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-10 z-0"></div>
            
            <div className="relative z-10 space-y-8">
                {/* Header Section */}
                <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-6 sm:p-8 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 opacity-50"></div>
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700/75">Dining Setup</p>
                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl font-serif">Select Your Table</h1>
                            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base max-w-lg"></p>
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft"></span>
                                    {availableCount} Available
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3.5 py-1.5 text-sm font-semibold text-rose-600 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    {occupiedCount} Occupied
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-1 rounded-2xl bg-slate-100/80 p-1.5 border border-slate-200/50 backdrop-blur-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm shadow-emerald-900/5' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Grid3x3 className="w-4 h-4" />
                                Table View
                            </button>
                        </div>
                    </div>
                </section>

                {/* Selected Table Banner */}
                {selectedTable && (
                    <div className="flex flex-col gap-4 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm animate-fade-in lg:flex-row lg:items-center lg:justify-between relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-transparent"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200">
                                <CheckCircle2 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900">
                                    {tableSelectionLocked ? `Table ${selectedTable.table_number} In Use` : `Table ${selectedTable.table_number} Selected`}
                                </p>
                                <p className="text-sm font-medium text-emerald-700">
                                    {tableSelectionLocked
                                        ? 'Active order in progress.'
                                        : `${selectedTable.table_size} seats capacity • Ready for ordering`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            {!tableSelectionLocked && (
                                <>
                                    <button
                                        onClick={() => setSelectedTable(null)}
                                        className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={handleConfirmTable}
                                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all hover:-translate-y-0.5"
                                    >
                                        Proceed to Menu
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {tableSelectionLocked && activeOrderData && (
                    <div className="flex gap-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
                        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-bold text-amber-900">Table Selection Locked</p>
                            <p className="text-sm font-medium text-amber-700 mt-1">
                                You currently have an active order (#{activeOrderData.id}) at Table {selectedTable?.table_number || activeOrderData.table_id}. 
                                Please complete your dining experience before selecting a new table.
                            </p>
                        </div>
                    </div>
                )}

                {/* GRID VIEW */}
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
                        {orderedTables.map(table => {
                            const isSelected = tableSelectionLocked ? activeOrderData?.table_id === table.id : selectedTable?.id === table.id;
                            const isLocked = tableSelectionLocked;
                            const isOccupied = table.is_occupied;
                            
                            return (
                                <div
                                    key={table.id}
                                    onClick={() => !isOccupied && !isLocked && handleTableSelect(table)}
                                    className={`group flex flex-col items-center justify-center space-y-4 rounded-[1.75rem] border p-6 transition-all duration-300 relative overflow-hidden ${
                                        isSelected
                                            ? 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-100 ring-4 ring-emerald-50'
                                            : isOccupied
                                                ? 'border-rose-100 bg-white opacity-80 cursor-not-allowed'
                                                : isLocked
                                                    ? 'border-slate-100 bg-white/80 opacity-70 cursor-not-allowed'
                                                    : 'cursor-pointer border-slate-100 bg-white/90 shadow-sm hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/5 backdrop-blur-sm'
                                    }`}
                                >
                                    {isSelected && <div className="absolute inset-0 vietnam-pattern opacity-10 pointer-events-none"></div>}
                                    
                                    <div className={`p-4 rounded-full transition-transform duration-300 relative z-10 ${
                                        isSelected
                                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white scale-110 shadow-lg shadow-emerald-200'
                                            : isOccupied
                                                ? 'bg-rose-50 text-rose-400'
                                                : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'
                                    }`}>
                                        <UtensilsCrossed className="w-8 h-8" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 relative z-10">{table.table_number}</h3>
                                    
                                    <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 relative z-10">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{table.table_size} Seats</span>
                                    </div>
                                    
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider relative z-10 ${
                                        isSelected
                                            ? 'bg-emerald-200 text-emerald-800'
                                            : isOccupied
                                                ? 'bg-rose-100 text-rose-700'
                                                : isLocked
                                                    ? 'bg-slate-100 text-slate-500'
                                                    : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                                    }`}>
                                        {isSelected ? 'Your Table' : isOccupied ? 'Occupied' : isLocked ? 'Locked' : 'Available'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
