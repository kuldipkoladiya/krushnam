// src/components/NavigationButtons.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavigationButtons = () => {
    const navigate = useNavigate();

    return (
        <div className="space-x-4">
            <button
                type="button"
                className="bg-orange-400 text-white py-2 px-4 rounded-lg text-sm"
                onClick={() => navigate('/extra')}
            >
                Other Bills
            </button>
            <button
                type="button"
                className="bg-orange-400 text-white py-2 px-4 rounded-lg text-sm"
                onClick={() => navigate('/payments')}
            >
                Customer Payments
            </button>
            <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm"
                onClick={() => navigate('/search')}
            >
                Search Invoices
            </button>
            <button
                type="button"
                className="bg-purple-600 text-white py-2 px-4 rounded-lg text-sm"
                onClick={() => navigate('/monthly-bill')}
            >
                Get Monthly Bill
            </button>
            <button
                type="button"
                className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm"
                onClick={() => navigate('/accounts')}
            >
                Accounts
            </button>
        </div>
    );
};

export default NavigationButtons;
