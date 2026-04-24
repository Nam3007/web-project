import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Users, UtensilsCrossed, Map, Grid3x3, ChefHat, DoorOpen, Flower2 } from 'lucide-react';
import MapLayout from '../../components/MapLayout';

// Top-down table component with chairs
function TableTop({ table, isSelected, onSelect }) {
    const isOccupied = table.is_occupied;
    const seats = table.table_size || 4;

    // Generate chair positions around circular table
    const chairPositions = [];
    for (let i = 0; i < seats; i++) {
        const angle = (i / seats) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const radius = 42;
        chairPositions.push({
            x: Math.cos(rad) * radius,
            y: Math.sin(rad) * radius,
        });
    }

    const statusColor = isOccupied
        ? { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-600', chair: 'bg-red-300', glow: '' }
        : isSelected
            ? { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', chair: 'bg-blue-400', glow: 'ring-4 ring-blue-300 ring-opacity-60 animate-pulse-ring' }
            : { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', chair: 'bg-emerald-300', glow: '' };

    return (
        <div
            className={`relative flex flex-col items-center group ${!isOccupied ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
            onClick={() => !isOccupied && onSelect && onSelect(table)}
            style={{ width: 120, height: 120 }}
        >
            {/* Chairs */}
            {chairPositions.map((pos, i) => (
                <div
                    key={i}
                    className={`absolute w-4 h-4 rounded-full ${statusColor.chair} border-2 border-white shadow-sm transition-all duration-300 ${!isOccupied ? 'group-hover:scale-110' : ''}`}
                    style={{
                        left: `calc(50% + ${pos.x}px - 8px)`,
                        top: `calc(50% + ${pos.y}px - 8px)`,
                    }}
                />
            ))}

            {/* Table circle */}
            <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full ${statusColor.bg} border-2 ${statusColor.border} ${statusColor.glow} flex flex-col items-center justify-center shadow-md transition-all duration-300 ${!isOccupied ? 'group-hover:scale-105 group-hover:shadow-lg' : ''}`}
            >
                <span className={`text-sm font-bold ${statusColor.text}`}>{table.table_number}</span>
                <span className={`text-[9px] font-medium ${statusColor.text} opacity-70`}>{seats} seats</span>
            </div>

            {/* Floating tooltip on hover */}
            {!isOccupied && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg pointer-events-none z-10">
                    Click to select
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
}

export default function CustomerTablePage() {
    const [viewMode, setViewMode] = useState('floor'); // 'floor', 'map', or 'grid'
    const [selectedTable, setSelectedTable] = useState(null);

    const { data: tables = [], isLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const res = await api.get('/tables/');
            return res.data;
        },
        refetchInterval: 5000
    });

    if (isLoading) return <div className="text-center py-20">Loading tables...</div>;

    const availableCount = tables.filter(t => !t.is_occupied).length;
    const occupiedCount = tables.filter(t => t.is_occupied).length;
    const floorTables = tables.filter(t => t.floor === 0);

    const handleTableSelect = (table) => {
        setSelectedTable(prev => prev?.id === table.id ? null : table);
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
                        onClick={() => setViewMode('floor')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${viewMode === 'floor' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <UtensilsCrossed className="w-4 h-4" />
                        Floor Plan
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Map className="w-4 h-4" />
                        Grid Map
                    </button>
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
                            <p className="font-bold text-gray-800">Table {selectedTable.table_number} Selected</p>
                            <p className="text-sm text-gray-600">
                                {selectedTable.table_size} seats • Available
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedTable(null)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* FLOOR PLAN VIEW */}
            {viewMode === 'floor' && (
                <div className="bg-black rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Floor plan area */}
                    <div className="relative p-8 min-h-[500px] bg-gradient-to-br from-gray-50 to-dark">
                        {/* Decorative walls */}
                        <div className="absolute inset-4 border-2 border-gray-200 rounded-xl pointer-events-none"></div>

                        {/* Kitchen area */}
                        <div className="absolute top-6 right-6 w-50 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center pointer-events-none">
                            <ChefHat className="w-15 h-15 text-gray-400" />
                            <span className="text-[10px] font-medium text-gray-400 mt-1">KITCHEN</span>
                        </div>

                        {/* Entrance */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                            <DoorOpen className="w-10 h-10 text-gray-400" />
                            <span className="text-[10px] font-medium text-gray-400 mt-0.5">ENTRANCE</span>
                        </div>

                        {/* Plant decorations */}
                        <div className="absolute top-8 left-8 flex items-center gap-1 pointer-events-none opacity-40">
                            <Flower2 className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="absolute bottom-20 right-8 flex items-center gap-1 pointer-events-none opacity-40">
                            <Flower2 className="w-4 h-4 text-green-500" />
                        </div>

                        {/* Tables positioned on the floor plan */}
                        <div className="relative flex flex-wrap gap-6 justify-center items-center pt-8 pb-16 px-8 min-h-[400px]">
                            {floorTables.map(table => (
                                <TableTop
                                    key={table.id}
                                    table={table}
                                    isSelected={selectedTable?.id === table.id}
                                    onSelect={handleTableSelect}
                                />
                            ))}
                            {floorTables.length === 0 && (
                                <p className="text-gray-400 text-center py-20">No tables on this floor</p>
                            )}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-6 justify-center items-center">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-300 border-2 border-white shadow"></span>
                            <span className="text-sm font-medium text-gray-600">Available — Click to select</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-red-300 border-2 border-white shadow"></span>
                            <span className="text-sm font-medium text-gray-600">Occupied</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow ring-2 ring-blue-200"></span>
                            <span className="text-sm font-medium text-gray-600">Selected</span>
                        </div>
                    </div>
                </div>
            )}

            {/* GRID MAP VIEW (existing MapLayout) */}
            {viewMode === 'map' && (
                <MapLayout
                    tables={tables}
                    onTableSelect={handleTableSelect}
                    selectedTableId={selectedTable?.id}
                />
            )}

            {/* GRID/LIST VIEW */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tables.map(table => (
                        <div
                            key={table.id}
                            onClick={() => !table.is_occupied && handleTableSelect(table)}
                            className={`rounded-2xl border-2 p-6 flex flex-col items-center justify-center space-y-3 transition-all ${
                                selectedTable?.id === table.id
                                    ? 'bg-blue-50 border-blue-400 shadow-lg shadow-blue-100 ring-2 ring-blue-200'
                                    : table.is_occupied
                                        ? 'bg-red-50 border-red-100 opacity-70 cursor-not-allowed'
                                        : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 cursor-pointer'
                            }`}
                        >
                            <div className={`p-4 rounded-full ${
                                selectedTable?.id === table.id
                                    ? 'bg-blue-100 text-blue-600'
                                    : table.is_occupied
                                        ? 'bg-gray-200 text-gray-500'
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
                                selectedTable?.id === table.id
                                    ? 'bg-blue-100 text-blue-600'
                                    : table.is_occupied
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                {selectedTable?.id === table.id ? 'Selected' : table.is_occupied ? 'Occupied' : 'Free'}
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
