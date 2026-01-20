import React from 'react';
import { useNavigate } from 'react-router-dom';
import MyConnections from '../components/MyConnections';

export default function ConnectionsPage() {
    const navigate = useNavigate();

    // When used as a page, closing means going back or home
    const handleClose = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-4">
            {/* We can render MyConnections directly. 
                 Since MyConnections has a fixed overlay, it will cover the screen.
                 We just need to make sure we don't duplicate backdrops if we don't want to.
                 But MyConnections has a built-in backdrop and z-index. 
                 It should work fine as is.
             */}
            <MyConnections onClose={handleClose} />
        </div>
    );
}
