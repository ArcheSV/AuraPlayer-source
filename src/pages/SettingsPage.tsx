import React from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Palette, Search, KeyRound, Code } from 'lucide-react';

import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import AnimatedSettingsContent from '../components/AnimatedSettingsContent';
import { SearchSettings } from '../components/settings/SearchSettings';
import { AccountSettings } from '../components/settings/AccountSettings';
import { AdvancedSettings } from '../components/settings/AdvancedSettings';

export function SettingsPage() {
    const getLinkClassName = ({ isActive }: { isActive: boolean }) => {
        const baseClasses = 'flex items-center gap-2 md:gap-3 px-3 py-2 rounded-md font-medium transition-colors text-sm md:text-base whitespace-nowrap flex-shrink-0';
        return isActive
            ? `${baseClasses} bg-zinc-700 text-white`
            : `${baseClasses} text-zinc-300 hover:bg-zinc-800 hover:text-white`;
    };

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Configuración</h1>
            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                {}
                <nav className="flex flex-row md:flex-col gap-2 md:w-1/4 border-b-2 md:border-b-0 md:border-r-2 border-zinc-800 pb-3 md:pb-0 md:pr-8 overflow-x-auto md:overflow-visible -mx-3 px-3 md:mx-0 md:px-0">
                    <NavLink to="/settings/appearance" className={getLinkClassName}>
                        <Palette size={20} /> Apariencia
                    </NavLink>
                    <NavLink to="/settings/search" className={getLinkClassName}>
                        <Search size={20} /> Búsqueda
                    </NavLink>
                    <NavLink to="/settings/account" className={getLinkClassName}>
                        <KeyRound size={20} /> Cuenta
                    </NavLink>
                    <NavLink to="/settings/advanced" className={getLinkClassName}>
                        <Code size={20} /> Avanzado
                    </NavLink>
                </nav>

                <div className="flex-1">
                    <AnimatedSettingsContent>
                        <Routes>
                            <Route path="appearance" element={<AppearanceSettings />} />
                            <Route path="search" element={<SearchSettings />} />
                            <Route path="account" element={<AccountSettings />} />
                            <Route path="advanced" element={<AdvancedSettings />} />
                            <Route index element={<Navigate to="appearance" replace />} />
                        </Routes>
                    </AnimatedSettingsContent>
                </div>
            </div>
        </div>
    );
}
