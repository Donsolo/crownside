import { FaCut, FaPaintBrush, FaEye, FaRegEye } from 'react-icons/fa';

export const SERVICE_CATEGORIES = [
    {
        id: 'hair',
        label: 'Hair Services',
        shortLabel: 'Hair',
        icon: FaCut,
        description: 'Cuts, styling, coloring, and treatments.',
        image: '/images/service-hair.jpg'
    },
    {
        id: 'nails',
        label: 'Nail Services',
        shortLabel: 'Nails',
        icon: FaPaintBrush,
        description: 'Manicures, pedicures, and nail art.',
        image: '/images/service-nails.jpg'
    },
    {
        id: 'eyelashes',
        label: 'Eyelash Services',
        shortLabel: 'Lashes',
        icon: FaEye,
        description: 'Extensions, lifts, and tints.',
        image: '/images/service-lashes.jpg'
    },
    {
        id: 'eyebrows',
        label: 'Eyebrow Services',
        shortLabel: 'Brows',
        icon: FaRegEye,
        description: 'Shaping, threading, and microblading.',
        image: '/images/service-brows.jpg'
    }
];

export const getCategoryLabel = (id) => {
    const cat = SERVICE_CATEGORIES.find(c => c.id === id);
    return cat ? cat.label : id;
};
