const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');


module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination, vehicleType } = req.body;
    console.log('Received create ride request:', { pickup, destination, vehicleType, user: req.user._id });

    try {
        console.log('Creating ride with vehicleType:', vehicleType);
        const ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType });
        console.log('Ride created successfully:', ride._id);
        res.status(201).json(ride);

        console.log('Fetching pickup coordinates for:', pickup);
        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        console.log('Pickup coordinates:', pickupCoordinates);

        console.log('Fetching captains in radius');
        const captainsInRadius = await mapService.getCaptainsInTheRadius(pickupCoordinates.ltd, pickupCoordinates.lng, 2, vehicleType);

        console.log(`Found ${captainsInRadius.length} captains for vehicleType: ${vehicleType}`);

        const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('passengers.user');
        console.log('Ride with populated users:', rideWithUser.passengers.map(p => ({ user: p.user ? p.user._id : null, fare: p.fare })));

        captainsInRadius.map(captain => {

            sendMessageToSocketId(captain.socketId, {
                event: 'new-ride',
                data: rideWithUser
            })

        })

    } catch (err) {
        console.log('Error in createRide:', err.message);
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, passengerId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain, passengerId });

        // Send confirmation to all passengers
        ride.passengers.forEach(passenger => {
            if (passenger.status === 'accepted') {
                sendMessageToSocketId(passenger.user.socketId, {
                    event: 'ride-confirmed',
                    data: ride
                });
            }
        });

        return res.status(200).json(ride);
    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.acceptPassenger = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, passengerId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain, passengerId });

        // Send confirmation to the specific passenger
        const passenger = ride.passengers.id(passengerId);
        if (passenger && passenger.status === 'accepted') {
            sendMessageToSocketId(passenger.user.socketId, {
                event: 'ride-confirmed',
                data: ride
            });

            // Notify captain about the new passenger
            if (ride.captain && ride.captain.socketId) {
                sendMessageToSocketId(ride.captain.socketId, {
                    event: 'passenger-accepted',
                    data: {
                        rideId: ride._id,
                        newPassenger: passenger,
                        totalPassengers: ride.passengers.length
                    }
                });
            }
        }

        return res.status(200).json(ride);
    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        console.log(ride);

        // Send ride-started to all accepted passengers
        ride.passengers.forEach(passenger => {
            if (passenger.status === 'accepted') {
                sendMessageToSocketId(passenger.user.socketId, {
                    event: 'ride-started',
                    data: ride
                });
            }
        });

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.requestCarpool = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, pickup, destination } = req.body;

    try {
        const ride = await rideService.requestCarpool({ rideId, user: req.user, pickup, destination });

        // Send notification to captain
        sendMessageToSocketId(ride.captain.socketId, {
            event: 'carpool-request',
            data: {
                rideId: ride._id,
                passengerId: req.user._id,
                passengerName: req.user.fullname.firstname + ' ' + req.user.fullname.lastname,
                pickup,
                destination,
                fare: ride.passengers[ride.passengers.length - 1].fare // The fare for the new passenger
            }
        });

        return res.status(200).json({ message: 'Carpool request sent to captain' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        // Send ride-ended to all accepted passengers
        ride.passengers.forEach(passenger => {
            if (passenger.status === 'accepted') {
                sendMessageToSocketId(passenger.user.socketId, {
                    event: 'ride-ended',
                    data: ride
                });
            }
        });



        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    } s
}