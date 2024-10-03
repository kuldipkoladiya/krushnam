import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf'; // Import jsPDF

const MonthlyBillPage = () => {
    const [customerName, setCustomerName] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [customerAccountId, setCustomerAccountId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sheet1, setSheet1] = useState('');
    const [sheet2, setSheet2] = useState('');
    const [pendingAmount, setPendingAmount] = useState(0);
    const navigate = useNavigate();
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionBoxRef = useRef(null);
    const [sheetDate, setSheetDate] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [extraId, setExtraId] = useState(null);
    const handlePrint = () => {
        const printContents = document.getElementById('printable-area').innerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };
    const handleKeyDown = (e) => {
        // if (e.key === 'ArrowDown' && selectedSuggestionIndex < customerSuggestions.length - 1) {
        //     setSelectedSuggestionIndex(selectedSuggestionIndex + 1);
        // } else if (e.key === 'ArrowUp' && selectedSuggestionIndex > 0) {
        //     setSelectedSuggestionIndex(selectedSuggestionIndex - 1);
        // } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        //     const selectedCustomer = customerSuggestions[selectedSuggestionIndex];
        //     setCustomerName(selectedCustomer.name);
        //     setCustomerId(selectedCustomer.id);
        //     setShowSuggestions(false);
        // }
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            saveSheetData(); // Call save function
        }
    };
    const handleHome = () => {
        navigate('/');
    };
    const handleDownload = () => {
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Set the scaling factor to 0.3 or 0.2 for more scaling
        const scalingFactor = 0.2; // You can experiment with this value
        const margins = { top: 7, left: 1 };

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

    // Handle customer name input and suggestions
    const handleCustomerNameChange = async (e) => {
        const value = e.target.value;
        setCustomerName(value);

        if (value) {
            setLoading(true);
            setError('');
            try {
                const response = await fetch('https://shreeji-be.vercel.app/v1/user/customer/');
                if (!response.ok) throw new Error('Failed to fetch customer suggestions');
                const result = await response.json();
                const filteredSuggestions = result.data.filter(customer =>
                    customer.name.toLowerCase().includes(value.toLowerCase())
                );
                setSuggestions(filteredSuggestions);
            } catch (err) {
                setError('Error fetching customer suggestions. Please try again.');
                console.error('Error fetching customer suggestions:', err);
            }
            setLoading(false);
        } else {
            setSuggestions([]);
        }
    };
    // Fetch pending payment details
    const fetchCustomerAccountDetails = async (customerName) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`https://shreeji-be.vercel.app/v1/user/customerAccount/get-by-name/${customerName}`);
            if (!response.ok) throw new Error('Failed to fetch customer account details');

            const result = await response.json();
            console.log('Fetched Customer Account Details:', result); // Log the response

            const { totalPayable, totalAmountRecevied, id } = result.data; // Access the id directly from the result
            const pending = totalPayable - totalAmountRecevied;
            setPendingAmount(pending);
            setCustomerAccountId(id); // Set customerAccountId

            console.log('Customer Account ID:', id); // Log the ID to confirm it's being set
        } catch (err) {
            setError('Error fetching customer account details. Please try again.');
            console.error('Error fetching customer account details:', err);
        }
        setLoading(false);
    };

    const handleSuggestionClick = (suggestion) => {
        setCustomerName(suggestion.name);
        setCustomerId(suggestion.id);
        setSuggestions([]);
        fetchCustomerAccountDetails(suggestion.name); // Fetch details when a suggestion is clicked
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const requestBody = { fromDate, toDate, customerId };
        try {
            const response = await fetch('https://shreeji-be.vercel.app/v1/user/invoice/get-invoices-by-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) throw new Error('Failed to fetch search results');
            const result = await response.json();
            setSearchResults(result.invoices || []);
        } catch (err) {
            setError('Error fetching search results. Please try again.');
            console.error('Error fetching search results:', err);
        }
        setLoading(false);
    };

    const handleInvoiceClick = async (invoiceId) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`https://shreeji-be.vercel.app/v1/user/invoice/${invoiceId}`);
            if (!response.ok) throw new Error('Failed to fetch invoice data');
            const result = await response.json();
            navigate('/invoice', { state: { invoiceData: result.data } });
        } catch (error) {
            setError('Error fetching invoice data. Please try again.');
            console.error('Error fetching invoice data:', error);
        }
        setLoading(false);
    };

    // Handle click outside the suggestion box
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target)) {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [suggestionBoxRef]);

    // Save sheet1 and sheet2 data
    const saveSheetData = async () => {
        setLoading(true);
        setError('');
        try {
            const requestBody = {
                customerAccountId: customerAccountId,
                customerId: customerId,
                sheet1: parseFloat(sheet1),
                sheet2: parseFloat(sheet2),
                date: sheetDate,
            };
            console.log("=====requestBody====>", requestBody);

            const response = await fetch('https://shreeji-be.vercel.app/v1/user/extra/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error('Failed to save sheet data');

            const result = await response.json();
            console.log('Sheet data saved successfully', result);

            // Store the extraId from the response
            setExtraId(result.data.id); // Assuming the extraId is in result.data.id

            // Set isSaved to true after successful save
            setIsSaved(true);

            // Refresh pending amount
            if (customerName) {
                await fetchCustomerAccountDetails(customerName); // Refresh pending amount after saving
            }
        } catch (err) {
            setError('Error saving sheet data. Please try again.');
            console.error('Error saving sheet data:', err);
        }
        setLoading(false);
    };
    const updateSheetData = async () => {
        if (!extraId) {
            console.error("No extraId available for update");
            return;
        }

        setLoading(true);
        setError('');
        try {
            const requestBody = {
                customerId: customerId,
                customerAccountId: customerAccountId,
                sheet1: parseFloat(sheet1),
                sheet2: parseFloat(sheet2),
            };
            console.log("=====requestBody for update====>", requestBody);

            const response = await fetch(`https://shreeji-be.vercel.app/v1/user/extra/${extraId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error('Failed to update sheet data');
            console.log('Sheet data updated successfully');

            // Refresh pending amount
            if (customerName) {
                await fetchCustomerAccountDetails(customerName); // Refresh pending amount after updating
            }
        } catch (err) {
            setError('Error updating sheet data. Please try again.');
            console.error('Error updating sheet data:', err);
        }
        setLoading(false);
    };
    // Calculate grand total with sheet1 and sheet2
    const grandTotalWithSheets = searchResults.reduce(
        (total, invoice) => total + (invoice.grandtotal || 0),
        0
    ) + parseFloat(sheet1 || 0) + parseFloat(sheet2 || 0);

    // Calculate total of all bills
    const totalOfAllBills = searchResults.reduce(
        (total, invoice) => total + (invoice.grandtotal || 0),
        0
    );


    // Generate and download PDF

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10">
            {/* Header Section (Payable Page Style) */}
            <div className="relative bg-gradient-to-r from-purple-500 to-indigo-500 p-8 rounded-xl mb-8 shadow-md max-w-7xl mx-auto">
                <div className="absolute top-0 left-0 w-full h-full bg-opacity-10 bg-white rounded-xl" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
                <div className="relative z-10 text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Monthly Bill Page</h1>
                    <p className="text-lg font-light text-white">Manage monthly customer bills and transactions</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8 max-w-7xl mx-auto bg-white text-gray-900 shadow-lg rounded-lg">
                {/* Search Input Form */}
                <form onSubmit={handleSearch} className="mb-6 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <input
                            type="text"
                            value={customerName}
                            onChange={handleCustomerNameChange}
                            placeholder="Enter customer name"
                            className="border rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />

                        {suggestions.length > 0 && (
                            <ul ref={suggestionBoxRef} className="absolute z-10 mt-10 w-96 bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                {suggestions.map((suggestion) => (
                                    <li
                                        key={suggestion.id}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="cursor-pointer px-4 py-2 hover:bg-gray-200"
                                    >
                                        {suggestion.name}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            placeholder="From Date"
                            className="border rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />

                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            placeholder="To Date"
                            className="border rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />

                        <button
                            onClick={handleHome}
                            className="bg-gradient-to-r from-purple-500 to-indigo-400 text-white py-2 px-4 rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-2 2v7a2 2 0 01-2 2H9a2 2 0 01-2-2v-7m10 0l2 2m-2-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v6" />
                            </svg>
                            <span>Home</span>
                        </button>

                        <button
                            onClick={handlePrint}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10h14M5 6h14M5 14h14M5 18h14M5 6v12" />
                            </svg>
                            <span>Print Invoice</span>
                        </button>

                        <button
                            type="submit"
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Search</span>
                        </button>

                        <button
                            onClick={handleDownload}
                            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Download as PDF</span>
                        </button>
                    </div>
                </form>

                {/* Error Handling */}
                {error && <div className="text-red-500 mb-4">{error}</div>}

                {/* Loading Indicator */}
                {loading && <div className="text-blue-500">Loading...</div>}

                <div id="printable-area" className="bg-white border rounded-lg p-4 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Left Side - Bill List */}
                        <div className="space-y-4">
                            {searchResults.length > 0 && (
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <table id="invoice-table" className="min-w-full divide-y divide-gray-300">
                                        <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bill Number</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer Name</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Grand Total</th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {searchResults.map((invoice) => (
                                            <tr key={invoice.id} className="cursor-pointer hover:bg-gray-100" onClick={() => handleInvoiceClick(invoice.id)}>
                                                <td className="px-6 py-4 whitespace-nowrap">{invoice.billNumber}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(invoice.billDate).toLocaleDateString('en-GB')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{invoice.customerId ? invoice.customerId.name : 'Unknown'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{invoice.grandtotal ? invoice.grandtotal.toFixed(2) : '0.00'}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Right Side - Input for Sheet1 and Sheet2 */}
                        <div className="space-y-4">
                            {searchResults.length > 0 && (
                                <div className="text-lg font-semibold">
                                    Total Bills: {totalOfAllBills.toFixed(2)}
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Additional Sheets</h3>

                                <div className="mb-4">
                                    <span className="font-semibold">FYUSING: </span>
                                    <input
                                        type="number"
                                        value={sheet1}
                                        onChange={(e) => setSheet1(e.target.value)}
                                        placeholder="Enter fyusing Amount"
                                        className="border rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>

                                <div className="mb-4">
                                    <span className="font-semibold">Sheet: </span>
                                    <input
                                        type="number"
                                        value={sheet2}
                                        onChange={(e) => setSheet2(e.target.value)}
                                        placeholder="Enter Sheet 2 Amount"
                                        className="border rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>

                                {/* Add Date Field */}
                                <div className="mb-4">
                                    <span className="font-semibold">Date: </span>
                                    <input
                                        type="date"
                                        value={sheetDate}
                                        onChange={(e) => setSheetDate(e.target.value)}
                                        className="border rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>

                                <div className="mt-4">
                                    {!isSaved && (
                                        <button
                                            onClick={saveSheetData}
                                            onKeyDown={handleKeyDown}
                                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                                        >
                                            Save Sheets
                                        </button>
                                    )}

                                    {isSaved && extraId && (
                                        <>
                                            <div className="text-green-600 font-bold mb-2">Sheets saved successfully!</div>
                                            <button
                                                onClick={updateSheetData}
                                                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                                            >
                                                Update Sheets
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="text-2xl font-semibold mt-4">
                                Grand Total: {grandTotalWithSheets.toFixed(2)}
                            </div>
                            <div className="text-3xl font-bold mt-4">
                                Total Pending Amount: {pendingAmount.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyBillPage;
