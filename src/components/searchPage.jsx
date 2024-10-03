import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../images/SHREE.png';
import ConfirmationPopup from './ConfirmationPopup'; // Import the ConfirmationPopup component

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState(''); // For holding the search input
    const [searchResults, setSearchResults] = useState([]); // For holding the search results
    const [suggestions, setSuggestions] = useState([]); // For holding the suggestions
    const [loading, setLoading] = useState(false); // For showing a loading indicator
    const [error, setError] = useState(''); // For displaying any error messages
    const [showDeletePopup, setShowDeletePopup] = useState(false); // For controlling the delete popup
    const [invoiceToDelete, setInvoiceToDelete] = useState(null); // Invoice ID to delete
    const navigate = useNavigate();
    const suggestionBoxRef = useRef(null); // To handle click outside suggestion box
    const handleHome = () => {
        navigate('/');
    };
    // Refactored fetchInvoices function to reuse after deletion
    const fetchInvoices = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('https://shreeji-be.vercel.app/v1/user/invoice/');
            if (!response.ok) throw new Error('Failed to fetch invoices');
            const result = await response.json();
            setSearchResults(result.data || []);
        } catch (err) {
            setError('Error fetching invoice data. Please try again.');
            console.error('Error fetching invoice data:', err);
        }
        setLoading(false);
    };

    // Fetch all invoices when component mounts
    useEffect(() => {
        fetchInvoices();
    }, []);

    // Function to handle search input and show suggestions
    const handleSearchInputChange = async (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (value) {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`https://shreeji-be.vercel.app/v1/user/invoice/get-search/${value}`);
                if (!response.ok) throw new Error('Failed to fetch suggestions');
                const result = await response.json();
                setSuggestions(result.data || []); // Set suggestions for matching invoices
            } catch (err) {
                setError('Error fetching suggestions. Please try again.');
                console.error('Error fetching suggestions:', err);
            }
            setLoading(false);
        } else {
            setSuggestions([]); // Clear suggestions if input is empty
        }
    };

    // Function to handle suggestion click and navigate to the invoice page
    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion.customerId?.name); // Autofill input with the selected suggestion (customer name)
        setSuggestions([]); // Clear suggestions after selection
        handleInvoiceClick(suggestion.id); // Navigate to the InvoicePage when a suggestion is clicked
    };

    // Function to handle invoice row click and navigate to invoice page
    const handleInvoiceClick = async (invoiceId) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`https://shreeji-be.vercel.app/v1/user/invoice/${invoiceId}`);
            if (!response.ok) throw new Error('Failed to fetch invoice data');
            const result = await response.json();
            navigate('/invoice', { state: { invoiceData: result.data } }); // Navigate to InvoicePage
        } catch (error) {
            setError('Error fetching invoice data. Please try again.');
            console.error('Error fetching invoice data:', error);
        }
        setLoading(false);
    };

    // Function to handle search form submission
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`https://shreeji-be.vercel.app/v1/user/invoice/get-search/${searchQuery}`);
            if (!response.ok) throw new Error('Failed to fetch search results');
            const result = await response.json();
            setSearchResults(result.data || []);
            setSuggestions([]); // Clear suggestions after submitting the search
        } catch (err) {
            setError('Error fetching search results. Please try again.');
            console.error('Error fetching search results:', err);
        }
        setLoading(false);
    };

    // Function to open the delete confirmation popup
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
                const response = await fetch(`https://shreeji-be.vercel.app/v1/user/invoice/${invoiceToDelete}`, {
                    method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete invoice');

                // After deletion, refresh the invoice list
                await fetchInvoices(); // Refresh the list after deleting the invoice
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

    // Handle click outside the suggestion box to hide suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target)) {
                setSuggestions([]); // Hide suggestions when clicking outside
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [suggestionBoxRef]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-purple-500 to-indigo-500 p-8 rounded-xl mb-8 shadow-md max-w-4xl mx-auto">
                <div className="absolute top-0 left-0 w-full h-full bg-opacity-10 bg-white rounded-xl" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
                <div className="relative z-10 text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Search Invoices</h1>
                    <p className="text-lg font-light text-white">Find customer invoices by Name or bill number</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8 max-w-4xl mx-auto bg-white text-gray-900 shadow-lg rounded-lg">
                <h2 className="text-2xl font-semibold mb-6 text-purple-700">Search Invoices</h2>

                {/* Search Input Form */}
                <form onSubmit={handleSearch} className="mb-6 relative">
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            placeholder="Enter customer name, mobile number, or bill number"
                            className="flex-1 border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                            </svg>
                            <span>Search</span>
                        </button>
                        <button
                            onClick={handleHome}
                            className="bg-gradient-to-r from-purple-500 to-indigo-400 text-white py-2 px-4 rounded-lg shadow-md hover:bg-purple-600 flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-2 2v7a2 2 0 01-2 2H9a2 2 0 01-2-2v-7m10 0l2 2m-2-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v6" />
                            </svg>
                            <span>Home</span>
                        </button>
                    </div>

                    {/* Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                        <ul ref={suggestionBoxRef} className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                            {suggestions.map((suggestion) => (
                                <li
                                    key={suggestion._id}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="cursor-pointer px-4 py-2 hover:bg-gray-200"
                                >
                                    {suggestion.customerId.name} - {new Date(suggestion.billDate).toLocaleDateString('en-CA')}
                                </li>
                            ))}
                        </ul>
                    )}
                </form>

                {/* Show loading spinner */}
                {loading && (
                    <div className="flex justify-center items-center min-h-screen">
                        <div className="relative flex justify-center items-center">
                            <img src={logoImage} className="rounded-full h-28 w-28 bg-white animate-ping" alt="Loading" />
                        </div>
                    </div>
                )}

                {/* Show error message */}
                {error && <p className="text-red-600">{error}</p>}

                {/* Search Results Table */}
                {searchResults.length > 0 && (
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Bill Number</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Customer Name</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Grand Total</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {searchResults.map((invoice) => (
                            <tr
                                key={invoice._id || invoice.id}
                                onClick={() => handleInvoiceClick(invoice._id || invoice.id)}
                                className="cursor-pointer hover:bg-gray-100"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.billNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(invoice.billDate).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.customerId?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.grandtotal ? invoice.grandtotal.toFixed(2) : '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openDeletePopup(invoice._id || invoice.id);
                                        }}
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
                )}

                {/* Message if no search results found */}
                {!loading && searchResults.length === 0 && searchQuery && (
                    <p className="text-gray-700">No results found for "{searchQuery}".</p>
                )}

                {/* Confirmation Popup */}
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

export default SearchPage;
