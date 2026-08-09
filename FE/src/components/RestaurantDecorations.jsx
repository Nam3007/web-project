/**
 * RestaurantDecorations.jsx
 * Shared decorative components for the customer-facing restaurant theme.
 * Includes SVG ornaments, background patterns, section headings, and layout helpers.
 */

/* ── SVG Ornamental Divider ────────────────────────────────── */
export function OrnamentalDivider({ className = '', color = '#d4a853' }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <svg width="200" height="20" viewBox="0 0 200 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 10 H80 Q85 10 90 5 Q95 0 100 0 Q105 0 110 5 Q115 10 120 10 H200" stroke={color} strokeWidth="1" opacity="0.6" />
                <circle cx="100" cy="10" r="3" fill={color} opacity="0.8" />
                <circle cx="80" cy="10" r="1.5" fill={color} opacity="0.4" />
                <circle cx="120" cy="10" r="1.5" fill={color} opacity="0.4" />
            </svg>
        </div>
    );
}

/* ── Flourish Ornament ─────────────────────────────────────── */
export function FlourishOrnament({ className = '', size = 'md' }) {
    const sizes = { sm: 120, md: 180, lg: 240 };
    const w = sizes[size] || sizes.md;
    return (
        <div className={`flex justify-center ${className}`}>
            <svg width={w} height={w * 0.15} viewBox="0 0 180 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M90 14 C70 14 65 4 40 4 C25 4 15 10 0 10" stroke="#d4a853" strokeWidth="1" fill="none" opacity="0.5" />
                <path d="M90 14 C110 14 115 4 140 4 C155 4 165 10 180 10" stroke="#d4a853" strokeWidth="1" fill="none" opacity="0.5" />
                <path d="M90 14 C70 14 65 24 40 24 C25 24 15 18 0 18" stroke="#d4a853" strokeWidth="1" fill="none" opacity="0.3" />
                <path d="M90 14 C110 14 115 24 140 24 C155 24 165 18 180 18" stroke="#d4a853" strokeWidth="1" fill="none" opacity="0.3" />
                <circle cx="90" cy="14" r="3" fill="#d4a853" opacity="0.7" />
                <circle cx="90" cy="14" r="6" stroke="#d4a853" strokeWidth="0.5" fill="none" opacity="0.3" />
            </svg>
        </div>
    );
}

/* ── Section Heading ───────────────────────────────────────── */
export function SectionHeading({ title, subtitle, className = '', align = 'left', ornament = true }) {
    return (
        <div className={`${align === 'center' ? 'text-center' : ''} ${className}`}>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-r-text tracking-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="mt-1.5 text-r-muted text-sm md:text-base font-sans">
                    {subtitle}
                </p>
            )}
            {ornament && (
                <div className={`mt-3 ${align === 'center' ? 'mx-auto' : ''}`} style={{ maxWidth: 120 }}>
                    <div className="h-[2px] bg-gradient-to-r from-r-gold via-r-gold-light to-transparent rounded-full" />
                </div>
            )}
        </div>
    );
}

