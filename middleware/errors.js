const ErrorHandler = require("../utils/ErrorHandler");

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // MongoDB Specific Errors
    // CastError - Invalid ObjectId
    if (err.name === 'CastError') {
        const message = `Invalid ${err.path}: ${err.value}`;
        err = new ErrorHandler(message, 400);
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(error => error.message);
        const message = `Validation Error: ${messages.join(', ')}`;
        err = new ErrorHandler(message, 400);
    }

    // MongoDB Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const message = `Duplicate value for ${field}. Please use another value.`;
        err = new ErrorHandler(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        err = new ErrorHandler("Invalid token. Please log in again.", 401);
    }

    if (err.name === 'TokenExpiredError') {
        err = new ErrorHandler("Your token has expired. Please log in again.", 401);
    }

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            err = new ErrorHandler("File size is too large", 400);
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            err = new ErrorHandler("Unexpected field in file upload", 400);
        } else {
            err = new ErrorHandler(`File upload error: ${err.message}`, 400);
        }
    }

    // MySQL Error Handling (keeping for backward compatibility)
    if (err.code && typeof err.code === 'string') {
        switch (err.code) {
            case 'ER_DUP_ENTRY':
                err = new ErrorHandler("Duplicate entry error: " + err.sqlMessage, 400);
                break;

            case 'ER_NO_SUCH_TABLE':
                err = new ErrorHandler("The requested resource does not exist.", 404);
                break;

            case 'ER_PARSE_ERROR':
                err = new ErrorHandler("There was a syntax error in your SQL query.", 400);
                break;

            case 'ER_ACCESS_DENIED_ERROR':
                err = new ErrorHandler("Access denied for user.", 403);
                break;

            case 'ER_BAD_DB_ERROR':
                err = new ErrorHandler("Database does not exist.", 404);
                break;

            case 'ER_BAD_FIELD_ERROR':
                err = new ErrorHandler("Unknown column in the field list.", 400);
                break;

            case 'ER_NO_REFERENCED_ROW_2':
                err = new ErrorHandler("Foreign key constraint fails: referenced row not found.", 400);
                break;

            case 'ER_ROW_IS_REFERENCED_2':
                err = new ErrorHandler("Foreign key constraint fails: cannot delete or update a parent row.", 400);
                break;

            case 'ER_SYNTAX_ERROR':
                err = new ErrorHandler("Syntax error in the SQL statement.", 400);
                break;

            case 'ER_TIMEOUT':
                err = new ErrorHandler("Database operation timed out.", 503);
                break;

            // Connection errors
            case 'ECONNREFUSED':
                err = new ErrorHandler("Database connection was refused.", 503);
                break;

            case 'PROTOCOL_CONNECTION_LOST':
                err = new ErrorHandler("Database connection was closed.", 503);
                break;
        }
    }

    // Log error in development
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', {
            message: err.message,
            statusCode: err.statusCode,
            stack: err.stack,
            name: err.name,
            code: err.code
        });
    }

    // Send error response
    res.status(err.statusCode).json({
        success: false,
        message: err.message,
        ...(process.env.NODE_ENV !== 'production' && { 
            stack: err.stack,
            error: err 
        })
    });
};
