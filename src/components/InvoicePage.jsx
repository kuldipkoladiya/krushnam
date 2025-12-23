import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import companyNameImage from '../images/Black Minimalist Spooky Youtube Thumbnail.png'; // Ensure correct path

const InvoicePage = () => {
    const { state } = useLocation();
    const [invoiceData, setInvoiceData] = useState(null);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!state?.invoiceData) {
            navigate('/');
            return;
        }

        setInvoiceData(state.invoiceData);

        const fetchProducts = async () => {
            try {
                const response = await fetch('https://krushnam-be.vercel.app/v1/user/product/');
                if (!response.ok) throw new Error('Failed to fetch products');
                const productData = await response.json();
                setAvailableProducts(productData.data || []);
            } catch (error) {
                setError('Error fetching product data. Please try again.');
                console.error('Error fetching product data:', error);
            }
        };

        fetchProducts();
    }, [state, navigate]);

    const generatePDF = async () => {
        if (!invoiceData) return;

        const doc = new jsPDF();
        doc.setFontSize(20);

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
            await addImageToPDF(companyNameImage, 30, 20, 160, 25);

            doc.setFontSize(12);
            doc.text(`Customer Name: ${invoiceData.customerId?.name || invoiceData.customerName}`, 20, 60);
            doc.text(`Bill Number: ${invoiceData.billNumber}`, 150, 60);

            doc.text(`Mobile Number: ${invoiceData.customerId?.mobileNumber || invoiceData.mobileNo}`, 20, 70);
            doc.text(`Bill Date: ${new Date(invoiceData.billDate).toLocaleDateString('en-CA')}`, 150, 70);

            const tableData = invoiceData.products?.map(product => {
                const matchedProduct = availableProducts.find(p => p.id === product.product || p.id === product.product?.id);
                const productName = matchedProduct ? matchedProduct.ProductName : 'Unknown Product';
                return [productName, product.quantity, product.total.toFixed(2)];
            }) || [];

            doc.autoTable({
                startY: 100,
                head: [['Product', 'Quantity', 'Total']],
                body: tableData,
            });

            doc.text(`Grand Total: ${invoiceData.grandtotal?.toFixed(2)}`, 20, doc.lastAutoTable.finalY + 10);
            doc.save(`invoice_${invoiceData.billNumber}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            setError('Error generating PDF. Please try again.');
        }
    };


    const handlePrint = () => {
        window.print();
    };

    const handleNewBill = () => {
        navigate('/');
    };

    const handleUpdate = () => {
        navigate('/', { state: { invoiceData } });
    };
    const handleHome = () => {
        navigate('/');
    };
    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-600">{error}</div>;
    if (!invoiceData) return <div>No invoice data available</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto bg-white text-gray-900 shadow-lg rounded-lg">
            <div className="flex justify-between items-center mb-8 ml-[12px]">
                <img src={companyNameImage} alt="Company Name" className="h-24 w-auto" />
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Invoice Details</h2>
                <div className="flex justify-between text-lg">
                    <p>
                        <span className="font-semibold">Customer Name:</span> {invoiceData.customerId?.name || invoiceData.customerName}
                    </p>
                    <p>
                        <span className="font-semibold">Bill Number:</span> {invoiceData.billNumber}
                    </p>
                </div>
                <div className="flex justify-between text-lg">
                    <p>
                        <span className="font-semibold">Mobile Number:</span> {invoiceData.customerId?.mobileNumber || invoiceData.mobileNo}

                    </p>
                    <p>
                        <span className="font-semibold">Bill Date:</span> {new Date(invoiceData.billDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
                    </p>
                </div>
            </div>


            <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Products</h2>
                <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                    <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Total</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {invoiceData.products?.map((product, index) => {
                        const productName = availableProducts.find(p => p.id === product.product)?.ProductName ||  availableProducts.find(p => p.id === product.product?.id)?.ProductName;
                        return (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{productName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.total?.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Grand Total</h2>
                <p className="text-3xl font-bold text-purple-700">{invoiceData.grandtotal?.toFixed(2)}</p>
            </div>

            <div className="flex space-x-4">
                <button
                    onClick={generatePDF}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Download PDF
                </button>

                <button
                    onClick={handlePrint}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                    Print Invoice
                </button>

                <button
                    onClick={handleNewBill}
                    className="bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    Create New Bill
                </button>

                <button
                    onClick={handleUpdate}
                    className="bg-yellow-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                    Update Invoice
                </button>
                <button
                    onClick={handleHome}
                    className="bg-purple-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    Home
                </button>
            </div>
        </div>
    );
};

export default InvoicePage;
