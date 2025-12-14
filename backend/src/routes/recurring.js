const express = require('express');
const router = express.Router();
const RecurringTransaction = require('../models/RecurringTransaction');
const { protect } = require('../middleware/authMiddleware');
const processRecurringTransactions = require('../utils/recurringProcessor');

// Get all recurring rules (and process due ones first)
router.get('/', protect, async (req, res) => {
    try {
        // Trigger processing
        await processRecurringTransactions(req.user._id);

        const rules = await RecurringTransaction.find({ user: req.user._id });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new recurring rule
router.post('/', protect, async (req, res) => {
    try {
        const { name, amount, category, type, frequency, startDate } = req.body;

        const start = startDate ? new Date(startDate) : new Date();

        const rule = await RecurringTransaction.create({
            user: req.user._id,
            name,
            amount,
            category,
            type,
            frequency,
            startDate: start,
            nextDueDate: start
        });

        // Trigger processing immediately
        await processRecurringTransactions(req.user._id);

        res.status(201).json(rule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete rule
router.delete('/:id', protect, async (req, res) => {
    try {
        const rule = await RecurringTransaction.findById(req.params.id);
        if (!rule) return res.status(404).json({ message: 'Rule not found' });
        if (rule.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await rule.deleteOne();
        res.json({ message: 'Recurring rule removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
