const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blackListToken.model');
const captainModel = require('../models/captain.model');


module.exports.authUser = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }


    const isBlacklisted = await blackListTokenModel.findOne({ token: token });

    if (isBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id)

        if (!user) {
            console.log('User not found in database for id:', decoded._id);
            return res.status(401).json({ message: 'Unauthorized - User not found' });
        }

        req.user = user;

        return next();

    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports.authCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];
    console.log('authCaptain: token received:', token ? 'present' : 'missing');

    if (!token) {
        console.log('authCaptain: no token provided');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const isBlacklisted = await blackListTokenModel.findOne({ token: token });
    console.log('authCaptain: token blacklisted?', !!isBlacklisted);

    if (isBlacklisted) {
        console.log('authCaptain: token is blacklisted');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const decodedId = decoded._id;
        console.log('authCaptain: token decoded successfully, ID in token:', decodedId);
        
        console.log('authCaptain: looking for captain in database with ID:', decodedId);
        const captain = await captainModel.findById(decodedId);
        console.log('authCaptain: captain found in DB?', !!captain);

        if (!captain) {
            console.log('authCaptain: ERROR - Captain not found in database for id:', decodedId);
            console.log('authCaptain: This could mean the token is for a USER, not a CAPTAIN');
            return res.status(401).json({ message: 'Unauthorized - Captain not found (token may be for a user)' });
        }

        req.captain = captain;
        console.log('authCaptain: authentication successful for captain:', captain.email);
        return next()
    } catch (err) {
        console.log('authCaptain: token verification failed:', err.message);
        return res.status(401).json({ message: 'Unauthorized' });
    }
}