/* ── Page Hero Section ─────────────────────────────────────── */
export function PageHero({ title, subtitle, icon: Icon, accentWord, children, pattern = 'none' }) {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-r-dark via-r-wood to-r-warm rounded-2xl md:rounded-3xl shadow-xl grain-overlay">
            {/* Warm glow effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-72 h-72 bg-r-gold/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-amber-700/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
            </div>

            {/* Optional SVG background pattern */}
            {pattern !== 'none' && (
                <div className="absolute inset-0 opacity-[0.03]">
                    <BackgroundPattern type={pattern} />
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {Icon && (
                            <div className="w-12 h-12 bg-r-gold/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-r-gold/20">
                                <Icon className="w-6 h-6 text-r-gold" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-r-cream tracking-tight">
                                {accentWord ? (
                                    <>
                                        {title.split(accentWord)[0]}
                                        <span className="text-r-gold">{accentWord}</span>
                                        {title.split(accentWord)[1] || ''}
                                    </>
                                ) : title}
                            </h1>
                            {subtitle && (
                                <p className="text-sm text-r-gold-light/60 mt-1 font-sans">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {children}
                </div>
                <FlourishOrnament className="mt-4 opacity-50" size="sm" />
            </div>
        </div>
    );
}

/* ── Background Pattern Generator ──────────────────────────── */
export function BackgroundPattern({ type = 'utensils' }) {
    const patterns = {
        utensils: (
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="utensils-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        {/* Fork */}
                        <path d="M15 5 L15 25 M12 5 L12 15 M18 5 L18 15" stroke="#d4a853" strokeWidth="1" fill="none" />
                        {/* Knife */}
                        <path d="M45 5 L45 25 M42 5 Q45 15 45 25" stroke="#d4a853" strokeWidth="1" fill="none" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#utensils-pattern)" />
            </svg>
        ),
        tables: (
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="tables-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                        {/* Table top */}
                        <rect x="20" y="30" width="40" height="3" rx="1.5" stroke="#d4a853" strokeWidth="0.8" fill="none" />
                        {/* Legs */}
                        <path d="M25 33 L22 50 M55 33 L58 50" stroke="#d4a853" strokeWidth="0.8" fill="none" />
                        {/* Chair */}
                        <rect x="35" y="55" width="10" height="15" rx="2" stroke="#d4a853" strokeWidth="0.6" fill="none" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#tables-pattern)" />
            </svg>
        ),
        dots: (
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="dots-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                        <circle cx="15" cy="15" r="1" fill="#d4a853" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots-pattern)" />
            </svg>
        ),
    };

    return patterns[type] || patterns.dots;
}

/* ── Warm Page Wrapper ─────────────────────────────────────── */
export function WarmPageWrapper({ children, pattern = 'none' }) {
    return (
        <div className="relative min-h-[60vh]">
            {/* Subtle background pattern */}
            {pattern !== 'none' && (
                <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0">
                    <BackgroundPattern type={pattern} />
                </div>
            )}
            {/* Warm radial glow */}
            <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-r-gold/5 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

/* ── Warm Card Wrapper ─────────────────────────────────────── */
export function WarmCard({ children, className = '', hover = true, padding = true }) {
    return (
        <div className={`
            bg-white/80 backdrop-blur-sm rounded-2xl border border-r-border/60 shadow-sm
            ${hover ? 'hover:shadow-lg hover:border-r-gold/30 hover:shadow-r-gold/5 transition-all duration-300' : ''}
            ${padding ? 'p-5 sm:p-6' : ''}
            ${className}
        `}>
            {children}
        </div>
    );
}

/* ── Gold Button ───────────────────────────────────────────── */
export function GoldButton({ children, onClick, disabled, className = '', variant = 'solid', type = 'button' }) {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-sans font-bold rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        solid: 'bg-gradient-to-r from-r-gold to-r-gold-light text-r-dark hover:from-r-gold-light hover:to-r-gold shadow-lg shadow-r-gold/20',
        outline: 'border-2 border-r-gold text-r-gold hover:bg-r-gold/10',
        dark: 'bg-gradient-to-r from-r-dark to-r-wood text-r-cream hover:from-r-wood hover:to-r-warm border border-r-gold/20',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variants[variant] || variants.solid} ${className}`}
        >
            {children}
        </button>
    );
}

/* ── Status Badge (warm palette) ───────────────────────────── */
export function WarmStatusBadge({ status, label }) {
    const styles = {
        pending:              'bg-amber-50 text-amber-700 border-amber-200',
        pending_confirmation: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
        confirmed:            'bg-emerald-50 text-emerald-700 border-emerald-200',
        paid:                 'bg-green-50 text-green-700 border-green-200',
        queued:               'bg-sky-50 text-sky-700 border-sky-200',
        preparing:            'bg-orange-50 text-orange-800 border-orange-200',
        ready:                'bg-violet-50 text-violet-700 border-violet-200',
        served:               'bg-purple-50 text-purple-700 border-purple-200',
        delivering:           'bg-cyan-50 text-cyan-700 border-cyan-200',
        delivered:            'bg-teal-50 text-teal-700 border-teal-200',
        completed:            'bg-green-50 text-green-700 border-green-200',
        cancelled:            'bg-red-50 text-red-600 border-red-200',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold font-sans rounded-lg border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {label || status}
        </span>
    );
}

/* ── Empty State ───────────────────────────────────────────── */
export function WarmEmptyState({ icon: Icon, title, subtitle, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-r-border/40">
            {Icon && (
                <div className="w-20 h-20 bg-r-cream rounded-full flex items-center justify-center mb-5 border border-r-border/40">
                    <Icon className="w-10 h-10 text-r-muted/40" />
                </div>
            )}
            <h2 className="text-lg font-serif font-bold text-r-text mb-1">{title}</h2>
            {subtitle && <p className="text-sm text-r-muted mb-6 font-sans">{subtitle}</p>}
            {action}
        </div>
    );
}
