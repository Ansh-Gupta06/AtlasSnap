const serverless = require('serverless-http');
const app = require('../../server/server');
const mongoose = require('mongoose');

// Ensure database connection in serverless environment
const MONGODB_URI = process.env.MONGODB_URI;

let conn = null;

module.exports.handler = async (event, context) => {
    // context.callbackWaitsForEmptyEventLoop = false;

    if (conn == null) {
        conn = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
    }

    const handler = serverless(app);
    return handler(event, context);
};
