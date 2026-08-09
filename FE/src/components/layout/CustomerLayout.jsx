import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, History, LogOut, UtensilsCrossed, ClipboardList, Menu, X, Phone, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { OrnamentalDivider } from '../RestaurantDecorations';

export default function CustomerLayout() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/menu');
    };

    return (
        <div className="min-h-screen bg-r-ivory flex flex-col font-sans">
            {/* ── Navbar ────────────────────────────────────────── */}
            <nav className="bg-r-dark/95 backdrop-blur-md border-b border-r-gold/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 md:h-18">
                        {/* Left: Logo + Nav */}
                        <div className="flex items-center gap-6 lg:gap-10">
                            <Link to="/menu" className="flex items-center gap-3 group">
                                <div className="w-9 h-9 bg-r-gold/15 rounded-xl flex items-center justify-center border border-r-gold/25 group-hover:bg-r-gold/25 transition-colors">
                                    <UtensilsCrossed className="w-5 h-5 text-r-gold" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-serif font-bold text-r-cream tracking-tight leading-tight">
                                        River <span className="text-r-gold">Side</span>
                                    </span>
                                    <span className="text-[9px] text-r-gold/40 uppercase tracking-[0.2em] font-sans font-medium leading-tight hidden sm:block">
                                        Fine Dining
                                    </span>
                                </div>
                            </Link>

                            <div className="hidden md:flex items-center gap-1">
                                <DesktopNavLink to="/menu" current={location.pathname}>Menu</DesktopNavLink>
                                {user && (
                                    <>
                                        <DesktopNavLink to="/tables" current={location.pathname}>Tables</DesktopNavLink>
                                        <DesktopNavLink to="/active-orders" current={location.pathname}>My Orders</DesktopNavLink>
                                        <DesktopNavLink to="/orders" current={location.pathname}>History</DesktopNavLink>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: Cart + User */}
                        <div className="flex items-center gap-3">
                            {user && (
                                <>
                                    <Link
                                        to="/cart"
                                        className="relative p-2.5 text-r-cream/60 hover:text-r-gold transition-colors rounded-xl hover:bg-r-gold/10"
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        {cartCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-r-dark bg-r-gold rounded-full shadow-md shadow-r-gold/30">
                                                {cartCount}
                                            </span>
                                        )}
                                    </Link>

                                    <div className="h-5 w-px bg-r-gold/15 mx-1 hidden md:block" />
                                </>
                            )}

                            {user ? (
                                <div className="hidden md:flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-r-gold font-sans">{user.full_name}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-r-cream/40 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                                        title="Sign Out"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="hidden md:inline-flex text-sm font-bold text-r-gold hover:text-r-gold-light transition-colors px-4 py-2 rounded-xl border border-r-gold/30 hover:bg-r-gold/10"
                                >
                                    Sign In
                                </Link>
                            )}

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-r-cream/60 hover:text-r-gold transition-colors"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-r-dark/98 border-t border-r-gold/10 animate-fade-in">
                        <div className="px-4 py-4 space-y-1">
                            <MobileMenuLink to="/menu" current={location.pathname} onClick={() => setMobileMenuOpen(false)}>Menu</MobileMenuLink>
                            {user && (
                                <>
                                    <MobileMenuLink to="/tables" current={location.pathname} onClick={() => setMobileMenuOpen(false)}>Tables</MobileMenuLink>
                                    <MobileMenuLink to="/cart" current={location.pathname} onClick={() => setMobileMenuOpen(false)}>
                                        Cart {cartCount > 0 && <span className="ml-2 bg-r-gold text-r-dark text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartCount}</span>}
                                    </MobileMenuLink>
                                    <MobileMenuLink to="/active-orders" current={location.pathname} onClick={() => setMobileMenuOpen(false)}>My Orders</MobileMenuLink>
                                    <MobileMenuLink to="/orders" current={location.pathname} onClick={() => setMobileMenuOpen(false)}>History</MobileMenuLink>
                                </>
                            )}
                            <div className="pt-3 mt-3 border-t border-r-gold/10">
                                {user ? (
                                    <button
                                        onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                ) : (
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block text-center px-4 py-2.5 bg-r-gold/10 text-r-gold font-bold rounded-xl text-sm border border-r-gold/20"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* ── Main Content ──────────────────────────────────── */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
                <Outlet />
            </main>

            {/* ── Footer ────────────────────────────────────────── */}
            <footer className="bg-r-dark text-r-cream/80 mt-auto">
                {/* Gold ornamental divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-r-gold/40 to-transparent" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
                        {/* Column 1: Branding */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-r-gold/15 rounded-xl flex items-center justify-center border border-r-gold/20">
                                    <UtensilsCrossed className="w-5 h-5 text-r-gold" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-r-cream">
                                        River <span className="text-r-gold">Side</span>
                                    </h3>
                                </div>
                            </div>
                            <p className="text-sm text-r-cream/50 leading-relaxed font-sans max-w-xs">
                                Experience culinary excellence with fresh ingredients and masterful recipes.
                                A fine dining destination for unforgettable moments.
                            </p>
                            <OrnamentalDivider className="mt-5 opacity-40" />
                        </div>

                        {/* Column 2: Contact */}
                        <div>
                            <h4 className="text-sm font-bold text-r-gold uppercase tracking-wider font-sans mb-4">
                                Visit Us
                            </h4>
                            <div className="space-y-3 text-sm font-sans">
                                <div className="flex items-start gap-3 text-r-cream/60">
                                    <MapPin className="w-4 h-4 text-r-gold/60 mt-0.5 shrink-0" />
                                    <span>123 Riverside Boulevard<br />District 1, Ho Chi Minh City</span>
                                </div>
                                <div className="flex items-center gap-3 text-r-cream/60">
                                    <Phone className="w-4 h-4 text-r-gold/60 shrink-0" />
                                    <span>+84 28 1234 5678</span>
                                </div>
                                <div className="flex items-start gap-3 text-r-cream/60">
                                    <Clock className="w-4 h-4 text-r-gold/60 mt-0.5 shrink-0" />
                                    <div>
                                        <p>Mon – Fri: 11:00 – 22:00</p>
                                        <p>Sat – Sun: 10:00 – 23:00</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Quick Links */}
                        <div>
                            <h4 className="text-sm font-bold text-r-gold uppercase tracking-wider font-sans mb-4">
                                Quick Links
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm font-sans">
                                <FooterLink to="/menu">Our Menu</FooterLink>
                                <FooterLink to="/tables">Reserve Table</FooterLink>
                                {user && (
                                    <>
                                        <FooterLink to="/cart">Your Cart</FooterLink>
                                        <FooterLink to="/active-orders">Active Orders</FooterLink>
                                        <FooterLink to="/orders">Order History</FooterLink>
                                    </>
                                )}
                                {!user && <FooterLink to="/login">Sign In</FooterLink>}
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="mt-10 pt-6 border-t border-r-gold/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-r-cream/30 font-sans">
                        <p>© {new Date().getFullYear()} River Side Restaurant. All rights reserved.</p>
                        <p className="font-serif italic text-r-gold/30">
                            "Where every meal tells a story"
                        </p>
                    </div>
                </div>
            </footer>

            {/* ── Mobile Bottom Nav ─────────────────────────────── */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-r-dark/95 backdrop-blur-md border-t border-r-gold/10 flex justify-around px-2 py-2 z-50 pb-safe">
                <MobileBottomNavLink to="/menu" icon={UtensilsCrossed} label="Menu" current={location.pathname} />
                {user && (
                    <>
                        <MobileBottomNavLink to="/tables" icon={UtensilsCrossed} label="Tables" current={location.pathname} />
                        <MobileBottomNavLink to="/cart" icon={ShoppingBag} label="Cart" current={location.pathname} count={cartCount} />
                        <MobileBottomNavLink to="/active-orders" icon={ClipboardList} label="Orders" current={location.pathname} />
                        <MobileBottomNavLink to="/orders" icon={History} label="History" current={location.pathname} />
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Sub-components ────────────────────────────────────────── */

function DesktopNavLink({ to, children, current }) {
    const active = current === to;
    return (
        <Link
            to={to}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium font-sans transition-all duration-200 ${
                active
                    ? 'text-r-gold bg-r-gold/10'
                    : 'text-r-cream/60 hover:text-r-cream hover:bg-white/5'
            }`}
        >
            {children}
            {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-r-gold rounded-full" />
            )}
        </Link>
    );
}

function MobileMenuLink({ to, children, current, onClick }) {
    const active = current === to;
    return (
        <Link
            to={to}
            onClick={onClick}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                    ? 'bg-r-gold/10 text-r-gold'
                    : 'text-r-cream/60 hover:bg-white/5 hover:text-r-cream'
            }`}
        >
            {children}
        </Link>
    );
}

function MobileBottomNavLink({ to, icon: IconComponent, label, current, count }) {
    const active = current === to;
    return (
        <Link to={to} className={`flex flex-col items-center justify-center gap-0.5 relative px-3 py-1 rounded-xl transition-colors ${
            active ? 'text-r-gold' : 'text-r-cream/40'
        }`}>
            <div className="relative">
                <IconComponent className="w-5 h-5" />
                {count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-r-gold text-r-dark text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        {count}
                    </span>
                )}
            </div>
            <span className="text-[10px] font-medium font-sans">{label}</span>
            {active && (
                <span className="absolute -bottom-1.5 w-3 h-0.5 bg-r-gold rounded-full" />
            )}
        </Link>
    );
}

function FooterLink({ to, children }) {
    return (
        <Link
            to={to}
            className="text-r-cream/50 hover:text-r-gold transition-colors py-1 inline-block"
        >
            {children}
        </Link>
    );
}
