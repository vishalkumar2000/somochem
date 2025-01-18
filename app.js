const express = require('express');
const bodyParser = require('body-parser');
const ApiRoutes = require('./routes/ApiRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use('/nodeapi/v1', ApiRoutes)

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
