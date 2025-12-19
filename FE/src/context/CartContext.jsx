import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    // Load initial cart from localStorage if available
    const [cart, setCart] = useState(() => {
        try {
            const stored = localStorage.getItem('customer_cart');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Sync to localStorage
    useEffect(() => {
        localStorage.setItem('customer_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, quantity = 1, notes = '') => {
        setCart(prev => {
            const existing = prev.find(i => i.item.id === item.id && i.notes === notes);
            if (existing) {
                return prev.map(i =>
                    (i.item.id === item.id && i.notes === notes)
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                );
            }
            return [...prev, { item, quantity, notes }];
        });
    };

    const updateQuantity = (itemId, delta) => {
        setCart(prev => prev.map(i => {
            if (i.item.id === itemId) {
                const newQty = i.quantity + delta;
                return newQty > 0 ? { ...i, quantity: newQty } : i;
            }
            return i;
        }));
    };

    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(i => i.item.id !== itemId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartTotal = cart.reduce((sum, i) => sum + (i.item.item_price * i.quantity), 0);
    const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            cartTotal,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
}
