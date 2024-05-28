const express = require('express');
const dotenv = require('dotenv');
const app = express();
const analyzeRoute = require('./routes/analyze');
const getSongsRoute = require('./routes/getSongs');
const searchRoute = require('./routes/search');

dotenv.config();

app.use(express.json());

app.use('/analyze-song', analyzeRoute);
app.use('/get-songs', getSongsRoute);
app.use('/search', searchRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
