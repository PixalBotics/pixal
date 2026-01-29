

require('dotenv').config();
const mongoose = require('mongoose');

function buildUriFromEnv() {
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '') {
        return process.env.MONGODB_URI;
    }

    const user = process.env.MONGO_USER;
    const pass = process.env.MONGO_PASS ? encodeURIComponent(process.env.MONGO_PASS) : '';
    const host = process.env.MONGO_HOST; // e.g. "pixal.a6nj0lb.mongodb.net/myDatabase?retryWrites=true&w=majority"

    if (!user || !pass || !host) return null;
    return `mongodb+srv://${user}:${pass}@${host}`;
}

const MONGO_URI = buildUriFromEnv();

const connectDB = async () => {
    if (!MONGO_URI) {
        console.error('MongoDB URI is not set. Provide MONGO_URI or MONGO_USER, MONGO_PASS and MONGO_HOST in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err.message || err);
        process.exit(1);
    }
};

module.exports = connectDB;
