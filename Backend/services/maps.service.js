const axios = require('axios');
const captainModel = require('../models/captain.model');

module.exports.getAddressCoordinate = async (address) => {
    const apiKey = process.env.GOOGLE_MAPS_API;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            const location = response.data.results[ 0 ].geometry.location;
            return {
                ltd: location.lat,
                lng: location.lng
            };
        } else {
            throw new Error('Unable to fetch coordinates');
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    try {


        const response = await axios.get(url);
        if (response.data.status === 'OK') {

            if (response.data.rows[ 0 ].elements[ 0 ].status === 'ZERO_RESULTS') {
                throw new Error('No routes found');
            }

            return response.data.rows[ 0 ].elements[ 0 ];
        } else {
            throw new Error('Unable to fetch distance and time');
        }

    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        console.log('Google Maps API Response Status:', response.data.status);
        console.log('Google Maps API Response:', response.data);

        if (response.data.status === 'OK') {
            return response.data.predictions.map(prediction => prediction.description).filter(value => value);
        } else {
            throw new Error(`Google Maps API Error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
        }
    } catch (err) {
        console.error('Maps API Error:', err.message);
        throw err;
    }
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius, vehicleType) => {

    // radius in km

    let vehicleTypeFilter = {};

    // Build filter based on requested vehicle type
    switch(vehicleType) {
        case 'autoCarpool':
            vehicleTypeFilter = { 'vehicle.vehicleType': 'autoCarpool' };
            break;
        case 'carCarpool':
            vehicleTypeFilter = { 'vehicle.vehicleType': 'carCarpool' };
            break;
        case 'auto':
            vehicleTypeFilter = { 'vehicle.vehicleType': { $in: ['auto', 'autoCarpool'] } };
            break;
        case 'car':
            vehicleTypeFilter = { 'vehicle.vehicleType': { $in: ['car', 'carCarpool'] } };
            break;
        case 'motorcycle':
            vehicleTypeFilter = { 'vehicle.vehicleType': 'motorcycle' };
            break;
        case 'moto':
            vehicleTypeFilter = { 'vehicle.vehicleType': 'motorcycle' };
            break;
        default:
            // If vehicleType is not recognized, don't filter (send to all)
            vehicleTypeFilter = {};
    }

    const captains = await captainModel.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, ltd]  // [longitude, latitude]
                },
                $maxDistance: radius * 1000  // Convert km to meters
            }
        },
        ...vehicleTypeFilter
    });

    return captains;


}