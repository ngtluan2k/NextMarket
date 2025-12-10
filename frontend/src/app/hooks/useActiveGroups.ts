import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface ActiveGroup {
    id: number;
    name: string;
    status: string;
    expires_at: string | null;
    is_host: boolean;
    store: {
        id: number;
        name: string;
        slug: string;
    };
    host: {
        id: number;
        username: string;
    };
    joined_at: string;
}

export const useActiveGroups = () => {
    const [activeGroups, setActiveGroups] = useState<ActiveGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const { me } = useAuth();
    const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

    const fetchActiveGroups = async () => {
        if (!me?.id) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BE_BASE_URL}/group-orders/user/${me.id}/active`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setActiveGroups(data);
            }
        } catch (error) {
            console.error('Failed to fetch active groups:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveGroups();
    }, [me?.id]);

    return { activeGroups, loading, refetch: fetchActiveGroups };
};