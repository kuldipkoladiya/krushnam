import React, { useState, useEffect, useRef } from 'react';
import {jsPDF} from "jspdf";
import {useNavigate} from "react-router-dom";

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
        const printContents = document.getElementById('printable-area').innerHTML; // Get the specific div HTML
        const originalContents = document.body.innerHTML; // Store original HTML

        document.body.innerHTML = printContents; // Replace body HTML with the specific div
        window.print(); // Trigger the print dialog
        document.body.innerHTML = originalContents; // Restore original HTML after printing
        window.location.reload(); // Reload the page to restore component state
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

    return (
        <div className="p-8 max-w-5xl mx-auto bg-gray-50 rounded-lg shadow-lg">
            <h1 className="text-5xl font-bold text-blue-700 mb-8 text-center">Extra Bill Data</h1>
            <div className="space-y-8">
                {/* Search Extra Bill */}
                <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold mb-6">Search Extra Bill Data</h2>
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

                    {/* Fetch Extra Bill Button */}
                    <div className="mt-6 flex space-x-2">
                        <button
                            type="button"
                            onClick={handleFetchExtraData}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            Get Extra Bill Data
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                            Print Invoice
                        </button>
                        <button onClick={handleDownload} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Download as PDF</button>
                        <button
                            onClick={handleHome}
                            className="bg-purple-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            Home
                        </button>
                    </div>
                </div>
                <div id="printable-area" className="bg-white border rounded-lg p-4 shadow-sm space-y-4">
                {/* Customer Transactions Data */}
                {customerTransactions.length > 0 && (
                    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-2xl font-semibold mb-6">Customer Transactions</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 table-auto">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FYUSING</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sheet </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {customerTransactions.map((transaction, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"> {new Date(transaction.date).toLocaleDateString() || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.sheet1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.sheet2}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.customerId?.name || 'Unknown'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default ExtraBillPage;
