import React, { useState, useEffect, useRef } from 'react';
import {useNavigate} from "react-router-dom";
import html2canvas from "html2canvas";
import {jsPDF} from "jspdf";

const AccountsPage = () => {
    const [customerName, setCustomerName] = useState('');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [transactionDate, setTransactionDate] = useState('');
    const [customerAccountId, setCustomerAccountId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [paymentType, setPaymentType] = useState('cash');
    const [transactionId, setTransactionId] = useState('');
    const [transactionDetails, setTransactionDetails] = useState(null);
    const suggestionBoxRef = useRef(null);
    const navigate = useNavigate();
    const handlePrint = () => {
        const printContents = document.getElementById('printable-area').innerHTML; // Get the specific div HTML
        const originalContents = document.body.innerHTML; // Store original HTML

        document.body.innerHTML = printContents; // Replace body HTML with the specific div
        window.print(); // Trigger the print dialog
        document.body.innerHTML = originalContents; // Restore original HTML after printing
        window.location.reload(); // Reload the page to restore component state
    };
    // Fetch all customers initially
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
    const handleHome = () => {
        navigate('/');
    };
    // Update suggestions when customerName changes
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

    // Fetch customer account ID when a suggestion is clicked or selected
    const fetchCustomerAccountId = async (name) => {
        try {
            const response = await fetch(`https://shreeji-be.vercel.app/v1/user/customerAccount/get-by-name/${encodeURIComponent(name)}`);
            if (response.ok) {
                const accountData = await response.json();
                if (accountData.data && accountData.data.id) {
                    setCustomerAccountId(accountData.data.id);
                } else {
                    console.warn('No customer account found for the name:', name);
                }
            } else {
                console.error('Error fetching customer account ID:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching customer account ID:', error);
        }
    };

    const handleCustomerNameChange = (e) => {
        setCustomerName(e.target.value);
        setSelectedSuggestionIndex(-1);
    };

    const handleSuggestionClick = (customer) => {
        setCustomerName(customer.name);
        setCustomerId(customer.id);
        fetchCustomerAccountId(customer.name);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            setSelectedSuggestionIndex((prevIndex) =>
                Math.min(prevIndex + 1, customerSuggestions.length - 1)
            );
        } else if (e.key === 'ArrowUp') {
            setSelectedSuggestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
            const selectedCustomer = customerSuggestions[selectedSuggestionIndex];
            handleSuggestionClick(selectedCustomer);
        } else if (e.key === 'Enter') {
            setShowSuggestions(false);
        }
    };

    // Close the suggestion box on outside click
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

    // Fetch transaction details using customerTransactionId
    const fetchTransactionDetails = async (id) => {
        try {
            const response = await fetch(`https://shreeji-be.vercel.app/v1/user/customerTransaction/${id}`);
            if (response.ok) {
                const data = await response.json();
                setTransactionDetails(data.data);
            } else {
                console.error('Error fetching transaction details:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching transaction details:', error);
        }
    };
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


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerName || !receivedAmount || !transactionDate || !paymentType || !customerId) {
            alert('Please fill in all fields.');
            return;
        }

        try {
            // Create a new transaction
            const transactionResponse = await fetch('https://shreeji-be.vercel.app/v1/user/customerTransaction/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    customerAccountId,
                    Date: transactionDate,
                    amount: receivedAmount,
                    notes: paymentType,
                }),
            });

            if (transactionResponse.ok) {
                const transactionData = await transactionResponse.json();
                setTransactionId(transactionData.data.id);
                fetchTransactionDetails(transactionData.data.id);
            } else {
                console.error('Error creating transaction');
            }
        } catch (error) {
            console.error('Error in transaction:', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-700 mb-6">Customer Accounts</h1>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Customer Name Input */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 relative">
                    <label className="block text-sm font-medium text-gray-600">Customer Name:</label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={handleCustomerNameChange}
                        onKeyDown={handleKeyDown}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                        placeholder="Enter customer name"
                    />
                    {showSuggestions && customerSuggestions.length > 0 && (
                        <ul ref={suggestionBoxRef} className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-md max-h-48 overflow-y-auto z-10">
                            {customerSuggestions.map((customer, index) => (
                                <li
                                    key={customer.id}
                                    className={`p-2 cursor-pointer hover:bg-gray-200 ${index === selectedSuggestionIndex ? 'bg-gray-200' : ''}`}
                                    onClick={() => handleSuggestionClick(customer)}
                                >
                                    {customer.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Received Amount Input */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                    <label className="block text-sm font-medium text-gray-600">Received Amount:</label>
                    <input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                        placeholder="Enter amount"
                    />
                </div>

                {/* Transaction Date Input */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                    <label className="block text-sm font-medium text-gray-600">Transaction Date:</label>
                    <input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    />
                </div>

                {/* Payment Type Input */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                    <label className="block text-sm font-medium text-gray-600">Payment Type:</label>
                    <select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 text-center space-x-2">
                    <button type="submit" className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition">
                        Save Account
                    </button>
                    <button
                        onClick={handleHome}
                        className="bg-purple-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        Home
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Print Invoice
                    </button>
                    <button onClick={handleDownload} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Download as PDF</button>
                </div>
            </form>
            <div id="printable-area" className="bg-white  rounded-lg p-4 shadow-sm space-y-4">
            {/* Display Transaction Details */}
            {transactionDetails && (
                <div className="mt-8 p-6 rounded-lg border border-gray-300 shadow-lg bg-white">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Transaction </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Information */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">Customer Information</h3>
                            <p className="text-gray-700"><strong>Name:</strong> {transactionDetails.customerId?.name || 'N/A'}</p>
                            <p className="text-gray-700"><strong>Mobile Number:</strong> {transactionDetails.customerId?.mobileNumber || 'N/A'}</p>
                        </div>

                        {/* Account Information */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-green-800 mb-2">Account Information</h3>
                            <p className="text-gray-700"><strong>Total Payable:</strong> {transactionDetails.customerAccountId?.totalPayable?.toFixed(2) || 'N/A'}</p>
                            <p className="text-gray-700"><strong>Total Amount Received:</strong> {transactionDetails.customerAccountId?.totalAmountRecevied?.toFixed(2) || 'N/A'}</p>
                            <p className="text-gray-700 font-bold"><strong>Pending Amount:</strong> {((transactionDetails.customerAccountId?.totalPayable || 0) - (transactionDetails.customerAccountId?.totalAmountRecevied || 0) )}</p>
                        </div>

                        {/* Transaction Details */}
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm md:col-span-2">
                            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Transaction Details</h3>
                            <p className="text-gray-700"><strong>Date:</strong> {new Date(transactionDetails.Date).toLocaleDateString() || 'N/A'}</p>
                            <p className="text-gray-700"><strong>Payment Type:</strong> {transactionDetails.notes || 'N/A'}</p>
                            <p className="text-gray-700 font-bold"><strong>Amount:</strong> {transactionDetails.amount?.toFixed(2) || 'N/A'}</p>

                        </div>
                    </div>
                </div>
            )}
            </div>


        </div>
    );
};

export default AccountsPage;
