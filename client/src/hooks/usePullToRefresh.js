import { useEffect } from 'react';

export const usePullToRefresh = () => {
    useEffect(() => {
        let startY = 0;
        let isPulling = false;
        const THRESHOLD = 150; // px to trigger reload

        const handleTouchStart = (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].screenY;
                isPulling = true;
            } else {
                isPulling = false;
            }
        };

        const handleTouchMove = (e) => {
            if (!isPulling) return;
            // If user scrolls down instead, cancel (though scrollY would increase, this is safety)
            if (window.scrollY > 0) {
                isPulling = false;
            }
        };

        const handleTouchEnd = (e) => {
            if (!isPulling) return;

            const endY = e.changedTouches[0].screenY;
            const distance = endY - startY;

            // Only trigger if at top and pulled down significantly
            if (window.scrollY === 0 && distance > THRESHOLD) {
                // Visual feedback (optional) or just reload
                window.location.reload();
            }
            isPulling = false;
        };

        // Passive listeners to not block scrolling
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);
};
