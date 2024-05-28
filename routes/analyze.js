const express = require('express');
const router = express.Router();
const dataStorage = require('../services/dataStorage');

router.post('/', (req, res) => {
    const { analysis, relative, analysisModTempo, relativeModTempo } = req.body;
    console.log('Received POST request with data:', JSON.stringify(req.body, null, 2));
    dataStorage.updateData(analysis, relative, analysisModTempo, relativeModTempo);
    res.json({ message: 'Analysis data received', data: dataStorage.getData() });
});

module.exports = router;
