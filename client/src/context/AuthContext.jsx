import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout API call failed', error);
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        // Listen for logout events from api interceptor
        const handleLogoutEvent = () => logout();
        window.addEventListener('auth:logout', handleLogoutEvent);

        const initializeAuth = async () => {
            try {
                // Attempt to fetch current user to validate session
                // api.js interceptor will attach token from localStorage if present
                const res = await api.get('/auth/me');

                if (res.data) {
                    // Session is valid
                    setUser(res.data);
                    const storedToken = localStorage.getItem('token');
                    if (storedToken) setToken(storedToken);
                }
            } catch (err) {
                // Session invalid or network error
                console.debug('Session initialization failed:', err.message);
                // If it was a 401, the interceptor already cleared localStorage and fired logout event
                // which cleans up our state.
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        return () => {
            window.removeEventListener('auth:logout', handleLogoutEvent);
        };
    }, []);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
