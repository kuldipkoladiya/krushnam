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
        <div className="p-8 max-w-4xl mx-auto bg-white text-gray-900 shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold mb-6">Search Invoices</h2>

            {/* Search Input Form */}
            <form onSubmit={handleSearch} className="mb-6 relative">
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchInputChange} // Handle input changes to show suggestions
                        placeholder="Enter customer name, mobile number, or bill number"
                        className="flex-1 border rounded-lg p-3 bg-white"
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Search
                    </button>
                    <button
                        onClick={handleHome}
                        className="bg-purple-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        Home
                    </button>
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                    <ul ref={suggestionBoxRef} className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                        {suggestions.map((suggestion) => (
                            <li
                                key={suggestion._id}
                                onClick={() => handleSuggestionClick(suggestion)} // Handle suggestion click
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
                            onClick={() => handleInvoiceClick(invoice._id || invoice.id)} // Handle row click
                            className="cursor-pointer hover:bg-gray-100"
                        >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.billNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(invoice.billDate).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.customerId?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {invoice.grandtotal !== undefined ? invoice.grandtotal.toFixed(2) : '0.00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent row click event
                                        openDeletePopup(invoice._id || invoice.id); // Handle delete click
                                    }}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-red-600"
                                >
                                    Delete
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
    );
};

export default SearchPage;
