// src/features/client-portal/context/ClientAuthContext.jsx
// 利用者用の認証コンテキスト（PINコードログイン）

import { createContext, useContext, useState, useEffect } from 'react';

const ClientAuthContext = createContext(null);

export function ClientAuthProvider({ children }) {
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ローカルストレージから復元
        const savedClient = localStorage.getItem('clientAuth');
        if (savedClient) {
            try {
                setClient(JSON.parse(savedClient));
            } catch (e) {
                localStorage.removeItem('clientAuth');
            }
        }
        setLoading(false);
    }, []);

    const login = (clientData) => {
        setClient(clientData);
        localStorage.setItem('clientAuth', JSON.stringify(clientData));
    };

    const logout = () => {
        setClient(null);
        localStorage.removeItem('clientAuth');
    };

    return (
        <ClientAuthContext.Provider value={{ client, login, logout, loading }}>
            {children}
        </ClientAuthContext.Provider>
    );
}

export function useClientAuth() {
    const context = useContext(ClientAuthContext);
    if (!context) {
        throw new Error('useClientAuth must be used within ClientAuthProvider');
    }
    return context;
}
