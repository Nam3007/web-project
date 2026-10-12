import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, History, LogOut, UtensilsCrossed, TableProperties, ReceiptText, MapPin, Phone, Instagram, Facebook, User, Ticket } from 'lucide-react';
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
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-40 z-0"></div>

            {/* Navbar */}
            <nav className="bg-white/80 backdrop-blur-xl border-b rounded-xl border-emerald-100/50 sticky top-0 z-50 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-8">
                            <Link to="/menu" className="flex items-center gap-3 group">
                                <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <UtensilsCrossed className="w-6 h-6 relative z-10" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tight font-serif">Restaurant</h1>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700/60 font-semibold mt-0.5">Restaurant</p>
                                </div>
                            </Link>

                            <div className="hidden md:flex items-center gap-2 rounded-full bg-slate-100/60 p-1.5 border border-slate-200/50">
                                <NavLink to="/menu" current={location.pathname}>Menu</NavLink>
                                <NavLink to="/reservations" current={location.pathname}>Reservations</NavLink>
                                {user && (
                                    <>
                                        
                                        <NavLink to="/tables" current={location.pathname}>Tables</NavLink>
                                        <NavLink to="/active-orders" current={location.pathname}>Live Orders</NavLink>
                                        <NavLink to="/orders" current={location.pathname}>History</NavLink>
                                        <NavLink to="/profile" current={location.pathname}>Coupons & Profile</NavLink>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {user && (
                                <>
                                    <Link to="/cart" className="relative group p-2.5">
                                        <div className="absolute inset-0 bg-emerald-50 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-200 origin-center"></div>
                                        <ShoppingBag className="h-5 w-5 text-slate-600 group-hover:text-primary relative z-10 transition-colors" />
                                        {cartCount > 0 && (
                                            <span className="absolute 0 top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-[11px] font-bold text-white shadow-md shadow-accent/40 z-20 border-2 border-white animate-bounce-slow">
                                                {cartCount}
                                            </span>
                                        )}
                                    </Link>
                                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                                </>
                            )}

                            {user ? (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-primary border border-emerald-200/60 font-semibold text-xs sm:text-sm transition-all hover:shadow-sm group"
                                        title="View Available Coupons & Profile"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span className="font-medium truncate max-w-[140px]">{user.full_name}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-rose-50 hover:text-rose-500"
                                        title="Sign Out"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200/50 transition-all hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0">
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Premium Page Banner */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
                <div
                    className="relative overflow-hidden rounded-[2rem] shadow-sm border border-emerald-50 p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 group bg-white bg-cover bg-center"
                    style={pageMeta.backgroundImage ? { backgroundImage: `url(${pageMeta.backgroundImage})` } : undefined}
                >
                    {pageMeta.backgroundImage ? (
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10"></div>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent"></div>
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-700"></div>
                        </>
                    )}

                    <div className="relative z-10 max-w-2xl">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border ${pageMeta.backgroundImage ? 'bg-white/10 border-white/20 text-white' : 'bg-emerald-100/50 border-emerald-200/50 text-emerald-800'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-soft"></span>
                            {pageMeta.kicker}
                        </div>
                        <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight font-serif ${pageMeta.backgroundImage ? 'text-white' : 'text-slate-900'}`}>{pageMeta.title}</h1>
                        <p className={`mt-3 leading-relaxed max-w-lg ${pageMeta.backgroundImage ? 'text-white/80' : 'text-slate-500'}`}>{pageMeta.description}</p>
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-2">
                        {pageMeta.badges.map((badge, idx) => (
                            <span key={badge} className={`rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm border ${idx === 0 ? 'bg-primary text-white border-primary shadow-emerald-200' : pageMeta.backgroundImage ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200 transition-colors'}`}>
                                {badge}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12 relative z-10">
                <Outlet />
            </main>

            {/* Medium Footer */}
            <footer className="bg-slate-900 text-slate-300 relative overflow-hidden z-10 border-t-4 border-primary mt-auto">
                <div className="absolute inset-0 vietnam-pattern opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        <div className="text-center md:text-left space-y-4">
                            <h2 className="text-2xl font-serif font-bold text-white tracking-wide">Restaurant</h2>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto md:mx-0 leading-relaxed">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto rerum esse maxime exercitationem, assumenda quibusdam similique numquam repellat beatae ullam, aliquam libero expedita iste dolore. Corporis molestias harum voluptatibus laboriosam.
                            </p>
                        </div>
                        <div className="flex flex-col items-center space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-accent" />
                                <span>Address</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-accent" />
                                <span>+84 123 456 789</span>
                            </div>
                            <div className="flex gap-4 mt-2">
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors text-white">
                                    <Instagram className="w-4 h-4" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors text-white">
                                    <Facebook className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <div className="inline-flex flex-col gap-2">
                                <Link to="/menu" className="text-sm hover:text-white transition-colors">Browse Menu</Link>
                                <Link to="/tables" className="text-sm hover:text-white transition-colors">Reserve Table</Link>
                                <Link to="/orders" className="text-sm hover:text-white transition-colors">Order History</Link>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p>© {new Date().getFullYear()} Restaurant. All rights reserved.</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Mobile Nav Bottom */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] flex justify-around p-3 pb-safe z-50">
                <MobileNavLink to="/menu" icon={UtensilsCrossed} label="Menu" current={location.pathname} />
                {user && (
                    <>
                        <MobileNavLink to="/profile" icon={Ticket} label="Coupons" current={location.pathname} />
                        <MobileNavLink to="/tables" icon={TableProperties} label="Tables" current={location.pathname} />
                        <MobileNavLink to="/cart" icon={ShoppingBag} label="Cart" current={location.pathname} count={cartCount} />
                        <MobileNavLink to="/orders" icon={History} label="History" current={location.pathname} />
                        <MobileNavLink to="/active-orders" icon={ReceiptText} label="Live" current={location.pathname} />
                    </>
                )}
            </div>
        </div>
    );
}

function getPageMeta(pathname, user) {
    if (pathname.startsWith('/profile')) {
        return {
            kicker: 'Member Portal',
            title: 'My Profile & Coupons',
            description: 'Manage your personal account details, update your password, and view your available discount vouchers.',
            badges: ['Discount Coupons', 'Personal Details', 'Security'],
            backgroundImage: '/src/assets/food-apps.jpg',
        };
    }
    if (pathname.startsWith('/reservations')) {
        return {
            kicker: 'Table Booking',
            title: 'Table Reservations',
            description: 'Reserve your dining table in advance with pre-ordered dishes, dedicated staff, and instant table assignments.',
            badges: ['Book Online', 'Pre-order Food', 'VietQR Deposit'],
            backgroundImage: '/src/assets/reservation.jpg',
        };
    }
    if (pathname.startsWith('/tables')) {
        return {
            kicker: 'Dining Setup',
            title: 'Table Selection',
            description: 'Pick an available table before heading to the menu. Secure your spot for a seamless dining experience.',
            badges: ['Select Table', 'View Layout'],
            backgroundImage: '/src/assets/table-hero.jpg',
        };
    }
    if (pathname.startsWith('/cart')) {
        return {
            kicker: 'Review Basket',
            title: 'Your Cart',
            description: 'Review your selections, adjust quantities, and choose your preferred payment method to place your order.',
            badges: ['Checkout', 'QR Payment Available'],
            backgroundImage: '',
        };
    }
    if (pathname.startsWith('/active-orders')) {
        return {
            kicker: 'Live Status',
            title: 'Active Orders',
            description: 'Track your meal from kitchen to table in real-time. View status updates and confirm delivery.',
            badges: ['Track Progress', 'Live Updates'],
            backgroundImage: '/src/assets/kitchen-hero.jpg',
        };
    }
    if (pathname.startsWith('/orders')) {
        return {
            kicker: 'Order History',
            title: 'Past Orders',
            description: 'Review your previous dining experiences, reorder favorites, and manage your VIP status progress.',
            badges: ['History', 'Reorder'],
            backgroundImage: '/src/assets/food-apps.jpg',
        };
    }
    if (pathname.startsWith('/qr-payment')) {
        return {
            kicker: 'Secure Checkout',
            title: 'QR Payment',
            description: 'Complete your order by scanning the VietQR code. Fast, secure, and instant confirmation.',
            badges: ['Scan to Pay', 'Instant Confirm'],
            backgroundImage: '/images/banners/qr-payment-banner.jpg',
        };
    }
    return {
        kicker: 'Welcome Back',
        title: user ? 'Explore Our Menu' : 'Discover Fresh Flavors',
        description: 'Selection of dishes ',
        badges: ['Signatures', 'Fresh Ingredients', 'Add to Cart'],
        backgroundImage: './src/assets/testMenu.jpg',
    };
}

function NavLink({ to, children, current }) {
    const active = current === to;
    return (
        <Link
            to={to}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${active ? 'bg-white text-primary shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
        >
            {children}
        </Link>
    )
}

function MobileNavLink({ to, icon: IconComponent, label, current, count }) {
    const active = current === to;
    return (
        <Link to={to} className={`flex flex-col items-center justify-center gap-1 relative w-16 transition-colors ${active ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
            <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-emerald-50' : ''}`}>
                <IconComponent className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white border-2 border-white">
                        {count}
                    </span>
                )}
            </div>
            <span className={`text-[10px] font-medium transition-all ${active ? 'font-bold' : ''}`}>{label}</span>
        </Link>
    )
}
