import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PayablePage = () => {
  const [searchQuery, setSearchQuery] = useState(''); // For holding the search input value
  const [allAccounts, setAllAccounts] = useState([]); // To store all customer accounts
  const [filteredAccounts, setFilteredAccounts] = useState([]); // To store filtered customer accounts
  const [loading, setLoading] = useState(false); // To handle loading state
  const [error, setError] = useState(''); // For error handling

  const navigate = useNavigate(); // Initialize navigate function
  const tableRef = useRef(); // To reference the table for printing

  // Fetch all customer accounts to display in the table
  const fetchAllAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://shreeji-be.vercel.app/v1/user/customerAccount/');
      if (!response.ok) throw new Error('Failed to fetch all accounts');
      const result = await response.json();

      // Check if result.data is an array and set the accounts accordingly
      if (Array.isArray(result.data)) {
        setAllAccounts(result.data);
        setFilteredAccounts(result.data); // Initially set filtered accounts to all accounts
      } else {
        setAllAccounts([]); // If it's not an array, set it to an empty array to avoid map issues
        setFilteredAccounts([]);
      }
    } catch (err) {
      setError('Error fetching all accounts.');
      console.error(err);
    }
    setLoading(false);
  };

  // Fetch all accounts when the component mounts
  useEffect(() => {
    fetchAllAccounts();
  }, []);

  // Handle search input change and filter accounts based on the input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Filter the accounts based on the search input (customer name)
    const filtered = allAccounts.filter((account) =>
        account.customerId.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredAccounts(filtered);
  };

  // Handle search button click
  const handleSearchClick = () => {
    const filtered = allAccounts.filter((account) =>
        account.customerId.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAccounts(filtered);
  };
  const getTotalPendingAmountForAllAccounts = () => {
    return allAccounts.reduce((acc, account) => {
      return acc + Math.round(account.totalPayable - account.totalAmountRecevied);
    }, 0);
  };
  // Handle Home button click to navigate to "/"
  const handleHomeClick = () => {
    navigate('/'); // Navigates to the home page ("/")
  };

  // Download PDF functionality
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Customer Accounts', 14, 10);
    doc.autoTable({
      head: [['Customer Name', 'Mobile Number', 'Pending Amount']],
      body: filteredAccounts.map((account) => [
        account.customerId.name,
        account.customerId.mobileNumber,
        Math.round(account.totalPayable - account.totalAmountRecevied)
      ])
    });
    doc.save('customer-accounts.pdf');
  };

  // Print functionality (only prints the table data)
  const handlePrint = () => {
    window.print();
  };

  return (
      <div className="p-8 bg-gradient-to-br from-blue-100 to-purple-100 min-h-screen flex items-center justify-center relative">
        <div className="w-full max-w-5xl bg-white p-8 rounded-2xl shadow-xl relative">

          {/* Home Button with Gradient */}
          <button
              onClick={handleHomeClick}
              className="fixed top-8 left-8 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-5 py-3 rounded-full shadow-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all flex items-center space-x-2"
          >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
              <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7m-2 2v7a2 2 0 01-2 2H9a2 2 0 01-2-2v-7m10 0l2 2m-2-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v6"
              />
            </svg>
            <span>Home</span>
          </button>

          {/* Compact Header Section */}
          <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-xl mb-6 shadow-md">
            <div className="absolute top-0 left-0 w-full h-full bg-opacity-10 bg-white rounded-xl" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
            <div className="relative z-10 text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 9H7a2 2 0 01-2-2V7a2 2 0 012-2h3.28a1 1 0 00.8-.4l1.92-2.56A1 1 0 0114.72 2H17a2 2 0 012 2v2a2 2 0 01-2 2h-1" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">Customer Billing Dashboard</h1>
              <p className="text-base text-white font-light">Manage customer accounts, billing details, and payments effectively.</p>
            </div>
          </div>

          {/* Search Box with Button */}
          <div className="mb-8">
            <label className="block text-lg text-gray-800 font-semibold mb-2 text-center" htmlFor="customerSearch">Search Customer</label>
            <div className="flex items-center justify-center">
              <input
                  type="text"
                  id="customerSearch"
                  className="w-full max-w-3xl px-5 py-3 text-lg border-2 border-indigo-300 rounded-full shadow-sm focus:outline-none focus:ring-3 focus:ring-indigo-400 transition-all duration-150"
                  value={searchQuery}
                  onChange={handleInputChange} // Filter accounts on input change
                  placeholder="Enter customer name..."
              />
              <button
                  onClick={handleSearchClick}
                  className="ml-3 bg-indigo-600 text-white p-3 rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Download PDF and Print Buttons */}
          <div className="mb-8 flex justify-end space-x-4">
            <button
                onClick={handleDownloadPDF}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-600"
            >
              Download PDF
            </button>
            <button
                onClick={handlePrint}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-600"
            >
              Print
            </button>
          </div>

          {/* All Customer Accounts Table (Wrapped in Printable Class) */}
          <div className="printable overflow-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white table-auto rounded-lg" ref={tableRef}>
              <thead>
              <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <th className="px-6 py-4 text-left text-md font-medium">Customer Name</th>
                <th className="px-6 py-4 text-left text-md font-medium">Mobile Number</th>
                <th className="px-6 py-4 text-left text-md font-medium">Pending Amount</th>
              </tr>
              </thead>
              <tbody>
              {Array.isArray(filteredAccounts) && filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-indigo-50 transition duration-150 ease-in-out text-gray-700">
                        <td className="px-6 py-4 text-md font-medium">{account.customerId.name}</td>
                        <td className="px-6 py-4">{account.customerId.mobileNumber}</td>
                        <td className="px-6 py-4">{Math.round(account.totalPayable - account.totalAmountRecevied)}</td>
                      </tr>
                  ))
              ) : (
                  <tr>
                    <td colSpan="3" className="text-center px-6 py-4 text-md font-medium text-gray-600">No accounts found.</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          {/* Display Total Pending Amount for All Accounts */}
          <div className="mt-4 text-right text-lg font-bold text-gray-800">
            Total Pending Amount for All Accounts: ₹{getTotalPendingAmountForAllAccounts().toFixed(2)}
          </div>

          {/* Loading Spinner */}
          {loading && (
              <div className="flex justify-center items-center mt-8">
                <div className="relative flex justify-center items-center">
                  <p className="text-lg text-indigo-700 font-semibold">Loading...</p>
                </div>
              </div>
          )}

          {/* Error Message */}
          {error && <p className="text-red-600 mt-6 text-md font-semibold">{error}</p>}
        </div>
      </div>
  );
};

export default PayablePage;
