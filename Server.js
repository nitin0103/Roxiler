const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product_transactions';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Database Model
const transactionSchema = new mongoose.Schema({
    product_title: { type: String, required: true },
    product_description: { type: String },
    price: { type: Number, required: true },
    date_of_sale: { type: Date, required: true },
    sold: { type: Boolean, required: true }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// API to initialize the database with seed data
app.get('/initialize', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const data = response.data;
        await Transaction.insertMany(data);
        res.status(201).json({ message: 'Database initialized with seed data' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to initialize database' });
    }
});

// API to list transactions with search and pagination
app.get('/transactions', async (req, res) => {
    const { search = '', page = 1, perPage = 10, month = '' } = req.query;
    try {
        const query = {
            date_of_sale: { $regex: `-${month}-` },
            $or: [
                { product_title: { $regex: search, $options: 'i' } },
                { product_description: { $regex: search, $options: 'i' } },
                { price: { $regex: search, $options: 'i' } }
            ]
        };
        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));
        const total = await Transaction.countDocuments(query);
        res.json({ total, page: parseInt(page), perPage: parseInt(perPage), transactions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// API for statistics (total sales, sold items, unsold items)
app.get('/statistics', async (req, res) => {
    const { month } = req.query;
    if (!month) {
        return res.status(400).json({ error: 'Month parameter is required' });
    }
    try {
        const soldItems = await Transaction.countDocuments({ sold: true, date_of_sale: { $regex: `-${month}-` } });
        const notSoldItems = await Transaction.countDocuments({ sold: false, date_of_sale: { $regex: `-${month}-` } });
        const totalSalesAmount = await Transaction.aggregate([
            { $match: { sold: true, date_of_sale: { $regex: `-${month}-` } } },
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);
        res.json({
            total_sales_amount: totalSalesAmount[0]?.total || 0,
            sold_items_count: soldItems,
            not_sold_items_count: notSoldItems
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// API for bar chart data (price ranges)
app.get('/bar_chart', async (req, res) => {
    const { month } = req.query;
    if (!month) {
        return res.status(400).json({ error: 'Month parameter is required' });
    }

    const priceRanges = {
        '0-100': { min: 0, max: 100 },
        '101-200': { min: 101, max: 200 },
        '201-300': { min: 201, max: 300 },
        '301-400': { min: 301, max: 400 },
        '401-500': { min: 401, max: 500 },
        '501-600': { min: 501, max: 600 },
        '601-700': { min: 601, max: 700 },
        '701-800': { min: 701, max: 800 },
        '801-900': { min: 801, max: 900 },
        '901-above': { min: 901, max: Infinity }
    };

    try {
        const rangeData = {};
        for (const [key, range] of Object.entries(priceRanges)) {
            const count = await Transaction.countDocuments({
                price: { $gte: range.min, $lte: range.max },
                date_of_sale: { $regex: `-${month}-` }
            });
            rangeData[key] = count;
        }
        res.json(rangeData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bar chart data' });
    }
});

// API for pie chart data (unique categories)
app.get('/pie_chart', async (req, res) => {
    const { month } = req.query;
    if (!month) {
        return res.status(400).json({ error: 'Month parameter is required' });
    }
    try {
        const categoryData = await Transaction.aggregate([
            { $match: { date_of_sale: { $regex: `-${month}-` } } },
            { $group: { _id: '$product_title', count: { $sum: 1 } } }
        ]);
        res.json(categoryData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pie chart data' });
    }
});

// Combined API to fetch data from all the APIs
app.get('/combined_data', async (req, res) => {
    const { month } = req.query;
    if (!month) {
        return res.status(400).json({ error: 'Month parameter is required' });
    }

    try {
        const [statisticsResponse, barChartResponse, pieChartResponse] = await Promise.all([
            axios.get(`http://localhost:5000/statistics?month=${month}`),
            axios.get(`http://localhost:5000/bar_chart?month=${month}`),
            axios.get(`http://localhost:5000/pie_chart?month=${month}`)
        ]);

        res.json({
            statistics: statisticsResponse.data,
            bar_chart: barChartResponse.data,
            pie_chart: pieChartResponse.data
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch combined data' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
