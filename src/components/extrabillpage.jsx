import React, { useState, useEffect, useRef } from 'react';
import {jsPDF} from "jspdf";
import {useNavigate} from "react-router-dom";
import ConfirmationPopup from './ConfirmationPopup';
import companyNameImage from "../images/Black Minimalist Spooky Youtube Thumbnail.png";
import '../App.css';
const ExtraBillPage = () => {
    const [customerName, setCustomerName] = useState('');
    const [customers, setCustomers] = useState([]);
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [customerId, setCustomerId] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [customerTransactions, setCustomerTransactions] = useState([]); // State for customer transactions
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionBoxRef = useRef(null);
    const navigate = useNavigate();
    const [showDeletePopup, setShowDeletePopup] = useState(false); // For controlling the delete popup
    const [invoiceToDelete, setInvoiceToDelete] = useState(null); // Invoice ID to delete
    const [loading, setLoading] = useState(false); // For showing a loading indicator
    const [error, setError] = useState(''); // For displaying any error messages


    // Fetch customers initially
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('https://shreeji-be.vercel.app/v1/user/customer/');
                if (!response.ok) throw new Error('Failed to fetch customers');
                const customerData = await response.json();
                setCustomers(customerData.data || []);
            } catch (error) {
                console.error('Error fetching customer data:', error);
            }
        };
        fetchCustomers();
    }, []);
    const handleDownload = () => {
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Set the scaling factor to 0.3 or 0.2 for more scaling
        const scalingFactor = 0.2; // You can experiment with this value
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
    const handleHome = () => {
        navigate('/');
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

    const handleFetchExtraData = async () => {
        if (!customerId || !fromDate || !toDate) {
            alert('Please fill in all the required fields.');
            return;
        }

        const requestData = { customerId, fromDate, toDate };

        try {
            const response = await fetch('https://shreeji-be.vercel.app/v1/user/extra/get-extra-by-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) throw new Error('Failed to fetch transactions');
            const extraDataResponse = await response.json();

            // Log the response to check structure
            console.log('Customer Transactions Response:', extraDataResponse);

            // Assuming the response contains an array of transactions in `customerTransactions`
            if (extraDataResponse.customerTransactions && Array.isArray(extraDataResponse.customerTransactions)) {
                setCustomerTransactions(extraDataResponse.customerTransactions);
            } else {
                setCustomerTransactions([]);
            }
        } catch (error) {
            console.error('Error fetching customer transactions:', error);
            alert('Error fetching customer transactions. Please try again.');
        }
    };

    const openDeletePopup = (invoiceId) => {
        setInvoiceToDelete(invoiceId);
        setShowDeletePopup(true);
    };

    // Function to handle delete invoice
    const handleDelete = async () => {
        if (invoiceToDelete) {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`https://shreeji-be.vercel.app/v1/user/extra/${invoiceToDelete}`, {
                    method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete invoice');

                // After deletion, refresh the invoice list
                await handleFetchExtraData(); // Refresh the list after deleting the invoice
                setInvoiceToDelete(null);
                setShowDeletePopup(false);
            } catch (err) {
                setError('Error deleting invoice. Please try again.');
                console.error('Error deleting invoice:', err);
            }
            setLoading(false);
        }
    };

    // Function to close the delete confirmation popup
    const closeDeletePopup = () => {
        setShowDeletePopup(false);
        setInvoiceToDelete(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                <div className="print-logo-container flex flex-col items-center justify-center mb-4">
                    <img src={companyNameImage} alt="Company Logo" className="print-logo h-20 mb-4 " />
                </div>
                {/* Header Section */}
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-8 rounded-xl mb-8 shadow-md">
                    {/* Background pattern */}
                    <div className="absolute top-0 left-0 w-full h-full bg-opacity-10 bg-white rounded-xl" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>

                    {/* Header content */}
                    <div className="relative z-10 text-center">
                        <h1 className="text-4xl font-bold text-white mb-2">Extra Bill Data</h1>
                        <p className="text-lg font-light text-white">Manage and search extra bill data seamlessly</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Search Extra Bill */}
                    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Customer Name Input */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={handleCustomerNameChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
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
                                                className={`p-2 cursor-pointer hover:bg-gray-200 ${
                                                    selectedSuggestionIndex === index ? 'bg-gray-200' : ''
                                                }`}
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
                                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">To Date</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
                                />
                            </div>
                        </div>

                        {/* Fetch Extra Bill Buttons */}
                        <div className="mt-6 flex space-x-2">
                            <button
                                type="button"
                                onClick={handleFetchExtraData}
                                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center space-x-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Get Extra Bill Data</span>
                            </button>
                            <button
                                onClick={handlePrint}
                                className="bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white px-4 py-2 rounded-lg shadow-md flex items-center space-x-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10h14M5 6h14M5 14h14M5 18h14M5 6v12" />
                                </svg>
                                <span>Print Invoice</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-white px-4 py-2 rounded-lg shadow-md flex items-center space-x-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Download as PDF</span>
                            </button>
                            <button
                                onClick={handleHome}
                                className="bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500 text-white py-2 px-4 rounded-lg shadow-md flex items-center space-x-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-2 2v7a2 2 0 01-2 2H9a2 2 0 01-2-2v-7m10 0l2 2m-2-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v6" />
                                </svg>
                                <span>Home</span>
                            </button>
                        </div>
                    </div>

                    {/* Customer Transactions Data */}
                    {customerTransactions.length > 0 && (
                        <div id="printable-area" className="bg-white border rounded-lg p-8 shadow-sm space-y-4">
                            <h2 className="text-2xl font-semibold mb-6">Customer Transactions</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 table-auto">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FYUSING</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sheet</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {customerTransactions.map((transaction, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString() || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.sheet1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.sheet2}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.customerId?.name || 'Unknown'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">  <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeletePopup(transaction._id || transaction.id);
                                                }}
                                                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center space-x-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span>Delete</span>
                                            </button></td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <ConfirmationPopup
                    isOpen={showDeletePopup}
                    onClose={closeDeletePopup}
                    onConfirm={handleDelete}
                    message="Are you sure you want to delete this invoice?"
                />
            </div>
        </div>


    );
};

export default ExtraBillPage;
