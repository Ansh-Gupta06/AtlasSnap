const serverless = require('serverless-http');
const app = require('../../server/server');
const mongoose = require('mongoose');

// Ensure database connection in serverless environment
const MONGODB_URI = process.env.MONGODB_URI;

let conn = null;

module.exports.handler = async (event, context) => {
    console.log(`📡 Function called: ${event.httpMethod} ${event.path}`);
    // context.callbackWaitsForEmptyEventLoop = false;

    if (!MONGODB_URI) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'MONGODB_URI environment variable is missing' }),
        };
    }

    try {
        if (conn == null) {
            conn = await mongoose.connect(MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
            });
        }

        const handler = serverless(app);
        return await handler(event, context);
    } catch (error) {
        console.error('Lambda Error:', error);
        return {
            statusCode: 502,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
        };
    }
};
