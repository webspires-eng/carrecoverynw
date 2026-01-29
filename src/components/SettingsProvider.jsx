"use client";

import { createContext, useContext } from 'react';

const SettingsContext = createContext({
    business_name: 'Car Recovery UK',
    phone: '07360544819',
    whatsapp: '447360544819',
    email: 'info@carrecoveryuk.co.uk',
    address: 'West Midlands, UK'
});

export function SettingsProvider({ children, settings }) {
    return (
        <SettingsContext.Provider value={settings}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
