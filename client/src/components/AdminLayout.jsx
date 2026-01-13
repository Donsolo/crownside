import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Scissors, Calendar, Image, Settings, Star, Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';

export default function AdminLayout() {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Hero Manager', path: '/admin/heroes', icon: Image },
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Beauty Pros', path: '/admin/pros', icon: Scissors },
        { label: 'Bookings', path: '/admin/bookings', icon: Calendar },
        { label: 'Reviews', path: '/admin/reviews', icon: Star },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
            {/* Desktop Sidebar (Optional - user asked for header/bottom nav, 
                but a layout usually implies some structure. 
                Task says "Admin pages render inside the admin layout".
                "Shared Admin layout wrapper: Header: 'CrownSide Admin'".
                "Content area switches based on menu selection".
                I will make a clean sidebar for larger screens as it's standard for Admin panels, 
                but user specifically asked for "Hamburger menu" on desktop header.
                
                Actually, the user requirement for Desktop is: 
                "Place a hamburger icon (☰) in the far right of the header... 
                Clicking it opens admin navigation menu".
                
                So the AdminLayout itself might just be a wrapper with a specific Header 
                if we follow instructions strictly. 
                
                "Admin routes must be protected server-side" -> This is App.jsx concern.
                
                Let's stick to the requested design:
                - Common Admin Header (CrownSide Admin)
                - Content Area
                
                The navigation is handled by the Navbar (Desktop Hamburger) and BottomNav (Mobile Icon).
                However, once INSIDE the Admin area, usually you want persistent navigation.
                
                "Admin pages render inside the admin layout"
                "Admin nav opens an expandable admin menu"
                
                If I add a sidebar here, it might conflict with the "Hamburger Menu" requirement.
                Let's make the AdminLayout mostly a content wrapper with a distinct Header.
            */}

            <div className="flex-1 flex flex-col min-h-screen">
                {/* Admin Header */}
                <header className="bg-crown-dark text-white shadow-md sticky top-0 z-40">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Logo or Brand */}
                            <img src={logo} alt="CrownSide" className="h-8 w-auto brightness-0 invert" />
                            <span className="font-serif font-bold text-lg tracking-wide border-l border-white/20 pl-3 ml-1">
                                Admin Console
                            </span>
                        </div>

                        {/* 
                            Since we have the global Navbar, do we replace it? 
                            The task says "Admin pages render inside the admin layout".
                            If we use a separate layout route in App.jsx, the main Navbar won't show 
                            UNLESS we include it.
                            
                            Usually Admin panels have their own navigation.
                            The User said: "Add Desktop Hamburger... Menu exposes Admin navigation".
                            This suggests the Main Navbar IS present, highlighting the Admin entry point.
                            
                            Wait, "Admin pages render inside the admin layout".
                            If I make /admin a child of Layout, it gets the main Navbar.
                            If I make /admin a separate route tree, it gets AdminLayout.
                            
                            If it gets AdminLayout, the Main Navbar is GONE, so the "Hamburger" to access admin 
                            would be on the Public pages.
                            
                            Ah, "Admin Dashboard remains the default landing page".
                            
                            Let's assume the user wants the Main Navbar to be visible even on Admin pages?
                            "All admin pages render within the admin layout".
                            "Shared Admin layout wrapper: Header: 'CrownSide Admin'".
                            
                            This implies a DEDICATED layout.
                            
                            So, Public Pages -> Main Navbar (with Admin Hamburger).
                            Admin Pages -> Admin Layout (with "CrownSide Admin" header).
                            
                            BUT, if I go to Admin Layout, how do I navigate BACK or BETWEEN admin pages?
                            The user said "Hamburger menu... Menu items navigate to /admin/xxx".
                            
                            So the Hamburger menu on the Main Navbar is the entry point.
                            Once inside, we probably need navigation too.
                            
                            I'll add a simple sidebar for Desktop inside AdminLayout for better usability,
                            or just rely on the layout header if desired. 
                            Given "Scalable Admin CP", a sidebar is best practice.
                        */}
                    </div>
                </header>

                <main className="flex-1 container mx-auto px-4 py-8">
                    <Outlet />
                </main>

                {/* 
                    Note: The BottomNav and Main Navbar are likely outside this layout 
                    if configured in App.jsx as a separate branch. 
                    I'll check App.jsx structure next.
                */}
            </div>
        </div>
    );
}
