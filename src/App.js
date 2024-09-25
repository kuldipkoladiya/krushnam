import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Firstpage from './components/firstpage';
import InvoicePage from './components/InvoicePage';
import SearchPage from './components/searchPage';
import MonthlyBillPage from './components/mounthly-bill'
import AccountsPage from './components/acccounts'
import PaymentPage from './components/paymentPage'
import ExtraBillpage from './components/extrabillpage'

const App = () => (
    <Router>
        <Routes>
            <Route path="/" element={<Firstpage />} />
            <Route path="/invoice" element={<InvoicePage />} />
            <Route path="/search" element={<SearchPage />} /> {/* Add new route */}
            <Route path="/monthly-bill" element={<MonthlyBillPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/payments" element={<PaymentPage />} />
            <Route path="/extra" element={<ExtraBillpage />} />
        </Routes>
    </Router>
);

export default App;