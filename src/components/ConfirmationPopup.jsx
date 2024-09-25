import React from 'react';

const ConfirmationPopup = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                <h3 className="text-lg font-semibold mb-4">{message}</h3>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onConfirm}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationPopup;
