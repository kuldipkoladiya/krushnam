import React from 'react';

const Popup = ({ message, isSuccess, onClose }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
            <div className={`bg-white rounded-lg p-6 ${isSuccess ? 'border-green-500' : 'border-red-500'} border`}>
                <h2 className={`text-lg font-bold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {isSuccess ? 'Success' : 'Error'}
                </h2>
                <p className="mt-2">{message}</p>
                <button
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default Popup;