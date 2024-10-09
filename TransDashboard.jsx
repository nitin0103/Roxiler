import React, { useState, useEffect } from 'react';

const TransactionDashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [month, setMonth] = useState('');

    useEffect(() => {
        // Fetch transaction data from the server API (Replace with your backend URL)
        const fetchTransactions = async () => {
            try {
                const response = await fetch(
                    `http://localhost:5000/transactions?search=${search}&page=${page}&perPage=${perPage}&month=${month}`
                );
                const data = await response.json();
                setTransactions(data.transactions);
            } catch (error) {
                console.error('Failed to fetch transactions', error);
            }
        };
        fetchTransactions();
    }, [page, perPage, search, month]);

    return (
        <div className="bg-blue-50 p-8 min-h-screen flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-6">Transaction Dashboard</h1>
            <div className="flex justify-between mb-4 w-full max-w-4xl">
                <input
                    type="text"
                    placeholder="Search transaction"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-yellow-200 py-2 px-4 rounded-md focus:outline-none"
                />
                <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="bg-yellow-200 py-2 px-4 rounded-md focus:outline-none"
                >
                    <option value="">Select Month</option>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                </select>
            </div>
            <table className="table-auto border-collapse border border-yellow-500 w-full max-w-4xl bg-yellow-100">
                <thead>
                    <tr className="bg-yellow-300">
                        <th className="border border-yellow-500 p-2">ID</th>
                        <th className="border border-yellow-500 p-2">Title</th>
                        <th className="border border-yellow-500 p-2">Description</th>
                        <th className="border border-yellow-500 p-2">Price</th>
                        <th className="border border-yellow-500 p-2">Category</th>
                        <th className="border border-yellow-500 p-2">Sold</th>
                        <th className="border border-yellow-500 p-2">Image</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction, index) => (
                        <tr key={index} className="text-center">
                            <td className="border border-yellow-500 p-2">{transaction._id}</td>
                            <td className="border border-yellow-500 p-2">{transaction.product_title}</td>
                            <td className="border border-yellow-500 p-2">{transaction.product_description}</td>
                            <td className="border border-yellow-500 p-2">${transaction.price}</td>
                            <td className="border border-yellow-500 p-2">{transaction.category || 'N/A'}</td>
                            <td className="border border-yellow-500 p-2">{transaction.sold ? 'Yes' : 'No'}</td>
                            <td className="border border-yellow-500 p-2">
                                <img src={transaction.image || 'default-image.jpg'} alt="Product" className="h-10 w-10 object-cover" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex justify-between mt-4 w-full max-w-4xl">
                <span>Page No: {page}</span>
                <div className="flex items-center">
                    <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        className="bg-yellow-200 py-1 px-3 rounded-md mx-2"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage((prev) => prev + 1)}
                        className="bg-yellow-200 py-1 px-3 rounded-md mx-2"
                    >
                        Next
                    </button>
                </div>
                <span>Per Page: {perPage}</span>
            </div>
        </div>
    );
};

export default TransDashboard;
