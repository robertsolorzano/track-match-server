const express = require('express');
const router = express.Router();
const { 
    searchTrack, 
    getAudioFeatures, 
    getRecommendedTracks, 
    getAudioFeaturesBatch 
} = require('../services/spotify');
const { getRelativeKey, getRelativeScale, modifyTempo } = require('../utils/helpers');

router.post('/', async (req, res) => {
    const { searchTerm } = req.body;
    console.log("Search Term Received:", searchTerm);

    try {
        const track = await searchTrack(searchTerm);
        if (!track) {
            return res.status(404).send({ error: 'Track not found' });
        }

        const audioFeatures = await getAudioFeatures(track.id);

        const originalFeatures = {
            key: audioFeatures.key,
            mode: audioFeatures.mode,
            tempo: audioFeatures.tempo
        };

        const relativeFeatures = {
            key: getRelativeKey(audioFeatures.key, audioFeatures.mode),
            mode: getRelativeScale(audioFeatures.mode),
            tempo: audioFeatures.tempo
        };

        const modifiedTempoFeatures = {
            key: audioFeatures.key,
            mode: audioFeatures.mode,
            tempo: modifyTempo(audioFeatures.tempo)
        };

        const relativeModifiedTempoFeatures = {
            key: getRelativeKey(audioFeatures.key, audioFeatures.mode),
            mode: getRelativeScale(audioFeatures.mode),
            tempo: modifyTempo(audioFeatures.tempo)
        };

        console.log('Track originalFeatures Object: ', originalFeatures);
        console.log('Track relativeFeatures Object: ', relativeFeatures);
        console.log('Track modifiedTempoFeatures Object: ', modifiedTempoFeatures);
        console.log('Track relativeModifiedTempoFeatures Object: ', relativeModifiedTempoFeatures);

        const initialRecommendations = await getRecommendedTracks([track.id]);

        const BATCH_SIZE = 20;
        let allAudioFeatures = [];
        for (let i = 0; i < initialRecommendations.length; i += BATCH_SIZE) {
            const batchIds = initialRecommendations.slice(i, i + BATCH_SIZE).map(track => track.id);
            try {
                const batchFeatures = await getAudioFeaturesBatch(batchIds);
                allAudioFeatures.push(...batchFeatures);
            } catch (err) {
                console.error(`Error fetching audio features for batch:`, err.message);
            }
        }

        const filteredOriginalRecommendations = allAudioFeatures.filter(feature => {
            return feature.key === originalFeatures.key &&
                feature.mode === originalFeatures.mode &&
                Math.abs(feature.tempo - originalFeatures.tempo) / originalFeatures.tempo <= 0.28;
        });

        const filteredRelativeRecommendations = allAudioFeatures.filter(feature => {
            return feature.key === relativeFeatures.key &&
                feature.mode === relativeFeatures.mode &&
                Math.abs(feature.tempo - relativeFeatures.tempo) / relativeFeatures.tempo <= 0.28;
        });

        const filteredModifiedTempoRecommendations = allAudioFeatures.filter(feature => {
            return feature.key === modifiedTempoFeatures.key &&
                feature.mode === modifiedTempoFeatures.mode &&
                Math.abs(feature.tempo - modifiedTempoFeatures.tempo) / modifiedTempoFeatures.tempo <= 0.28;
        });

        const filteredRelativeModifiedTempoRecommendations = allAudioFeatures.filter(feature => {
            return feature.key === relativeModifiedTempoFeatures.key &&
                feature.mode === relativeModifiedTempoFeatures.mode &&
                Math.abs(feature.tempo - relativeModifiedTempoFeatures.tempo) / relativeModifiedTempoFeatures.tempo <= 0.28;
        });

        console.log('Filtered Tracks - Original: ', filteredOriginalRecommendations.length);
        console.log('Filtered Tracks - Relative: ', filteredRelativeRecommendations.length);
        console.log('Filtered Tracks - Modified Tempo: ', filteredModifiedTempoRecommendations.length);
        console.log('Filtered Tracks - Relative Modified Tempo: ', filteredRelativeModifiedTempoRecommendations.length);

        const totalFilteredRecommendations = (
            filteredOriginalRecommendations.length +
            filteredRelativeRecommendations.length +
            filteredModifiedTempoRecommendations.length +
            filteredRelativeModifiedTempoRecommendations.length
        );

        console.log('Total Filtered Tracks - All: ', totalFilteredRecommendations);

        const response = {
            analysisSongs: filteredOriginalRecommendations,
            relativeSongs: filteredRelativeRecommendations,
            analysisNewTempoSongs: filteredModifiedTempoRecommendations,
            relativeNewTempoSongs: filteredRelativeModifiedTempoRecommendations,
            tracks: initialRecommendations,
            original: audioFeatures,
            originalTrack: track
        };

        res.send(response);

    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after'], 10);
            console.log(`Rate limit exceeded, retrying after ${retryAfter} seconds.`);
            return res.status(429).send({ error: 'Rate limit exceeded', retryAfter: retryAfter });
        } else {
            console.error('Error in /search endpoint:', error.message);
            return res.status(error.response ? error.response.status : 500).send({ error: error.message });
        }
    }
});

module.exports = router;
