import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Users, UtensilsCrossed } from 'lucide-react';

export default function WaiterTableSelection() {
    const navigate = useNavigate();

    // Fetch Tables
    const { data: tables = [], isLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const res = await api.get('/tables/');
            return res.data;
        }
    });

    const handleTableClick = (table) => {
        // If free, start new order. If occupied, view active order (future feature).
        // For now, always go to order entry with table ID
        navigate(`/staff/orders/new?tableId=${table.id}&tableNum=${table.table_number}`);
    };

    if (isLoading) return <div className="text-center p-10">Loading tables...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Select a Table</h1>
                <p className="text-gray-500 text-sm">Choose a table to start an order</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {tables.map(table => (
                    <div
                        key={table.id}
                        onClick={() => handleTableClick(table)}
                        className={`rounded-2xl border-2 p-6 transition-all hover:shadow-md cursor-pointer relative group flex flex-col items-center justify-center space-y-3 ${table.is_occupied
                                ? 'bg-red-50 border-red-200'
                                : 'bg-white border-dashed border-gray-200 hover:border-primary hover:bg-primary/5'
                            }`}
                    >
                        <div className={`p-4 rounded-full ${table.is_occupied ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <UtensilsCrossed className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{table.table_number}</h3>

                        <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium bg-white/50 px-3 py-1 rounded-full">
                            <Users className="w-4 h-4" />
                            <span>{table.table_size} Seats</span>
                        </div>

                        <span className={`absolute top-3 right-3 w-3 h-3 rounded-full ${table.is_occupied ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    </div>
                ))}
            </div>
        </div>
    );
}
