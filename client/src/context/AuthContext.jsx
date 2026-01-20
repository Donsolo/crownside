import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            // 1. Try LocalStorage first (Fastest)
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');

            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
                setLoading(false);
                return;
            }

            // 2. Fallback: Check Session Cookie (Cross-Subdomain Support)
            // This allows 'queenlashes.thecrownside.com' to be logged in if 'thecrownside.com' has a cookie.
            try {
                // api is configured with includes: credentials (cookies)
                const res = await api.get('/auth/me');
                if (res.data) {
                    console.log('Session hydrated from cookie');
                    // We don't have the raw jwt string here usually, unless endpoint returns it.
                    // But we have the user.
                    // Important: If api.js relies on `token` state for headers, we might be in trouble for *future* requests
                    // UNLESS the backend accepts cookies as fallback (which we implemented).
                    setUser(res.data);
                    // access token might be missing in client state, but cookie handles it.
                }
            } catch (err) {
                // Not logged in or session expired
                // console.debug('No active session found');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
