import { useState } from 'react';
import tableAvailable from '../assets/table-available.png';
import tableInUse from '../assets/table-inuse.png';
import tableReserved from '../assets/table-reserved.png';
import { Grid3x3 } from 'lucide-react';

/**
 * Grid-Based Restaurant Floor Map Component
 * Displays tables in a grid layout based on their posX, posY coordinates
 * Shows only tables from floor 0
 */
export default function MapLayout({ tables = [], onTableSelect, selectedTableId, floor = 0 }) {
    // Grid size (20x20 as per user requirement)
    const GRID_SIZE = 20;

    // Border toggle state
    const [showBorders, setShowBorders] = useState(true);

    // Filter tables for the current floor
    const floorTables = tables.filter(t => t.floor === floor);

    const getTableStatus = (table) => {
        if (table.is_occupied) return 'occupied';
        return 'available';
    };

    const getTableIcon = (status) => {
        switch (status) {
            case 'occupied':
                return tableInUse;
            case 'reserved':
                return tableReserved;
            default:
                return tableAvailable;
        }
    };

    const handleTableClick = (table) => {
        if (!table.is_occupied && onTableSelect) {
            onTableSelect(table);
        }
    };

    // Create grid cells
    const renderGrid = () => {
        const cells = [];

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // Find table at this position
                const tableAtPos = floorTables.find(t => t.posX === x && t.posY === y);

                cells.push(
                    <div
                        key={`${x}-${y}`}
                        className={`relative flex items-center justify-center ${showBorders ? 'border border-gray-300' : ''
                            }`}
                        style={{
                            gridColumn: x + 1,
                            gridRow: y + 1,
                            aspectRatio: '1/1'
                        }}
                    >
                        {tableAtPos && (
                            <div
                                className={`w-full h-full flex items-center justify-center p-1 ${!tableAtPos.is_occupied && onTableSelect
                                    ? 'cursor-pointer hover:bg-blue-50'
                                    : 'cursor-not-allowed'
                                    } transition-all duration-200 ${tableAtPos.id === selectedTableId
                                        ? 'bg-blue-100 ring-2 ring-blue-500 z-10'
                                        : ''
                                    }`}
                                onClick={() => handleTableClick(tableAtPos)}
                            >
                                <div className="relative w-full h-full flex flex-col items-center justify-center">
                                    {/* Table Icon */}
                                    <img
                                        src={getTableIcon(getTableStatus(tableAtPos))}
                                        alt={`Table ${tableAtPos.table_number}`}
                                        className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md"
                                    />

                                    {/* Table Number */}
                                    <div className={`text-[8px] md:text-xs font-bold mt-0.5 px-1 rounded ${tableAtPos.is_occupied
                                        ? 'bg-red-100 text-red-700'
                                        : tableAtPos.id === selectedTableId
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                        {tableAtPos.table_number}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
        }

        return cells;
    };

    return (
        <div className="w-full bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
            {/* Floor Header */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 text-center">
                            Floor {floor} - Table Map
                        </h3>
                        <p className="text-xs text-gray-600 text-center mt-1">
                            Grid Size: {GRID_SIZE} × {GRID_SIZE} | Tables: {floorTables.length}
                        </p>
                    </div>

                    {/* Border Toggle Button */}
                    <button
                        onClick={() => setShowBorders(!showBorders)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${showBorders
                                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                            }`}
                        title={showBorders ? 'Hide grid borders' : 'Show grid borders'}
                    >
                        <Grid3x3 className="w-4 h-4" />
                        <span className="hidden sm:inline">
                            {showBorders ? 'Hide' : 'Show'} Grid
                        </span>
                    </button>
                </div>
            </div>

            {/* Grid Container */}
            <div className="p-4 overflow-auto">
                <div
                    className="grid gap-0 mx-auto"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                        maxWidth: '800px',
                        aspectRatio: '1/1'
                    }}
                >
                    {renderGrid()}
                </div>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-50 border-t-2 border-gray-200">
                <div className="flex flex-wrap gap-4 justify-center text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                        <img src={tableAvailable} alt="Available" className="w-6 h-6" />
                        <span className="font-medium text-gray-700">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <img src={tableInUse} alt="Occupied" className="w-6 h-6" />
                        <span className="font-medium text-gray-700">Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <img src={tableReserved} alt="Reserved" className="w-6 h-6" />
                        <span className="font-medium text-gray-700">Reserved</span>
                    </div>
                </div>
                {onTableSelect && (
                    <p className="text-center text-gray-500 text-xs mt-3">
                        💡 Click on an available table to select it
                    </p>
                )}
            </div>
        </div>
    );
}
