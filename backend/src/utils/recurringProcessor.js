const Transaction = require('../models/Transaction');
const RecurringTransaction = require('../models/RecurringTransaction');

const processRecurringTransactions = async (userId) => {
    const today = new Date();
    const rules = await RecurringTransaction.find({
        user: userId,
        isActive: true,
        nextDueDate: { $lte: today }
    });

    const newTransactions = [];

    for (const rule of rules) {
        // Create Transaction
        newTransactions.push({
            user: userId,
            name: rule.name,
            amount: rule.amount,
            category: rule.category,
            type: rule.type,
            date: rule.nextDueDate // Use the due date as transaction date
        });

        // Update Next Due Date
        let nextDate = new Date(rule.nextDueDate);
        if (rule.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        if (rule.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        if (rule.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        if (rule.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

        rule.nextDueDate = nextDate;
        await rule.save();
    }

    if (newTransactions.length > 0) {
        await Transaction.insertMany(newTransactions);
        console.log(`Generated ${newTransactions.length} recurring transactions for user ${userId}`);
    }
};

module.exports = processRecurringTransactions;
