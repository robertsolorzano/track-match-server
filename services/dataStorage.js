let lastAnalysisData = null;
let lastRelativeData = null;
let lastAnalysisDataNewTempo = null;
let lastRelativeDataNewTempo = null;

const updateData = (analysis, relative, analysisModTempo, relativeModTempo) => {
    lastAnalysisData = { bpm: parseFloat(analysis.bpm), key: parseInt(analysis.key), scale: parseInt(analysis.scale) };
    lastRelativeData = { bpm: parseFloat(relative.bpm), key: parseInt(relative.key), scale: parseInt(relative.scale) };
    lastAnalysisDataNewTempo = { bpm: parseFloat(analysisModTempo.bpm), key: parseInt(analysisModTempo.key), scale: parseInt(analysisModTempo.scale) };
    lastRelativeDataNewTempo = { bpm: parseFloat(relativeModTempo.bpm), key: parseInt(relativeModTempo.key), scale: parseInt(relativeModTempo.scale) };
    console.log('Updated data with lastAnalysisData:', lastAnalysisData);
    console.log('Updated data with lastRelativeData:', lastRelativeData);
    console.log('Updated data with lastAnalysisDataModTempo:', lastAnalysisDataNewTempo);
    console.log('Updated data with lastRelativeDataModTempo:', lastRelativeDataNewTempo);
};

const getData = () => {
    return { lastAnalysisData, lastRelativeData, lastAnalysisDataNewTempo, lastRelativeDataNewTempo };
};

module.exports = { updateData, getData };
