import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import companyNameImage from '../images/Black Minimalist Spooky Youtube Thumbnail.png'; // Import your logo

const PayablePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allAccounts, setAllAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const tableRef = useRef();

  const fetchAllAccounts = async (retry = false) => {
    setLoading(true);
    try {
      const response = await fetch('https://krushnam-be.vercel.app/v1/user/customerAccount/');
      if (!response.ok) throw new Error('Failed to fetch all accounts');
      const result = await response.json();
      if (Array.isArray(result.data)) {
        setAllAccounts(result.data);
        setFilteredAccounts(result.data);
      } else {
        setAllAccounts([]);
        setFilteredAccounts([]);
      }
      setError(''); // Clear any previous error messages
    } catch (err) {
      if (!retry) {
        console.warn('Retrying fetchAllAccounts...');
        fetchAllAccounts(true); // Retry the API call once
      } else {
        setError('Error fetching all accounts.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAccounts();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    const filtered = allAccounts.filter((account) =>
        account.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredAccounts(filtered);
  };

  const handleSearchClick = () => {
    const filtered = allAccounts.filter((account) =>
        account.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAccounts(filtered);
  };

  const getTotalPendingAmountForAllAccounts = () => {
    return allAccounts.reduce((acc, account) => acc + account.totalCustomerPendingAmount, 0);
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Customer Accounts', 14, 10);
    doc.autoTable({
      head: [['Customer Name', 'Mobile Number', 'Pending Amount']],
      body: filteredAccounts.map((account) => [
        account.name,
        account.mobileNumber,
        account.totalCustomerPendingAmount.toFixed(2),
      ]),
    });
    doc.save('customer-accounts.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  // Sort filteredAccounts alphabetically by name (A to Z)
  const sortedAccounts = [...filteredAccounts].sort((a, b) =>
      a.name.localeCompare(b.name)
  );

  return (
      <div className="p-8 bg-gradient-to-br from-blue-100 to-purple-100 min-h-screen flex items-center justify-center relative">
        <div className="w-full max-w-5xl bg-white p-8 rounded-2xl shadow-xl relative">
          {/* Logo */}
          <div className="print-logo-container flex flex-col items-center justify-center mb-4">
            <img src={companyNameImage} alt="Company Logo" className="print-logo h-20 mb-4" />
          </div>

          {/* Home Button */}
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

          {/* Header */}
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

          {/* Search Box */}
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

          {/* Accounts Table */}
          <div className="printable overflow-auto rounded-lg shadow-md mt-4">
            <table className="min-w-full bg-white table-auto rounded-lg" ref={tableRef}>
              <thead>
              <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <th className="px-6 py-4 text-left text-md font-medium">Customer Name</th>
                <th className="px-6 py-4 text-left text-md font-medium">Mobile Number</th>
                <th className="px-6 py-4 text-left text-md font-medium">Pending Amount</th>
              </tr>
              </thead>
              <tbody>
              {sortedAccounts.length > 0 ? (
                  sortedAccounts.map((account) => (
                      <tr key={account._id} className="hover:bg-indigo-50 transition">
                        <td className="px-6 py-4">{account.name}</td>
                        <td className="px-6 py-4">{account.mobileNumber}</td>
                        <td className="px-6 py-4">
                          {account.totalCustomerPendingAmount.toFixed(2)}
                        </td>
                      </tr>
                  ))
              ) : (
                  <tr>
                    <td colSpan="3" className="text-center px-6 py-4 text-md font-medium text-gray-600">
                      No accounts found.
                      {loading && (
                          <div className="flex justify-center items-center mt-8">
                            <div className="relative flex justify-center items-center">
                              <div className="container">
                                <div className="folder">
                                  <div className="top"></div>
                                  <div className="bottom"></div>
                                </div>
                                <div className="title">please wait your data calculate ...</div>
                              </div>
                            </div>
                          </div>
                      )}
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          {/* Total Pending Amount */}
          <div className="mt-4 text-right text-lg font-bold text-gray-800">
            Total Pending Amount for All Accounts: {getTotalPendingAmountForAllAccounts().toFixed(2)}
          </div>



          {/* Error Message */}
          {error && <p className="text-red-600 mt-6 text-md font-semibold">{error}</p>}
        </div>
      </div>
  );
};

export default PayablePage;
