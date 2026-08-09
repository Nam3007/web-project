import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, History, LogOut, UtensilsCrossed, ClipboardList, TableProperties, ReceiptText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function CustomerLayout() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const location = useLocation();
    const navigate = useNavigate();
    const pageMeta = getPageMeta(location.pathname, user);

    const handleLogout = async () => {
        await logout();
        navigate('/menu');
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f8f4ec] text-slate-900">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
                <div className="absolute top-40 left-[-5rem] h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
                <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-orange-200/25 blur-3xl" />
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-18 items-center justify-between gap-4 py-3">
                        <div className="flex items-center gap-6">
                            <Link to="/menu" className="flex items-center gap-3">
                                <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 p-2.5 text-white shadow-lg shadow-emerald-200/60">
                                    <UtensilsCrossed className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="block text-lg font-semibold tracking-tight text-slate-900">River Side</span>
                                    <span className="block text-[11px] uppercase tracking-[0.24em] text-slate-400">Restaurant Experience</span>
                                </div>
                            </Link>

                            <div className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100/80 p-1.5">
                                <NavLink to="/menu" current={location.pathname}>Menu</NavLink>
                                {user && (
                                    <>
                                        <NavLink to="/tables" current={location.pathname}>Tables</NavLink>
                                        <NavLink to="/active-orders" current={location.pathname}>Live Orders</NavLink>
                                        <NavLink to="/orders" current={location.pathname}>History</NavLink>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {user && (
                                <>
                                    <Link to="/cart" className="relative rounded-2xl border border-transparent bg-white/90 p-2.5 text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:text-emerald-600">
                                        <ShoppingBag className="h-5 w-5" />
                                        {cartCount > 0 && (
                                            <span className="absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-lg shadow-rose-200">
                                                {cartCount}
                                            </span>
                                        )}
                                    </Link>

                                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                </>
                            )}

                            {user ? (
                                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-2">
                                    <div className="hidden md:block text-right">
                                        <p className="text-xs font-semibold text-emerald-700">{user.full_name}</p>
                                        <p className="text-[11px] text-emerald-600/70">Welcome back</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-rose-500"
                                        title="Sign Out"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700">
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 px-5 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/8 via-white/0 to-amber-500/8" />
                    <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700/80">{pageMeta.kicker}</p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{pageMeta.title}</h1>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{pageMeta.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                            {pageMeta.badges.map((badge) => (
                                <span key={badge} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="relative z-10 flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Outlet />
            </main>

            {/* Mobile Nav Bottom */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/70 bg-white/90 px-3 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl pb-safe">
                <div className="flex justify-around gap-2">
                <MobileNavLink to="/menu" icon={UtensilsCrossed} label="Menu" current={location.pathname} />
                {user && (
                    <>
                        <MobileNavLink to="/tables" icon={TableProperties} label="Tables" current={location.pathname} />
                        <MobileNavLink to="/cart" icon={ShoppingBag} label="Cart" current={location.pathname} count={cartCount} />
                        <MobileNavLink to="/orders" icon={History} label="History" current={location.pathname} />
                        <MobileNavLink to="/active-orders" icon={ReceiptText} label="Live" current={location.pathname} />
                        <button onClick={handleLogout} className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500">
                            <LogOut className="h-5 w-5" />
                            <span className="text-[10px] font-medium">Logout</span>
                        </button>
                    </>
                )}
                </div>
            </div>
        </div>
    );
}

function getPageMeta(pathname, user) {
    if (pathname.startsWith('/tables')) {
        return {
            kicker: 'Choose your seat',
            title: 'Table Selection',
            description: 'Pick an available table before heading to the menu. If you already have an active order, the selection stays locked to protect your order flow.',
            badges: ['Select table', 'See availability', 'Continue to menu'],
        };
    }

    if (pathname.startsWith('/cart')) {
        return {
            kicker: 'Review your basket',
            title: 'Your Cart',
            description: 'Check the dishes you picked, adjust quantities, choose how you want to pay, and place the order when you are ready.',
            badges: ['Edit items', 'Choose payment', 'Checkout'],
        };
    }

    if (pathname.startsWith('/active-orders')) {
        return {
            kicker: 'Live status',
            title: 'Active Orders',
            description: 'Track what is being prepared right now, confirm delivery when needed, and rate items after the meal is complete.',
            badges: ['Track progress', 'Confirm delivery', 'Rate items'],
        };
    }

    if (pathname.startsWith('/orders')) {
        return {
            kicker: 'Order history',
            title: 'Past Orders',
            description: 'Review previous visits, payment methods, and order totals at a glance so returning to a favorite meal is easy.',
            badges: ['History','Reorder context'],
        };
    }

    return {
        kicker: 'Welcome',
        title: user ? 'Browse the Menu' : 'Explore the Menu',
        description: 'Discover dishes, search by name, and build your cart from a warm restaurant-style menu experience.',
        badges: ['Browse dishes', 'Search dishes by name', 'Add to cart'],
    };
}

function NavLink({ to, children, current }) {
    const active = current === to;
    return (
        <Link
            to={to}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${active ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                }`}
        >
            {children}
        </Link>
    )
}

// eslint-disable-next-line no-unused-vars
function MobileNavLink({ to, icon: IconComponent, label, current, count }) {
    const active = current === to;
    return (
        <Link to={to} className={`flex flex-col items-center justify-center gap-1 relative rounded-xl px-2 py-1.5 ${active ? 'text-emerald-700' : 'text-slate-400'}`}>
            <div className="relative">
                <IconComponent className="w-6 h-6" />
                {count > 0 && (
                    <span className="absolute -top-1 -right-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        {count}
                    </span>
                )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    )
}
