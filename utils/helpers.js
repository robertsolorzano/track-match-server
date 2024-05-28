function getRelativeKey(key, mode) {
    const majorToMinorShift = -3; // Relative minor is 3 semitones down
    const minorToMajorShift = 3; // Relative major is 3 semitones up
    const totalNotes = 12; // Total semitones in an octave

    let keyNumber = key; // Key is already a number

    if (mode === 1) { // Major is represented as 1 and minor as 0
        keyNumber = (keyNumber + majorToMinorShift + totalNotes) % totalNotes;
    } else if (mode === 0) { // Minor
        keyNumber = (keyNumber + minorToMajorShift) % totalNotes;
    }

    return keyNumber; // Returns the relative key as a number
}

function getRelativeScale(mode) {
    return mode === 1 ? 0 : 1; // Major is 1 and minor is 0, switches them
}

function modifyTempo(initialTempo) {
    let modifiedTempo;

    if (initialTempo >= 100) {
        modifiedTempo = initialTempo / 2;
    } else {
        modifiedTempo = initialTempo * 2;
    }
    return modifiedTempo;
}

module.exports = { getRelativeKey, getRelativeScale, modifyTempo };
