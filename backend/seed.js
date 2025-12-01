const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Transaction = require('./src/models/Transaction');
const connectDB = require('./src/config/db');

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        // Test User Credentials
        const email = 'test@example.com';
        const password = 'password123';
        const username = 'Test User';

        // Check if user exists and delete
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await Transaction.deleteMany({ user: existingUser._id });
            await User.deleteOne({ _id: existingUser._id });
            console.log('Existing test user and transactions deleted.');
        }

        // Create new user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            categories: ["Food", "Transport", "Entertainment", "Bills", "Shopping", "Healthcare", "Education", "Other"]
        });

        console.log(`User created: ${user.username}`);

        // Generate Transactions
        const transactions = [];

        // Helper to create date
        const getDate = (monthOffset, day) => {
            const d = new Date();
            d.setMonth(d.getMonth() + monthOffset);
            d.setDate(day);
            return d;
        };

        // Current Month (0 offset)
        transactions.push(
            { user: user._id, name: 'Salary', amount: 50000, category: 'Other', type: 'income', date: getDate(0, 1) },
            { user: user._id, name: 'Rent', amount: -15000, category: 'Bills', type: 'expense', date: getDate(0, 2) },
            { user: user._id, name: 'Groceries', amount: -2500, category: 'Food', type: 'expense', date: getDate(0, 5) },
            { user: user._id, name: 'Uber', amount: -450, category: 'Transport', type: 'expense', date: getDate(0, 7) },
            { user: user._id, name: 'Movie Night', amount: -1200, category: 'Entertainment', type: 'expense', date: getDate(0, 10) },
            { user: user._id, name: 'Groceries', amount: -1800, category: 'Food', type: 'expense', date: getDate(0, 15) },
            { user: user._id, name: 'Internet Bill', amount: -1000, category: 'Bills', type: 'expense', date: getDate(0, 20) },
            { user: user._id, name: 'Dinner Out', amount: -2500, category: 'Food', type: 'expense', date: getDate(0, 25) }
        );

        // Previous Month (-1 offset)
        transactions.push(
            { user: user._id, name: 'Salary', amount: 48000, category: 'Other', type: 'income', date: getDate(-1, 1) },
            { user: user._id, name: 'Rent', amount: -15000, category: 'Bills', type: 'expense', date: getDate(-1, 2) },
            { user: user._id, name: 'Groceries', amount: -4000, category: 'Food', type: 'expense', date: getDate(-1, 5) },
            { user: user._id, name: 'Bus Pass', amount: -800, category: 'Transport', type: 'expense', date: getDate(-1, 8) },
            { user: user._id, name: 'Concert', amount: -3000, category: 'Entertainment', type: 'expense', date: getDate(-1, 12) },
            { user: user._id, name: 'Electricity', amount: -1200, category: 'Bills', type: 'expense', date: getDate(-1, 20) }
        );

        // Two Months Ago (-2 offset)
        transactions.push(
            { user: user._id, name: 'Salary', amount: 48000, category: 'Other', type: 'income', date: getDate(-2, 1) },
            { user: user._id, name: 'Rent', amount: -15000, category: 'Bills', type: 'expense', date: getDate(-2, 2) },
            { user: user._id, name: 'Groceries', amount: -3500, category: 'Food', type: 'expense', date: getDate(-2, 6) }
        );

        await Transaction.insertMany(transactions);
        console.log(`${transactions.length} transactions created.`);

        console.log('Seeding completed successfully.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();
