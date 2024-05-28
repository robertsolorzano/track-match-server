const express = require('express');
const router = express.Router();
const { getRecommendedTracks, getAudioFeaturesBatch, searchTrack } = require('../services/spotify');
const dataStorage = require('../services/dataStorage');

router.get('/', async (req, res) => {
    console.log('GET /get-songs endpoint hit');
    const { songName, artist } = req.query;
    const searchQuery = `${songName} artist:${artist}`;
    console.log('Search Query:', searchQuery);

    try {
        const track = await searchTrack(searchQuery);
        if (!track) {
            return res.status(404).send({ error: 'Track not found' });
        }

        const initialSeedTrack = track.id;
        const initialRecommendations = await getRecommendedTracks([initialSeedTrack]);
        console.log(`Initial recommendation count: ${initialRecommendations.length}`);

        let allRecommendedTracks = [];
        let seedTracks = initialRecommendations.slice(0, 1).map(track => track.id);
        allRecommendedTracks.push(...initialRecommendations);

        for (let seed of seedTracks) {
            console.log(`Fetching recommendations for seed: ${seed}`);
            const newRecommendedTracks = await getRecommendedTracks([seed]);
            console.log(`Fetched ${newRecommendedTracks.length} new tracks using seed ${seed}`);
            allRecommendedTracks.push(...newRecommendedTracks);

            console.log('Applying 8-second delay to prevent rate limiting...');
            await new Promise(resolve => setTimeout(resolve, 8000));
        }

        console.log('Total recommended tracks (before filtering):', allRecommendedTracks.length);

        const BATCH_SIZE = 20;
        let allAudioFeatures = [];
        for (let i = 0; i < allRecommendedTracks.length; i += BATCH_SIZE) {
            const batchIds = allRecommendedTracks.slice(i, i + BATCH_SIZE).map(track => track.id);
            try {
                const batchFeatures = await getAudioFeaturesBatch(batchIds);
                allAudioFeatures.push(...batchFeatures);
            } catch (err) {
                console.error(`Error fetching audio features for batch:`, err.message);
            }
        }

        const { lastAnalysisData, lastRelativeData, lastAnalysisDataNewTempo, lastRelativeDataNewTempo } = dataStorage.getData();

        const filteredTracksAnalysis = allAudioFeatures.filter(track => {
            return (
                track.key === lastAnalysisData.key &&
                track.mode === lastAnalysisData.scale &&
                Math.abs(track.tempo - lastAnalysisData.bpm) / lastAnalysisData.bpm <= 0.28
            );
        });

        console.log('Filtered Tracks based on Analysis Data:', filteredTracksAnalysis.length);

        const filteredTracksRelative = allAudioFeatures.filter(track => {
            return (
                track.key === lastRelativeData.key &&
                track.mode === lastRelativeData.scale &&
                Math.abs(track.tempo - lastRelativeData.bpm) / lastRelativeData.bpm <= 0.28
            );
        });

        console.log('Filtered Tracks based on Relative Data:', filteredTracksRelative.length);

        const filteredTracksAnalysisNewTempo = allAudioFeatures.filter(track => {
            return (
                track.key === lastAnalysisDataNewTempo.key &&
                track.mode === lastAnalysisDataNewTempo.scale &&
                Math.abs(track.tempo - lastAnalysisDataNewTempo.bpm) / lastAnalysisDataNewTempo.bpm <= 0.28
            );
        });

        console.log('Filtered Tracks based on Analysis Data with Modified Tempo:', filteredTracksAnalysisNewTempo.length);

        const filteredTracksRelativeNewTempo = allAudioFeatures.filter(track => {
            return (
                track.key === lastRelativeDataNewTempo.key &&
                track.mode === lastRelativeDataNewTempo.scale &&
                Math.abs(track.tempo - lastRelativeDataNewTempo.bpm) / lastRelativeDataNewTempo.bpm <= 0.28
            );
        });

        console.log('Filtered Tracks based on Relative Data with Modified Tempo:', filteredTracksRelativeNewTempo.length);

        const totalFilteredTracks = filteredTracksAnalysis.length + filteredTracksRelative.length + filteredTracksAnalysisNewTempo.length + filteredTracksRelativeNewTempo.length;

        console.log('Total Filtered Tracks:', totalFilteredTracks);

        res.json({
            analysisSongs: filteredTracksAnalysis,
            relativeSongs: filteredTracksRelative,
            analysisNewTempoSongs: filteredTracksAnalysisNewTempo,
            relativeNewTempoSongs: filteredTracksRelativeNewTempo,
            tracks: allRecommendedTracks
        });

    } catch (error) {
        console.error('Error fetching or filtering songs:', error);
        res.status(500).json({ error: 'Failed to get songs' });
    }
});

module.exports = router;
