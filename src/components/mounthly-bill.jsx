import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf'; // Import jsPDF
import companyNameImage from '../images/Black Minimalist Spooky Youtube Thumbnail.png'; // Ensure correct path

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

    useEffect(() => {
        const savedCustomerName = localStorage.getItem('customerName');
        const savedCustomerId = localStorage.getItem('customerId');
        const savedFromDate = localStorage.getItem('fromDate');
        const savedToDate = localStorage.getItem('toDate');
        const savedSheet1 = localStorage.getItem('sheet1');
        const savedSheet2 = localStorage.getItem('sheet2');
        const savedSheetDate = localStorage.getItem('sheetDate');

        if (savedCustomerName) setCustomerName(savedCustomerName);
        if (savedCustomerId) setCustomerId(savedCustomerId);
        if (savedFromDate) setFromDate(savedFromDate);
        if (savedToDate) setToDate(savedToDate);
        if (savedSheet1) setSheet1(savedSheet1);
        if (savedSheet2) setSheet2(savedSheet2);
        if (savedSheetDate) setSheetDate(savedSheetDate);
    }, []);

    // Save data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('customerName', customerName);
        localStorage.setItem('customerId', customerId);
        localStorage.setItem('fromDate', fromDate);
        localStorage.setItem('toDate', toDate);
        localStorage.setItem('sheet1', sheet1);
        localStorage.setItem('sheet2', sheet2);
        localStorage.setItem('sheetDate', sheetDate);
    }, [customerName, customerId, fromDate, toDate, sheet1, sheet2, sheetDate]);

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
    const handlePrint = () => {
        const printContents = document.getElementById('printable-area').innerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };
    const handleReset = () => {
        setCustomerName('');
        setCustomerId('');
        setFromDate('');
        setToDate('');
        setSheet1('');
        setSheet2('');
        setSheetDate('');
        localStorage.clear(); // Clear all saved data from localStorage
        setIsSaved(false); // Reset the saved state
        setSearchResults([]); // Clear the search results
        setPendingAmount(0); // Reset pending amount
    };
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown' && selectedSuggestionIndex < suggestions.length - 1) {
            // Move the selection down
            setSelectedSuggestionIndex(selectedSuggestionIndex + 1);
        } else if (e.key === 'ArrowUp' && selectedSuggestionIndex > 0) {
            // Move the selection up
            setSelectedSuggestionIndex(selectedSuggestionIndex - 1);
        } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
            // Select the currently highlighted suggestion
            const selectedCustomer = suggestions[selectedSuggestionIndex];
            handleSuggestionClick(selectedCustomer);  // Trigger the suggestion click
        } else if (e.key === 'Escape') {
            // Close the suggestion box
            setShowSuggestions(false);
        }
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
    // Fetch pending payment details
    const fetchCustomerAccountDetails = async (customerId) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`https://shreeji-be.vercel.app/v1/user/customerAccount/get-by-id/${customerId}`);
            if (!response.ok) throw new Error('Failed to fetch customer account details');

            const result = await response.json();
            console.log('Fetched Customer Account Details:', result);

            const { totalPayable, totalAmountRecevied, id } = result.data;
            const pending = totalPayable - totalAmountRecevied;
            setPendingAmount(pending);
            setCustomerAccountId(id);

            console.log('Customer Account ID:', id);
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
        fetchCustomerAccountDetails(suggestion.id); // Fetch details when a suggestion is clicked
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
    const handleInvoiceDownload = async (invoice) => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const marginLeft = 20;

        const addImageToPDF = (imageSrc, x, y, width, height) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = imageSrc;
                img.onload = () => {
                    doc.addImage(img, 'PNG', x, y, width, height);
                    resolve();
                };
                img.onerror = (error) => {
                    reject(error);
                };
            });
        };

        try {
            // Add company logo or name image (if any)
            await addImageToPDF(companyNameImage, 30, 20, 160, 25);

            doc.setFontSize(12);

            // Add customer details
            doc.text(`Customer Name: ${invoice.customerId?.name || 'Unknown'}`, marginLeft, 60);
            doc.text(`Bill Number: ${invoice.billNumber}`, 150, 60); // Right-aligned bill number

            // Add mobile number and date on the next line
            doc.text(`Mobile Number: ${invoice.customerId?.mobileNumber || 'Unknown'}`, marginLeft, 70);
            doc.text(`Bill Date: ${new Date(invoice.billDate).toLocaleDateString('en-GB')}`, 150, 70); // Right-aligned date

            // Prepare table data for products
            const tableData = invoice.products.map((product) => {
                const productName = product.product.ProductName || 'Unknown Product';
                return [productName, product.quantity, product.product.price.toFixed(2), product.total.toFixed(2)];
            });

            // Add table for products
            doc.autoTable({
                startY: 100,
                head: [['Product', 'Quantity', 'Price', 'Total']],
                body: tableData,
                headStyles: { fillColor: [41, 128, 185] }, // Custom header style
                styles: { fontSize: 10 },
                columnStyles: {
                    0: { cellWidth: 70 }, // Product column width
                    1: { cellWidth: 30 }, // Quantity column width
                    2: { cellWidth: 30 }, // Price column width
                    3: { cellWidth: 40 }, // Total column width
                }
            });

            // Add grand total below the table
            const finalY = doc.lastAutoTable.finalY || 100;
            doc.text(`Grand Total: ${invoice.grandtotal.toFixed(2)}`, marginLeft, finalY + 10);

            // Download the PDF
            doc.save(`invoice_${invoice.billNumber}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            setError('Error generating PDF. Please try again.');
        }
    };


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
                            onKeyDown={handleKeyDown}
                            placeholder="Enter customer name"
                            className="border rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />

                        {suggestions.length > 0 && (
                            <ul ref={suggestionBoxRef} className="absolute z-10 mt-10 w-96 bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                {suggestions.map((suggestion, index) => (
                                    <li
                                        key={suggestion.id}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className={`cursor-pointer px-4 py-2 ${index === selectedSuggestionIndex ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
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
                        <button
                            onClick={handleReset}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600"
                        >
                            Reset Form
                        </button>
                    </div>
                </form>

                {/* Error Handling */}
                {error && <div className="text-red-500 mb-4">{error}</div>}

                {/* Loading Indicator */}
                {loading && <div className="text-blue-500">Loading...</div>}

                <div id="printable-area" className="bg-white border rounded-lg p-3 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Left Side - Bill List */}
                        <div className="space-y-6">
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
                                        {searchResults.map((invoice, index) => (
                                            <tr key={index} className="hover:bg-gray-100 transition duration-150" onClick={() => handleInvoiceClick(invoice.id)}>
                                                <td className="px-6 py-4 whitespace-nowrap">{invoice.billNumber}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(invoice.billDate).toLocaleDateString('en-GB')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{invoice.customerId ? invoice.customerId.name : 'Unknown'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{invoice.grandtotal ? invoice.grandtotal.toFixed(2) : '0.00'}</td>
                                                <td className="px-0 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent row click
                                                            handleInvoiceDownload(invoice); // Only trigger download
                                                        }}
                                                        className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 flex items-center justify-center"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth="1.5"
                                                            stroke="currentColor"
                                                            className="w-5 h-5"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M3 16.5v1.875A2.625 2.625 0 005.625 21h12.75A2.625 2.625 0 0021 18.375V16.5M7.5 12l4.5 4.5m0 0l4.5-4.5m-4.5 4.5V3"
                                                            />
                                                        </svg>
                                                    </button>
                                                </td>
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
