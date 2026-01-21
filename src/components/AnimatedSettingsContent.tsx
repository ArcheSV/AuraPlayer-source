import React from 'react';
import { useLocation } from 'react-router-dom';

export const AnimatedSettingsContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    return (
        <div key={location.pathname} className="animate-fade-in">
            {children}
        </div>
    );
};

export default AnimatedSettingsContent;
