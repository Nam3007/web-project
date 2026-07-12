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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Select Your Table</h1>
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
                </div>

                {/* View Toggle */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Grid3x3 className="w-4 h-4" />
                        List
                    </button>
                </div>
            </div>

            {/* Selected Table Banner */}
            {selectedTable && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex justify-between items-center animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                            <UtensilsCrossed className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">
                                {tableSelectionLocked ? `Table ${selectedTable.table_number} In Use` : `Table ${selectedTable.table_number} Selected`}
                            </p>
                            <p className="text-sm text-gray-600">
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
                                    className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handleConfirmTable}
                                    className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-colors shadow-md shadow-blue-200"
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
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
                    <p className="font-semibold">Table selection is locked until your current order is completed.</p>
                    <p className="text-sm mt-1">Current order #{activeOrder.id} is still active at table {activeOrder.table_id}.</p>
                </div>
            )}

            {/* GRID/LIST VIEW */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {orderedTables.map(table => (
                        <div
                            key={table.id}
                            onClick={() => !table.is_occupied && !tableSelectionLocked && handleTableSelect(table)}
                            className={`rounded-2xl border-2 p-6 flex flex-col items-center justify-center space-y-3 transition-all ${
                                (tableSelectionLocked ? activeOrder?.table_id === table.id : selectedTable?.id === table.id)
                                    ? 'bg-blue-50 border-blue-400 shadow-lg shadow-blue-100 ring-2 ring-blue-200'
                                    : table.is_occupied
                                        ? 'bg-red-50 border-red-100 opacity-70 cursor-not-allowed'
                                        : tableSelectionLocked
                                            ? 'bg-white border-gray-100 opacity-70 cursor-not-allowed'
                                            : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-800 cursor-pointer'
                            }`}
                        >
                            <div className={`p-4 rounded-full ${
                                (tableSelectionLocked ? activeOrder?.table_id === table.id : selectedTable?.id === table.id)
                                    ? 'bg-blue-100 text-blue-600'
                                    : table.is_occupied
                                        ? 'bg-gray-200 text-gray-500'
                                        : tableSelectionLocked
                                            ? 'bg-gray-100 text-gray-400'
                                            : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                <UtensilsCrossed className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">{table.table_number}</h3>

                            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium bg-white/50 px-3 py-1 rounded-full border border-gray-100">
                                <Users className="w-4 h-4" />
                                <span>{table.table_size} Seats</span>
                            </div>

                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                (tableSelectionLocked ? activeOrder?.table_id === table.id : selectedTable?.id === table.id)
                                    ? 'bg-blue-100 text-blue-600'
                                    : table.is_occupied
                                        ? 'bg-red-100 text-red-600'
                                        : tableSelectionLocked
                                            ? 'bg-gray-100 text-gray-500'
                                        : 'bg-emerald-100 text-emerald-600'
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
            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4 items-start">
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

            <style>{`
                @keyframes pulse-ring {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                    70% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
                .animate-pulse-ring {
                    animation: pulse-ring 2s ease-in-out infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
