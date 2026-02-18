module.exports = (func) => (req, res, next) => {
    Promise.resolve(func(req, res, next)).catch((err) => {
        // Ensure error is passed to error handler
        if (!res.headersSent) {
            next(err);
        } else {
            console.error('Error occurred after response was sent:', err);
        }
    });
};
