const Transaction = require('../models/Transaction');

// @desc    Get transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.status(200).json(transactions);
};

// @desc    Add transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res) => {
    const { name, amount, category, type, date } = req.body;

    if (!amount || !category || !type || !date) {
        return res.status(400).json({ message: 'Please add all required fields' });
    }

    const transaction = await Transaction.create({
        user: req.user.id,
        name,
        amount,
        category,
        type,
        date,
    });

    res.status(201).json(transaction);
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check for user
    if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
    }

    // Make sure the logged in user matches the transaction user
    if (transaction.user.toString() !== req.user.id) {
        return res.status(401).json({ message: 'User not authorized' });
    }

    await transaction.deleteOne();

    res.status(200).json({ id: req.params.id });
};

module.exports = {
    getTransactions,
    addTransaction,
    deleteTransaction,
};
