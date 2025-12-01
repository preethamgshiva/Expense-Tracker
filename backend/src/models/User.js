const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    categories: {
        type: [String],
        default: ["Food", "Transport", "Entertainment", "Bills", "Shopping", "Healthcare", "Education", "Other"]
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
