import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');
            const userId = localStorage.getItem('userId');

            if (token) {
                // In a real app, you might validate the token with backend here
                setUser({ role, id: userId });
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (username, password) => {
        try {
            // Adjusted based on backend response: access_token, user_id, role
            const response = await api.post('/auth/login', { username, password });

            console.log("Login response:", response.data);

            const { access_token, role, user_id } = response.data;

            localStorage.setItem('token', access_token);
            localStorage.setItem('role', role);
            localStorage.setItem('userId', user_id);

            setUser({ role, id: user_id });
            return { success: true, role };
        } catch (error) {
            console.error("Login failed:", error);
            const msg = error.response?.data?.detail || "Login failed. Please check your credentials.";
            return { success: false, message: msg };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
