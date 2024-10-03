import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import name from '../images/Black Minimalist Spooky Youtube Thumbnail.png';
import Popup from "./invoicepopup";

const Firstpage = () => {
    const [billNo, setBillNo] = useState(1);
    const [customerName, setCustomerName] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [billDate, setBillDate] = useState('');
    const [products, setProducts] = useState([{ productId: '', productName: '', quantity: '', price: 0, extraCharge: 0, total: 0 }]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [customerId, setCustomerId] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();
    const [invoiceId, setInvoiceId] = useState(null);
    const location = useLocation(); // To access passed state
    const suggestionBoxRef = useRef(null); // To handle click outside suggestion box
    const [activeProductIndex, setActiveProductIndex] = useState(null);
    const [popupVisible, setPopupVisible] = React.useState(false);
    const [popupMessage, setPopupMessage] = React.useState('');
    const [isSuccess, setIsSuccess] = React.useState(true);

    useEffect(() => {
        const lastBillNo = localStorage.getItem('lastBillNo');
        const parsedBillNo = lastBillNo ? parseInt(lastBillNo, 10) : 0;
        setBillNo(parsedBillNo);
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('https://shreeji-be.vercel.app/v1/user/product/');
                if (!response.ok) throw new Error('Failed to fetch products');
                const productData = await response.json();
                setAvailableProducts(Array.isArray(productData.data) ? productData.data : []);
            } catch (error) {
                console.error('Error fetching product data:', error);
            }
        };
        fetchProducts();
    }, []);

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

    useEffect(() => {
        if (customerName.length > 1) {
            const matchedCustomers = customers.filter(customer => customer.name.toLowerCase().includes(customerName.toLowerCase()));
            setCustomerSuggestions(matchedCustomers);
            setShowSuggestions(true);
        } else {
            setCustomerSuggestions([]);
            setShowSuggestions(false);
        }
    }, [customerName, customers]);
    const handleReset = () => {
        setCustomerName('');  // Reset customer name
        setMobileNo('');      // Reset mobile number
        setBillDate('');      // Reset bill date
        setProducts([{
            productId: '',
            quantity: '',
            price: '',
            total: 0
        }]);  // Reset products (adjust based on your products array structure)

    };
    useEffect(() => {
        // Pre-fill form if invoiceData is available in the location state
        if (location.state && location.state.invoiceData) {
            const { invoiceData } = location.state;
            console.log("=====invoiceData====>", invoiceData)
            setBillNo(invoiceData.billNumber);
            setCustomerName(invoiceData.customerName || invoiceData.customerId?.name || '');
            setMobileNo(invoiceData.mobileNo || invoiceData.customerId?.mobileNumber || '');
            setBillDate(new Date(invoiceData.billDate).toLocaleDateString('en-CA') || '');
            setProducts(invoiceData.products.map(productEntry => ({
                productId: productEntry.productId || productEntry.product?.id || productEntry.product || '',
                productName: productEntry.productName || productEntry.product?.ProductName || '',
                quantity: productEntry.quantity || productEntry.product.quantity || '',
                price: productEntry.product?.price || productEntry.product.price || 0,
                extraCharge: productEntry.product?.sheetcharges ||productEntry.sheetcharges || 0,
                total: productEntry.total || 0
            })));
            setInvoiceId(invoiceData.id);
        }
    }, [location.state]);

    const handleCustomerNameChange = (e) => {
        const name = e.target.value;
        setCustomerName(name);
        setSelectedSuggestionIndex(-1);

        const matchedCustomer = customers.find(customer => customer.name.toLowerCase() === name.toLowerCase());
        if (matchedCustomer) {
            setMobileNo(matchedCustomer.mobileNumber);
            setCustomerId(matchedCustomer.id);
        } else {
            setMobileNo('');
            setCustomerId(null);
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

    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...products];
        const productToUpdate = { ...updatedProducts[index], [field]: value };
        if (['quantity', 'price', 'extraCharge'].includes(field)) {
            productToUpdate.total =
                (parseFloat(productToUpdate.quantity) || 0) *
                (parseFloat(productToUpdate.price) || 0) +
                (parseFloat(productToUpdate.extraCharge) || 0);
        }

        updatedProducts[index] = productToUpdate;
        setProducts(updatedProducts);
        if (field === 'productId') fetchProductDetails(value, index);
    };

    const fetchProductDetails = async (productId, index) => {
        const selectedProduct = availableProducts.find((p) => p.id === productId);
        if (selectedProduct) {
            const updatedProducts = [...products];
            updatedProducts[index] = {
                ...updatedProducts[index],
                productId: selectedProduct.id,
                productName: selectedProduct.ProductName,
                price: selectedProduct.price,
                extraCharge: selectedProduct.sheetcharges,
                total:
                    (parseFloat(updatedProducts[index].quantity) || 0) *
                    (parseFloat(selectedProduct.price) || 0) +
                    (parseFloat(selectedProduct.sheetcharges) || 0),
            };
            setProducts(updatedProducts);
        } else {
            console.error('Product not found');
        }
    };

    const handleAddProduct = () => {
        const defaultProduct = availableProducts[0] || { id: '', ProductName: '', price: 0, sheetcharges: 0 };
        const newProduct = {
            productId: defaultProduct.id,
            productName: defaultProduct.ProductName,
            quantity: '',
            price: defaultProduct.price,
            extraCharge: defaultProduct.sheetcharges,
            total: 0
        };
        setProducts([...products, newProduct]);
    };

    const handleRemoveProduct = (index) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const grandTotal = products.reduce((acc, product) => acc + (product.total || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerName || products.some(p => !p.productId || !p.quantity || !p.price)) {
            alert('Please fill in all the required fields.');
            return;
        }


        const selectedBillDate = billDate || new Date().toISOString().split('T')[0];
        setBillDate(selectedBillDate);

        const customerData = { name: customerName, mobileNumber: mobileNo };

        try {
            let customerIdToUse = customerId;

            // Create new customer if not found
            if (!customerIdToUse) {
                const customerResponse = await fetch('https://shreeji-be.vercel.app/v1/user/customer/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customerData),
                });

                if (!customerResponse.ok) {
                    const errorText = await customerResponse.text();
                    console.error('Customer creation error:', errorText);
                    throw new Error('Failed to create customer');
                }
                const customerResult = await customerResponse.json();
                console.log("=====customerResult====>", customerResult); // Log the entire response
                customerIdToUse = customerResult.data.id; // Access the ID from the response
                console.log("=====customerIdToUse====>", customerIdToUse);
            } else {
                // Fetch existing customer to ensure we have the latest data
                const fetchCustomerResponse = await fetch(`https://shreeji-be.vercel.app/v1/user/customer/${customerIdToUse}`);
                if (!fetchCustomerResponse.ok) {
                    const errorText = await fetchCustomerResponse.text();
                    console.error('Fetch customer error:', errorText);
                    throw new Error('Failed to fetch customer');
                }

                const fetchedCustomer = await fetchCustomerResponse.json();
                customerIdToUse = fetchedCustomer.data.id; // Use the fetched ID
            }

            // Create customer account
            const accountResponse = await fetch('https://shreeji-be.vercel.app/v1/user/customerAccount/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customerIdToUse,
                    totalAmountRecevied: 0
                }),
            });

            if (!accountResponse.ok) {
                const errorText = await accountResponse.text();
                console.error('Customer account creation error:', errorText);
                throw new Error('Failed to create customer account');
            }

            const invoiceData = {
                billNumber: billNo,
                customerId: customerIdToUse,
                billDate: selectedBillDate,
                products: products.map((product) => ({
                    product: product.productId,
                    quantity: product.quantity,
                    total: product.total,
                })),
                grandtotal: grandTotal,
            };

            const invoiceResponse = await fetch('https://shreeji-be.vercel.app/v1/user/invoice/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData),
            });

            if (!invoiceResponse.ok) throw new Error('Failed to create invoice');



            navigate('/invoice', { state: { invoiceData: { ...invoiceData, customerName, mobileNo } } });
            const newBillNo = billNo + 1;
            setBillNo(newBillNo);
            localStorage.setItem('lastBillNo', newBillNo);

        } catch (error) {
            console.error('Error saving invoice:', error);
            alert(`Error saving invoice: ${error.message}`);
        }
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
        const activeElement = document.activeElement;

        if (activeElement.matches('select')) {
            switch (e.key) {
                case 'ArrowDown':
                    if (selectedSuggestionIndex < customerSuggestions.length - 1) {
                        setSelectedSuggestionIndex(prev => prev + 1);
                    }
                    break;
                case 'ArrowUp':
                    if (selectedSuggestionIndex > 0) {
                        setSelectedSuggestionIndex(prev => prev - 1);
                    }
                    break;
                case 'Enter':
                    if (selectedSuggestionIndex >= 0) {
                        const selectedCustomer = customerSuggestions[selectedSuggestionIndex];
                        setCustomerName(selectedCustomer.name);
                        setMobileNo(selectedCustomer.mobileNumber);
                        setCustomerId(selectedCustomer.id);
                        setShowSuggestions(false);
                    }
                    break;
                case '+':
                    handleAddProduct();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    if (activeProductIndex !== null) {
                        const num = parseInt(e.key, 10);
                        const product = availableProducts[num - 1];
                        if (product) {
                            handleProductChange(activeProductIndex, 'productId', product.id);
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    };

    const handleSuggestionClick = (customer) => {
        setCustomerName(customer.name);
        setMobileNo(customer.mobileNumber);
        setCustomerId(customer.id);
        setShowSuggestions(false);
    };
    const handleUpdate = async (e) => {
        e.preventDefault();

        // Check for required fields
        if (!customerName || products.some(p => !p.productId || !p.quantity || !p.price)) {
            alert('Please fill in all the required fields.');
            return;
        }

        // Validate product IDs
        // const invalidProductIds = products.filter(product => !product.productId).map(product => product.productId);
        // if (invalidProductIds.length > 0) {
        //     alert('Some products have invalid IDs. Please check your product selections.');
        //     return;
        // }

        const selectedBillDate = billDate || new Date().toISOString().split('T')[0];
        setBillDate(selectedBillDate);

        const customerData = { name: customerName, mobileNumber: mobileNo };

        try {
            let customerIdToUse = customerId;

            // Update existing customer
            if (customerIdToUse) {
                await fetch(`https://shreeji-be.vercel.app/v1/user/customer/${customerIdToUse}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customerData),
                });
            }

            // Prepare invoice data
            const invoiceData = {
                billNumber: billNo,
                billDate: selectedBillDate,
                customerId: customerIdToUse,
                products: products.map((product) => ({
                    product: product.productId,
                    quantity: product.quantity,
                    total: product.total, // Include total if required
                })),
                grandtotal: grandTotal,
            };

            // Update invoice
            const invoiceResponse = await fetch(`https://shreeji-be.vercel.app/v1/user/invoice/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData),
            });

            if (!invoiceResponse.ok) throw new Error('Failed to update invoice');
            setIsSuccess(true);
            setPopupMessage('Invoice updated successfully');
            setPopupVisible(true);
            navigate('/invoice', { state: { invoiceData: { ...invoiceData, customerName, mobileNo } } });
        } catch (error) {
            console.error('Error updating invoice:', error);
            setIsSuccess(false);
            setPopupMessage(`Error updating invoice: ${error.message}`);
            setPopupVisible(true);
        }
    };



    return (
        <div className="p-8 bg-gradient-to-br from-blue-100 to-purple-100 min-h-screen flex items-center justify-center">
            <div className="w-full max-w-5xl bg-white p-8 rounded-2xl shadow-xl">
                <div className="flex flex-col items-center justify-center mb-8">
                    <img src={name} alt="Shreeji" className="h-20 mb-4" />
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-wrap justify-center space-x-4 mb-12">
                    {[
                        { label: "Other Bills", route: "/extra", gradient: "from-yellow-400 to-orange-400" },
                        { label: "Customer Payments", route: "/payments", gradient: "from-purple-400 to-pink-400" },
                        { label: "Search Invoices", route: "/search", gradient: "from-blue-600 to-blue-400" },
                        { label: "Get Monthly Bill", route: "/monthly-bill", gradient: "from-purple-600 to-purple-400" },
                        { label: "Accounts", route: "/accounts", gradient: "from-green-600 to-green-400" },
                        { label: "Payable", route: "/Payable", gradient: "from-indigo-600 to-indigo-400" },
                    ].map((button) => (
                        <button
                            key={button.label}
                            className={`bg-gradient-to-r ${button.gradient} text-white py-3 px-5 rounded-full shadow-lg text-sm transform transition-transform hover:scale-105`}
                            onClick={() => navigate(button.route)}
                        >
                            {button.label}
                        </button>
                    ))}
                </div>

                {/* Invoice Form */}
                <form onSubmit={handleSubmit} className="space-y-10" onKeyDown={handleKeyDown}>
                    <div className="bg-gray-50 p-8 rounded-lg shadow-md border border-gray-300">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Bill Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Bill No:</label>
                                <input
                                    type="text"
                                    value={billNo}
                                    readOnly
                                    className="w-full border-2 border-gray-300 p-4 mt-2 bg-gray-100 text-gray-900 shadow-sm rounded-full focus:outline-none  focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600">Customer Name:</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={handleCustomerNameChange}
                                    className="w-full border-2 border-gray-300 rounded-full p-4 mt-2 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Customer Name"
                                />
                                {showSuggestions && customerSuggestions.length > 0 && (
                                    <ul className="absolute bg-white border border-gray-300 mt-2 w-full max-h-48 overflow-y-auto z-10 shadow-md rounded-lg">
                                        {customerSuggestions.map((customer, index) => (
                                            <li
                                                key={customer.id}
                                                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                                                    selectedSuggestionIndex === index ? "bg-gray-200" : ""
                                                }`}
                                                onClick={() => handleSuggestionClick(customer)}
                                            >
                                                {customer.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Mobile No:</label>
                                <input
                                    type="text"
                                    value={mobileNo}
                                    onChange={(e) => setMobileNo(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-full p-4 mt-2 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Mobile No."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Bill Date:</label>
                                <input
                                    type="date"
                                    value={billDate}
                                    onChange={(e) => setBillDate(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-full p-4 mt-2 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Product Section */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-300">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Product Details</h2>
                        {products.map((product, index) => (
                            <div key={index} className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Product:</label>
                                    <select
                                        onFocus={() => setActiveProductIndex(index)}
                                        value={product.productId}
                                        onChange={(e) => handleProductChange(index, "productId", e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-full p-4 mt-2 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Product</option>
                                        {availableProducts.map((prod) => (
                                            <option key={prod.id} value={prod.id}>
                                                {prod.ProductName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Quantity:</label>
                                    <input
                                        type="number"
                                        value={product.quantity}
                                        onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-full p-4 mt-2 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter Quantity"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Price:</label>
                                    <input
                                        type="number"
                                        value={product.price}
                                        onChange={(e) => handleProductChange(index, "price", e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-full p-4 mt-2 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter Price"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Extra Charges:</label>
                                    <input
                                        type="number"
                                        value={product.extraCharge}
                                        onChange={(e) => handleProductChange(index, "extraCharge", e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-full p-4 mt-2 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Extra Charges"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Total:</label>
                                    <input
                                        type="number"
                                        value={product.total}
                                        readOnly
                                        className="w-full border-2 border-gray-300 rounded-full p-4 mt-2 bg-gray-100 shadow-sm"
                                    />
                                </div>
                                {index === products.length - 1 && (
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProduct(index)}
                                            className="bg-red-500 hover:bg-red-600 text-white py-3 px-5 rounded-full shadow-md transition-transform transform hover:scale-105"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddProduct}
                            className="bg-green-500 hover:bg-green-600 text-white py-2 px-5 rounded-full shadow-md transition-transform transform hover:scale-105"
                        >
                            Add Product
                        </button>
                    </div>

                    {/* Grand Total */}
                    <div className="flex justify-end mt-8">
                        <h2 className="text-2xl font-semibold text-gray-800">Grand Total: ₹{grandTotal.toFixed(2)}</h2>
                    </div>

                    {/* Form Buttons */}
                    <div className="flex justify-end space-x-4 mt-8">
                        <button
                            type="submit"
                            className="bg-teal-500 hover:bg-teal-600 text-white py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105"
                        >
                            Submit Invoice
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdate}
                            className="bg-rose-500 hover:bg-rose-600 text-white py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105"
                        >
                            Update Invoice
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105"
                        >
                            Reset
                        </button>
                    </div>
                </form>

                {popupVisible && <Popup message={popupMessage} isSuccess={isSuccess} onClose={() => setPopupVisible(false)} />}
            </div>
        </div>

    );
};

export default Firstpage;
