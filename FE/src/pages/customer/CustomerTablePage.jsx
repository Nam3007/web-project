import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Users, UtensilsCrossed, Grid3x3, CheckCircle2 } from 'lucide-react';

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
    const [viewMode, setViewMode] = useState('grid');
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

    if (isLoading) return <div className="text-center py-20">Loading tables...</div>;

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
        <div className="customer-page customer-page-wide">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="customer-page-title">Select Your Table</h1>
                    <p className="text-gray-500 mt-1">Choose an available table for your dining experience</p>
                    <div className="mt-3 flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full font-medium text-sm border border-emerald-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {availableCount} available
                        </span>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full font-medium text-sm border border-red-100">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            {occupiedCount} occupied
                        </span>
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-1 rounded-2xl bg-slate-100 p-1.5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Grid3x3 className="w-4 h-4" />
                            Table view
                        </button>
                    </div>
                </div>
            </section>

            {/* Selected Table Banner */}
            {selectedTable && (
                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm animate-fade-in lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
                            <UtensilsCrossed className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">
                                {tableSelectionLocked ? `Table ${selectedTable.table_number} In Use` : `Table ${selectedTable.table_number} Selected`}
                            </p>
                            <p className="text-sm text-slate-600">
                                {tableSelectionLocked
                                    ? 'You have an active order. Complete it before choosing another table.'
                                    : `${selectedTable.table_size} seats • Available`
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!tableSelectionLocked && (
                            <>
                                <button
                                    onClick={() => setSelectedTable(null)}
                                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handleConfirmTable}
                                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Confirm Table
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {tableSelectionLocked && activeOrder && (
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <p className="font-semibold">Table selection is locked until your current order is completed.</p>
                    <p className="text-sm mt-1">Current order #{activeOrder.id} is still active at table {activeOrder.table_id}.</p>
                </div>
            )}

            {/* GRID/LIST VIEW */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
                    {orderedTables.map(table => (
                        <div
                            key={table.id}
                            onClick={() => !table.is_occupied && !tableSelectionLocked && handleTableSelect(table)}
                            className={`flex flex-col items-center justify-center space-y-3 rounded-[1.5rem] border-2 p-5 transition-all ${(tableSelectionLocked ? activeOrder?.table_id === table.id : selectedTable?.id === table.id)
                                    ? 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-100 ring-2 ring-emerald-200'
                                    : table.is_occupied
                                        ? 'border-rose-100 bg-rose-50/80 opacity-70 cursor-not-allowed'
                                        : tableSelectionLocked
                                            ? 'border-slate-100 bg-white/80 opacity-70 cursor-not-allowed'
                                            : 'cursor-pointer border-slate-100 bg-white/90 shadow-sm hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md'
                                }`}
                        >
                            <div className={`p-4 rounded-full ${(tableSelectionLocked ? activeOrder?.table_id === table.id : selectedTable?.id === table.id)
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : table.is_occupied
                                        ? 'bg-gray-200 text-gray-500'
                                        : tableSelectionLocked
                                            ? 'bg-gray-100 text-gray-400'
                                            : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                <UtensilsCrossed className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{table.table_number}</h3>

                            <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-white px-3 py-1 text-sm font-medium text-slate-500">
                                <Users className="w-4 h-4" />
                                <span>{table.table_size} Seats</span>
                            </div>

                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${(tableSelectionLocked ? activeOrder?.table_id === table.id : selectedTable?.id === table.id)
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : table.is_occupied
                                        ? 'bg-rose-100 text-rose-600'
                                        : tableSelectionLocked
                                            ? 'bg-slate-100 text-slate-500'
                                            : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                {(tableSelectionLocked ? activeOrder?.table_id === table.id : selectedTable?.id === table.id)
                                    ? 'Selected'
                                    : table.is_occupied
                                        ? 'Occupied'
                                        : tableSelectionLocked
                                            ? 'Locked'
                                            : 'Free'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Card */}
            <div className="customer-card-soft p-5 flex gap-4 items-start">
                <div className="bg-white p-2 rounded-lg text-blue-600 shrink-0 shadow-sm">
                    <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900">How to Order?</h3>
                    <p className="text-blue-700 text-sm mt-1">
                        Select an available table, then head to the <strong>Menu</strong> to add items to your cart.
                        Choose your payment method (QR or Cash) at checkout and your order will be sent to the kitchen!
                    </p>
                </div>
            </div>

        </div>
    );
}
