import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Users, UtensilsCrossed } from 'lucide-react';

export default function CustomerTablePage() {
    const { data: tables = [], isLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const res = await api.get('/tables/');
            return res.data;
        },
        refetchInterval: 10000 // Auto-refresh to see availability
    });

    if (isLoading) return <div className="text-center py-20">Loading tables...</div>;

    const availableCount = tables.filter(t => !t.is_occupied).length;

    return (
        <div className="space-y-6">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-800">Table Availability</h1>
                <p className="text-gray-500 mt-2">Check which tables are free before you sit down.</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full font-medium text-sm border border-green-100">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {availableCount} tables currently available
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {tables.map(table => (
                    <div
                        key={table.id}
                        className={`rounded-2xl border-2 p-6 flex flex-col items-center justify-center space-y-3 transition-all ${table.is_occupied
                                ? 'bg-red-50 border-red-100 opacity-80 grayscale-[0.5]'
                                : 'bg-white border-green-100 shadow-sm'
                            }`}
                    >
                        <div className={`p-4 rounded-full ${table.is_occupied ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-600'}`}>
                            <UtensilsCrossed className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{table.table_number}</h3>

                        <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium bg-white/50 px-3 py-1 rounded-full border border-gray-100">
                            <Users className="w-4 h-4" />
                            <span>{table.table_size} Seats</span>
                        </div>

                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${table.is_occupied ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                            {table.is_occupied ? 'Occupied' : 'Free'}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4 items-start">
                <div className="bg-white p-2 rounded-lg text-blue-600 shrink-0">
                    <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900">How to Order?</h3>
                    <p className="text-blue-700 text-sm mt-1">
                        Once you find a free table, please take a seat and note your table number.
                        You can place an order at the counter or wait for a staff member.
                        (In a future update, you'll be able to order directly from here!)
                    </p>
                </div>
            </div>
        </div>
    );
}
