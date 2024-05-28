const axios = require('axios');
const Bottleneck = require('bottleneck');

let globalAccessToken = null;
let tokenExpirationTime = null;

const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 300, highWater: 100, strategy: Bottleneck.strategy.LEAK });

async function getAccessToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        method: 'post',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(clientId + ':' + clientSecret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: 'grant_type=client_credentials'
    };

    try {
        const response = await axios(authOptions);
        globalAccessToken = response.data.access_token;
        tokenExpirationTime = Date.now() + (response.data.expires_in - 120) * 1000;
        console.log('Access Token:', globalAccessToken);
        console.log('Token Expiry Time:', new Date(tokenExpirationTime).toLocaleString());
    } catch (error) {
        console.error('Error fetching access token:', error.message);
        throw new Error('Unable to obtain access token');
    }
}

async function getRecommendedTracks(seedTracks) {
    if (!globalAccessToken || Date.now() > tokenExpirationTime) {
        await getAccessToken();
    }

    const queryOptions = {
        url: 'https://api.spotify.com/v1/recommendations',
        method: 'get',
        headers: { 'Authorization': 'Bearer ' + globalAccessToken },
        params: { seed_tracks: seedTracks.join(','), limit: 100, min_energy: 0.1, min_popularity: 10 }
    };

    try {
        const response = await axios(queryOptions);
        return response.data.tracks;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after'], 10);
            await new Promise(resolve => setTimeout(resolve, (retryAfter + 1) * 1000));
            return getRecommendedTracks(seedTracks);
        } else {
            console.error('Error querying Spotify API for recommended tracks:', error.message);
            throw error;
        }
    }
}

async function getAudioFeatures(trackId) {
    if (!globalAccessToken || Date.now() > tokenExpirationTime) {
        await getAccessToken();
    }

    try {
        const audioFeaturesResponse = await limiter.schedule(() => axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
            headers: { 'Authorization': `Bearer ${globalAccessToken}` }
        }));
        return audioFeaturesResponse.data;
    } catch (error) {
        throw error;
    }
}

async function getAudioFeaturesBatch(trackIds) {
    if (!globalAccessToken || Date.now() > tokenExpirationTime) {
        await getAccessToken();
    }

    try {
        const audioFeaturesResponse = await limiter.schedule(() => axios.get(`https://api.spotify.com/v1/audio-features`, {
            headers: { 'Authorization': `Bearer ${globalAccessToken}` },
            params: { ids: trackIds.join(',') }
        }));
        return audioFeaturesResponse.data.audio_features;
    } catch (error) {
        throw error;
    }
}

async function searchTrack(searchQuery) {
    if (!globalAccessToken || Date.now() > tokenExpirationTime) {
        await getAccessToken();
    }

    try {
        const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${globalAccessToken}` },
            params: { q: searchQuery, type: 'track', limit: 1 }
        });
        const tracks = searchResponse.data.tracks.items;
        return tracks.length ? tracks[0] : null;
    } catch (error) {
        console.error('Error searching for track:', error.message);
        throw error;
    }
}

module.exports = { 
    getAccessToken, 
    getRecommendedTracks, 
    getAudioFeatures, 
    getAudioFeaturesBatch, 
    searchTrack
};
