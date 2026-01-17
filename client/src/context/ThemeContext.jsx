import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const { user, token } = useAuth();
    // Default to light, or system preference if implemented later. 
    // Requirement: Light is default for logged out.
    const [theme, setTheme] = useState('light');
    const [isInitialized, setIsInitialized] = useState(false);

    // 1. Load from LocalStorage on mount (for guest/initial load)
    useEffect(() => {
        const storedTheme = localStorage.getItem('themePreference');
        if (storedTheme) {
            setTheme(storedTheme);
        } else {
            // Optional: Check system preference if we want to support it for new users
            /*
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                 setTheme('dark');
            }
            */
            // Requirement says: Light mode must remain the default.
            setTheme('light');
        }
        setIsInitialized(true);
    }, []);

    // 2. Sync with DB when User logs in
    useEffect(() => {
        if (user && user.themePreference) {
            setTheme(user.themePreference);
            localStorage.setItem('themePreference', user.themePreference);
        }
    }, [user]);

    // 3. Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.setAttribute('data-theme', 'light');
        }
    }, [theme]);

    // 4. Toggle Function
    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('themePreference', newTheme);

        // If logged in, persist to DB
        if (user && token) {
            try {
                // We need to fetch the backend URL from env or constant
                // Assuming relative path /api or absolute from constants
                // Using relative /api/auth/me/theme or similar?
                // Actually authController.updateMe accepts fields.
                // Let's use the standard update endpoint if available, or fetch.
                // But we don't want to couple api logic here if we can avoid it.
                // We'll use a fetch here for simplicity or import an API helper.

                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

                await fetch(`${API_URL}/auth/me`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ themePreference: newTheme })
                });
            } catch (error) {
                console.error('Failed to save theme preference', error);
            }
        }
    };

    // 5. Explicit Set Function
    const setThemePreference = async (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('themePreference', newTheme);
        if (user && token) {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                await fetch(`${API_URL}/auth/me`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ themePreference: newTheme })
                });
            } catch (error) {
                console.error('Failed to save theme preference', error);
            }
        }
    }

    if (!isInitialized) {
        return null; // or a loading spinner to prevent flash
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setThemePreference }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
