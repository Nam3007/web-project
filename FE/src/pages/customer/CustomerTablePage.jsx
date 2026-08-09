import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Users, UtensilsCrossed, CheckCircle2, Info, Armchair } from 'lucide-react';
import { WarmPageWrapper, SectionHeading, PageHero, WarmCard, GoldButton, FlourishOrnament } from '../../components/RestaurantDecorations';

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

export default function CustomerTablePage() {
    const [selectedTable, setSelectedTable] = useState(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: tables = [], isLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const res = await api.get('/tables/');
            return res.data;
        },
        refetchInterval: 5000
    });

    const { data: activeOrder } = useQuery({
        queryKey: ['myActiveOrder', user?.id],
        queryFn: async () => {
            const res = await api.get('/orders/');
            const myOrders = res.data.filter(order => order.customer_id === user.id);
            const active = myOrders
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .find(order => order.status !== 'paid' && order.status !== 'cancelled' && order.status !== 'completed');
            return active || null;
        },
        enabled: !!user?.id,
    });

    const tableSelectionLocked = !!activeOrder;

    useEffect(() => {
        const savedTable = readStoredSelectedTable();

        if (!savedTable || tableSelectionLocked) return;

        const matchingTable = tables.find(table => table.id === savedTable.id);

        if (matchingTable) {
            setSelectedTable({
                ...matchingTable,
                is_occupied: true,
            });
        }
    }, [tables, tableSelectionLocked]);

    if (isLoading) {
        return (
            <WarmPageWrapper pattern="tables">
                <div className="space-y-8 animate-pulse">
                    <div className="h-32 bg-r-warm/10 rounded-3xl" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-44 bg-r-warm/10 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </WarmPageWrapper>
        );
    }

    const orderedTables = [...tables].sort((a, b) => {
        const leftNumber = Number(a.table_number);
        const rightNumber = Number(b.table_number);

        if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
            return String(a.table_number).localeCompare(String(b.table_number));
        }

        return leftNumber - rightNumber;
    });

    const availableCount = orderedTables.filter(t => !t.is_occupied).length;
    const occupiedCount = orderedTables.filter(t => t.is_occupied).length;

    const handleTableSelect = async (table) => {
        if (tableSelectionLocked) {
            alert('Please complete your current order before selecting a new table.');
            return;
        }

        const storedTable = readStoredSelectedTable();

        if (storedTable?.id === table.id) {
            setSelectedTable({
                ...table,
                is_occupied: true,
            });
            return;
        }

        const previousTable = storedTable?.id && storedTable.id !== table.id
            ? tables.find(item => item.id === storedTable.id)
            : null;

        try {
            if (previousTable) {
                await api.patch(`/tables/status/${previousTable.id}/`, { is_occupied: false });
            }

            await api.patch(`/tables/status/${table.id}/`, { is_occupied: true });

            const nextSelectedTable = {
                id: table.id,
                table_number: table.table_number,
                table_size: table.table_size,
                is_occupied: true,
            };

            localStorage.setItem(SELECTED_TABLE_STORAGE_KEY, JSON.stringify(nextSelectedTable));
            setSelectedTable(nextSelectedTable);
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        } catch (error) {
            if (previousTable) {
                try {
                    await api.patch(`/tables/status/${previousTable.id}/`, { is_occupied: true });
                } catch {
                    // Ignore rollback failures so the original error is surfaced.
                }
            }

            alert(error.response?.data?.detail || 'Failed to update table status.');
        }
    };

    const handleConfirmTable = async () => {
        if (!selectedTable) return;

        navigate('/menu', { state: { tableConfirmed: true, tableNumber: selectedTable.table_number } });
    };

    return (
        <WarmPageWrapper pattern="tables">
            <div className="space-y-6">
                {/* ── Header ───────────────────────────────────────── */}
                <PageHero
                    title="Choose Your Spot"
                    subtitle="Select an available table for your dining experience"
                    icon={Armchair}
                    accentWord="Spot"
                    pattern="tables"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-green-500/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-green-500/20">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-sm font-bold text-green-300 font-sans tabular-nums">{availableCount}</span>
                            <span className="text-xs text-green-400/60 hidden sm:inline font-sans">free</span>
                        </div>
                        <div className="flex items-center gap-2 bg-red-500/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-red-500/20">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="text-sm font-bold text-red-300 font-sans tabular-nums">{occupiedCount}</span>
                            <span className="text-xs text-red-400/60 hidden sm:inline font-sans">taken</span>
                        </div>
                    </div>
                </PageHero>

                {/* ── Selected Table Banner ─────────────────────────── */}
                {selectedTable && (
                    <div className="p-4 md:p-5 bg-r-gold/8 border border-r-gold/25 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-r-gold/20 rounded-full flex items-center justify-center shadow-lg shadow-r-gold/10 border border-r-gold/30">
                                <UtensilsCrossed className="w-6 h-6 text-r-gold" />
                            </div>
                            <div>
                                <p className="font-serif font-bold text-r-text text-lg">
                                    {tableSelectionLocked ? `Table ${selectedTable.table_number} In Use` : `Table ${selectedTable.table_number} Selected`}
                                </p>
                                <p className="text-sm text-r-muted font-sans">
                                    {tableSelectionLocked
                                        ? 'You have an active order. Complete it before choosing another table.'
                                        : `${selectedTable.table_size} seats • Ready for you`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {!tableSelectionLocked && (
                                <>
                                    <button
                                        onClick={() => setSelectedTable(null)}
                                        className="text-sm text-r-muted hover:text-r-text font-medium px-3 py-2 rounded-xl hover:bg-r-cream transition-colors font-sans"
                                    >
                                        Clear
                                    </button>
                                    <GoldButton onClick={handleConfirmTable} className="px-5 py-2.5 text-sm flex-1 sm:flex-none">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Confirm & View Menu
                                    </GoldButton>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Active Order Lock Warning ─────────────────────── */}
                {tableSelectionLocked && activeOrder && (
                    <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl text-amber-800 font-sans">
                        <p className="font-semibold text-sm">Table selection is locked until your current order is completed.</p>
                        <p className="text-xs mt-1 text-amber-700/70">Current order #{activeOrder.id} is still active at table {activeOrder.table_id}.</p>
                    </div>
                )}

                {/* ── Table Grid ────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {orderedTables.map((table, idx) => {
                        const isSelected = tableSelectionLocked
                            ? activeOrder?.table_id === table.id
                            : selectedTable?.id === table.id;
                        const isOccupied = table.is_occupied;
                        const isLocked = tableSelectionLocked && !isSelected;

                        return (
                            <div
                                key={table.id}
                                onClick={() => !isOccupied && !tableSelectionLocked && handleTableSelect(table)}
                                className={`rounded-2xl border-2 p-5 md:p-6 flex flex-col items-center justify-center space-y-3 transition-all duration-300 animate-fade-in-up ${
                                    isSelected
                                        ? 'bg-r-gold/8 border-r-gold shadow-lg shadow-r-gold/10 ring-2 ring-r-gold/30'
                                        : isOccupied
                                            ? 'bg-r-cream/50 border-r-border/30 opacity-60 cursor-not-allowed'
                                            : isLocked
                                                ? 'bg-white/40 border-r-border/30 opacity-50 cursor-not-allowed'
                                                : 'bg-white/70 border-r-border/40 shadow-sm hover:shadow-lg hover:border-r-gold/40 hover:bg-white cursor-pointer hover:shadow-r-gold/5'
                                }`}
                                style={{ animationDelay: `${Math.min(idx * 50, 400)}ms` }}
                            >
                                <div className={`p-4 rounded-full transition-colors ${
                                    isSelected
                                        ? 'bg-r-gold/15 text-r-gold'
                                        : isOccupied
                                            ? 'bg-red-100/60 text-red-400'
                                            : isLocked
                                                ? 'bg-r-cream text-r-muted/50'
                                                : 'bg-r-cream text-r-warm'
                                }`}>
                                    <UtensilsCrossed className="w-7 h-7 md:w-8 md:h-8" />
                                </div>

                                <h3 className="text-2xl font-serif font-bold text-r-text">{table.table_number}</h3>

                                <div className="flex items-center gap-1.5 text-sm text-r-muted font-medium font-sans bg-r-cream/50 px-3 py-1 rounded-full border border-r-border/30">
                                    <Users className="w-4 h-4" />
                                    <span>{table.table_size} Seats</span>
                                </div>

                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-sans ${
                                    isSelected
                                        ? 'bg-r-gold/15 text-r-gold border border-r-gold/20'
                                        : isOccupied
                                            ? 'bg-red-50 text-red-500 border border-red-200/50'
                                            : isLocked
                                                ? 'bg-r-cream text-r-muted border border-r-border/30'
                                                : 'bg-green-50 text-green-600 border border-green-200/50'
                                }`}>
                                    {isSelected
                                        ? '✦ Selected'
                                        : isOccupied
                                            ? 'Occupied'
                                            : isLocked
                                                ? 'Locked'
                                                : 'Available'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── How to Order Card ─────────────────────────────── */}
                <WarmCard className="!bg-r-dark/95 !border-r-gold/15 grain-overlay">
                    <div className="relative z-10 flex gap-4 items-start">
                        <div className="bg-r-gold/15 p-3 rounded-xl border border-r-gold/20 shrink-0">
                            <Info className="w-5 h-5 text-r-gold" />
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-r-cream text-lg mb-2">How to Order?</h3>
                            <div className="space-y-2 text-sm font-sans text-r-cream/60">
                                <p className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-r-gold/20 text-r-gold rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                                    Select an available table from the grid above
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-r-gold/20 text-r-gold rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                                    Confirm your table and browse the menu
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-r-gold/20 text-r-gold rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                                    Add items to your cart and choose payment method
                                </p>
                            </div>
                            <FlourishOrnament className="mt-4 opacity-30" size="sm" />
                        </div>
                    </div>
                </WarmCard>
            </div>
        </WarmPageWrapper>
    );
}
