import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import ConfirmationPopup from './ConfirmationPopup';
import companyNameImage from "../images/Black Minimalist Spooky Youtube Thumbnail.png"; // Assuming you have a ConfirmationPopup component

const PaymentPage = () => {
    const [customerName, setCustomerName] = useState('');
    const [customers, setCustomers] = useState([]);
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [customerId, setCustomerId] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null); // To hold the transaction ID to delete
    const [showDeletePopup, setShowDeletePopup] = useState(false); // For controlling the delete popup
    const suggestionBoxRef = useRef(null);
    const navigate = useNavigate();

    // PDF and Print handlers remain the same
    const handleDownload = () => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const scalingFactor = 0.2;
        const margins = { top: 10, left: 10 };

        pdf.html(document.getElementById('printable-area'), {
            callback: function (doc) {
                doc.save('transaction-details.pdf');
            },
            x: margins.left,
            y: margins.top,
            html2canvas: {
                scale: scalingFactor,
                width: pdf.internal.pageSize.getWidth() - margins.left * 2,
                height: pdf.internal.pageSize.getHeight() - margins.top * 2
            }
        });
    };

    const handlePrint = () => {
        const originalContents = document.body.innerHTML;
        const printContents = document.getElementById('printable-area').innerHTML;

        // Temporarily insert the logo at the top for printing
        const logoImage = `<img src="${companyNameImage}" alt="Company Logo" id="logo" style="width: 200px; display: block; margin-bottom: 20px;" />`;
        const name  = `<h2 style="display: block; font-size: 20px; font-weight: bold; margin-left: 25px; margin-bottom: 5px;">Name: ${customerName}</h2>`;

        document.body.innerHTML = `${logoImage}${name}${printContents}`;

        window.print(); // Trigger the print dialog

        document.body.innerHTML = originalContents; // Restore the original content after printing
        window.location.reload(); // Optionally reload to restore functionality
    };

    // Fetch customers initially
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('https://krushnam-be.vercel.app//v1/user/customer/');
                if (!response.ok) throw new Error('Failed to fetch customers');
                const customerData = await response.json();
                setCustomers(customerData.data || []);
            } catch (error) {
                console.error('Error fetching customer data:', error);
            }
        };
        fetchCustomers();
    }, []);

    // Handle customer search suggestions
    useEffect(() => {
        if (customerName.length > 1) {
            const matchedCustomers = customers.filter(customer =>
                customer.name.toLowerCase().includes(customerName.toLowerCase())
            );
            setCustomerSuggestions(matchedCustomers);
            setShowSuggestions(true);
        } else {
            setCustomerSuggestions([]);
            setShowSuggestions(false);
        }
    }, [customerName, customers]);

    const handleCustomerNameChange = (e) => {
        setCustomerName(e.target.value);
        setSelectedSuggestionIndex(-1);
    };

    const handleSuggestionClick = (customer) => {
        setCustomerName(customer.name);
        setCustomerId(customer.id);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown' && selectedSuggestionIndex < customerSuggestions.length - 1) {
            setSelectedSuggestionIndex(selectedSuggestionIndex + 1);
        } else if (e.key === 'ArrowUp' && selectedSuggestionIndex > 0) {
            setSelectedSuggestionIndex(selectedSuggestionIndex - 1);
        } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
            const selectedCustomer = customerSuggestions[selectedSuggestionIndex];
            setCustomerName(selectedCustomer.name);
            setCustomerId(selectedCustomer.id);
            setShowSuggestions(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleFetchTransactions = async () => {
        if (!customerId || !fromDate || !toDate) {
            alert('Please fill in all the required fields.');
            return;
        }

        const requestData = { customerId, fromDate, toDate };

        try {
            const response = await fetch('https://krushnam-be.vercel.app//v1/user/customerTransaction/get-transaction-by-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) throw new Error('Failed to fetch transactions');
            const transactionData = await response.json();

            if (transactionData.customerTransactions && Array.isArray(transactionData.customerTransactions)) {
                setTransactions(transactionData.customerTransactions);
            } else {
                setTransactions([]);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            alert('Error fetching transactions. Please try again.');
        }
    };

    // Delete functionality: Open confirmation popup
    const openDeletePopup = (transactionId) => {
        setTransactionToDelete(transactionId);
        setShowDeletePopup(true);
    };

    // Confirm and delete transaction
    const handleDelete = async () => {
        if (transactionToDelete) {
            try {
                const response = await fetch(`https://krushnam-be.vercel.app//v1/user/customerTransaction/${transactionToDelete}`, {
                    method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete transaction');

                // Refresh transaction list after delete
                await handleFetchTransactions();
                setTransactionToDelete(null);
                setShowDeletePopup(false);
            } catch (error) {
                console.error('Error deleting transaction:', error);
                alert('Error deleting transaction. Please try again.');
            }
        }
    };

    // Close delete popup
    const closeDeletePopup = () => {
        setShowDeletePopup(false);
        setTransactionToDelete(null);
    };

    const handleHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10">
            <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
                <div className="print-logo-container flex flex-col items-center justify-center mb-4">
                    <img src={companyNameImage} alt="Company Logo" className="print-logo h-20 mb-4 " />
                </div>
                {/* Header Section */}
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-500 p-8 rounded-xl mb-8 shadow-md">
                    <div className="absolute top-0 left-0 w-full h-full bg-opacity-10 bg-white rounded-xl" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
                    <div className="relative z-10 text-center">
                        <h1 className="text-4xl font-bold text-white mb-2">Payment History</h1>
                        <p className="text-lg font-light text-white">View and manage all transaction history</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Search Transactions */}
                    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-2xl font-semibold mb-6">Search Transactions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Customer Name Input */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={handleCustomerNameChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
                                    placeholder="Enter customer name"
                                />
                                {showSuggestions && customerSuggestions.length > 0 && (
                                    <ul
                                        className="absolute bg-white border border-gray-300 mt-1 w-full max-h-48 overflow-y-auto z-10 shadow-md rounded-lg"
                                        ref={suggestionBoxRef}
                                    >
                                        {customerSuggestions.map((customer, index) => (
                                            <li
                                                key={customer.id}
                                                className={`p-2 cursor-pointer hover:bg-gray-200 ${selectedSuggestionIndex === index ? 'bg-gray-200' : ''}`}
                                                onClick={() => handleSuggestionClick(customer)}
                                            >
                                                {customer.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Date Inputs */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">From Date</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">To Date</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
                                />
                            </div>
                        </div>

                        {/* Fetch Transactions Button */}
                        <div className="mt-6 flex space-x-3">
                            <button
                                type="button"
                                onClick={handleFetchTransactions}
                                className="bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                                Get Transactions
                            </button>
                            <button
                                onClick={handleHome}
                                className="bg-gradient-to-r from-purple-500 to-indigo-400 hover:from-purple-600 hover:to-indigo-500 text-white py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                Home
                            </button>
                            <button
                                onClick={handlePrint}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                            >
                                Print Invoice
                            </button>
                            <button
                                onClick={handleDownload}
                                className="bg-gradient-to-r from-blue-500 to-indigo-400 text-white px-4 py-2 rounded-lg"
                            >
                                Download as PDF
                            </button>
                        </div>
                    </div>

                    {/* Transaction History */}
                    {transactions.length > 0 && (
                        <div id="printable-area" className="bg-white border rounded-lg p-8 shadow-sm space-y-4">
                            <h2 className="text-2xl font-semibold mb-6">Transaction History</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 table-auto">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map((transaction, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap">{transaction.customerId?.name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(transaction.Date).toLocaleDateString() || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{transaction.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{transaction.notes || 'No notes'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => openDeletePopup(transaction._id || transaction.id)}
                                                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center space-x-2"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    <span>Delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Confirmation Popup */}
                <ConfirmationPopup
                    isOpen={showDeletePopup}
                    onClose={closeDeletePopup}
                    onConfirm={handleDelete}
                    message="Are you sure you want to delete this transaction?"
                />
            </div>
        </div>
    );
};

export default PaymentPage;
