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
            const fullName = localStorage.getItem('full_name');

            if (token) {
                setUser({ role, id: userId, full_name: fullName });
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });

            console.log("Login response:", response.data);
            const { access_token, role, user_id, full_name } = response.data;

            localStorage.setItem('token', access_token);
            localStorage.setItem('role', role);
            localStorage.setItem('userId', user_id);
            localStorage.setItem('full_name', full_name);

            setUser({ role, id: user_id, full_name: full_name });
            return { success: true, role };
        } catch (error) {
            console.error("Login failed:", error);
            const msg = error.response?.data?.detail || "Login failed. Please check your credentials.";
            return { success: false, message: msg };
        }
    };

    const logout = async () => {
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('userId');

        if (role && userId) {
            const isCustomer = role.includes('customer');
            const endpoint = isCustomer ? `/customers/${userId}/status` : `/staff/${userId}/status`;

            try {
                await api.patch(endpoint, null, {
                    params: { new_status: 'inactive' }
                });
            } catch (error) {
                console.error('Failed to mark user inactive on logout:', error);
            }
        }

        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('full_name');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => useContext(AuthContext);
