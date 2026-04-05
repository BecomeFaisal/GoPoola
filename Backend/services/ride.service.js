const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function getFare(pickup, destination) {

    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);

    const baseFare = {
        auto: 30,
        car: 50,
        motorcycle: 20,
        autoCarpool: 20,  // Lower base fare for carpooling
        carCarpool: 35    // Lower base fare for carpooling
    };

    const perKmRate = {
        auto: 10,
        car: 15,
        motorcycle: 8,
        autoCarpool: 6,   // Lower per km rate for carpooling
        carCarpool: 9     // Lower per km rate for carpooling
    };

    const perMinuteRate = {
        auto: 2,
        car: 3,
        motorcycle: 1.5,
        autoCarpool: 1.2, // Lower per minute rate for carpooling
        carCarpool: 1.8   // Lower per minute rate for carpooling
    };



    const fare = {
        auto: Math.round(baseFare.auto + ((distanceTime.distance.value / 1000) * perKmRate.auto) + ((distanceTime.duration.value / 60) * perMinuteRate.auto)),
        car: Math.round(baseFare.car + ((distanceTime.distance.value / 1000) * perKmRate.car) + ((distanceTime.duration.value / 60) * perMinuteRate.car)),
        motorcycle: Math.round(baseFare.motorcycle + ((distanceTime.distance.value / 1000) * perKmRate.motorcycle) + ((distanceTime.duration.value / 60) * perMinuteRate.motorcycle)),
        autoCarpool: Math.round(baseFare.autoCarpool + ((distanceTime.distance.value / 1000) * perKmRate.autoCarpool) + ((distanceTime.duration.value / 60) * perMinuteRate.autoCarpool)),
        carCarpool: Math.round(baseFare.carCarpool + ((distanceTime.distance.value / 1000) * perKmRate.carCarpool) + ((distanceTime.duration.value / 60) * perMinuteRate.carCarpool))
    };

    return fare;


}

module.exports.getFare = getFare;


function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}


async function addPassengerToRide({
    rideId, user, fare
}) {
    console.log('addPassengerToRide called with:', { rideId, user, fare });
    if (!rideId || !user || !fare) {
        throw new Error('Ride ID, user, and fare are required');
    }

    const ride = await rideModel.findById(rideId);
    if (!ride) {
        throw new Error('Ride not found');
    }
    console.log('Ride found:', ride._id, 'passengers count:', ride.passengers.length);

    // Check if user is already a passenger
    const existingPassenger = ride.passengers.find(p => p.user.toString() === user.toString());
    if (existingPassenger) {
        console.log('User is already a passenger on this ride, returning existing ride');
        // Return the populated ride instead of throwing error
        const populatedRide = await rideModel.findById(rideId).populate('passengers.user').populate('captain');
        return populatedRide;
    }

    // Add new passenger
    console.log('Adding new passenger');
    ride.passengers.push({
        user,
        fare,
        status: 'pending'
    });

    // Recalculate fares for all passengers
    const totalPassengers = ride.passengers.length;
    const baseFare = ride.fare; // Original fare for one passenger
    const farePerPassenger = Math.round(baseFare / totalPassengers);
    console.log('Recalculating fares: total passengers', totalPassengers, 'fare per passenger', farePerPassenger);

    ride.passengers.forEach(passenger => {
        passenger.fare = farePerPassenger;
    });

    await ride.save();
    console.log('Ride saved');

    // Populate and return
    const populatedRide = await rideModel.findById(rideId).populate('passengers.user').populate('captain');
    console.log('Populated ride passengers:', populatedRide.passengers.map(p => ({ user: p.user ? p.user._id : 'null', fare: p.fare })));
    return populatedRide;
}

module.exports.addPassengerToRide = addPassengerToRide;

module.exports.createRide = async ({
    user, pickup, destination, vehicleType
}) => {
    console.log('Service createRide called with:', { user, pickup, destination, vehicleType });
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    console.log('Calculating fare...');
    const fare = await getFare(pickup, destination);
    console.log('Fare calculated:', fare);

    // Check if this is a carpool vehicle type
    const isCarpool = vehicleType.includes('Carpool');
    console.log('Is carpool:', isCarpool);

    if (isCarpool) {
        // Look for existing carpool rides on the same route
        console.log('Looking for existing carpool ride...');
        const existingRide = await rideModel.findOne({
            vehicleType,
            pickup,
            destination,
            status: { $in: ['accepted', 'ongoing'] },
            'passengers': { $exists: true, $ne: [] }
        });
        console.log('Existing ride found:', existingRide ? existingRide._id : 'none');

        if (existingRide) {
            // If ride is accepted (waiting to start), add passenger directly
            if (existingRide.status === 'accepted') {
                console.log('Adding passenger to accepted ride');
                return await addPassengerToRide({
                    rideId: existingRide._id,
                    user,
                    fare: fare[vehicleType]
                });
            }
            // If ride is ongoing, create a carpool request
            else if (existingRide.status === 'ongoing') {
                console.log('Ride is ongoing, creating carpool request');
                // Add passenger as pending to the ongoing ride
                const populatedRide = await rideModel.findById(existingRide._id).populate('captain').populate('passengers.user');
                if (!populatedRide) {
                    throw new Error('Ride not found');
                }

                // Populate user to get socketId
                const userModel = require('../models/user.model');
                const populatedUser = await userModel.findById(user);
                if (!populatedUser) {
                    throw new Error('User not found');
                }

                // Check if user is already a passenger
                const existingPassenger = populatedRide.passengers.find(p => p.user._id.toString() === populatedUser._id.toString());
                if (existingPassenger) {
                    throw new Error('User is already a passenger on this ride');
                }

                // Calculate fare for new passenger
                const baseFare = fare[vehicleType];
                const currentActivePassengers = populatedRide.passengers.filter(p => ['accepted', 'ongoing'].includes(p.status)).length;
                const totalPassengersAfterAcceptance = currentActivePassengers + 1;
                const fareAfterAcceptance = Math.round(populatedRide.fare / totalPassengersAfterAcceptance);

                populatedRide.passengers.push({
                    user: populatedUser._id,
                    fare: baseFare,
                    status: 'pending'
                });
                await populatedRide.save();

                // Send notification to captain
                const { sendMessageToSocketId } = require('../socket');
                sendMessageToSocketId(populatedRide.captain.socketId, {
                    event: 'carpool-request',
                    data: {
                        rideId: populatedRide._id,
                        passengerId: populatedUser._id,
                        passengerName: populatedUser.fullname.firstname + ' ' + populatedUser.fullname.lastname,
                        pickup,
                        destination,
                        currentFare: baseFare,
                        fareAfterAcceptance: fareAfterAcceptance,
                        currentPassengers: currentActivePassengers,
                        totalPassengersAfter: totalPassengersAfterAcceptance
                    }
                });

                // Send confirmation to the user that their request was submitted
                if (populatedUser.socketId) {
                    sendMessageToSocketId(populatedUser.socketId, {
                        event: 'carpool-request-submitted',
                        data: {
                            rideId: populatedRide._id,
                            message: 'Your carpool request has been sent to the captain. Waiting for approval.'
                        }
                    });
                }

                return populatedRide;
            }
        }
    }

    // Create new ride with first passenger
    console.log('Creating new ride...');
    const ride = await rideModel.create({
        passengers: [{
            user,
            fare: fare[vehicleType]
        }],
        pickup,
        destination,
        fare: fare[vehicleType],
        vehicleType,
        otp: getOtp(6)
    });
    console.log('New ride created:', ride._id);

    return ride;
}

module.exports.confirmRide = async ({
    rideId, captain, passengerId
}) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    if (!captain) {
        throw new Error('Captain not authenticated');
    }

    const ride = await rideModel.findById(rideId);
    if (!ride) {
        throw new Error('Ride not found');
    }

    // If no captain assigned yet, assign one
    if (!ride.captain) {
        ride.captain = captain._id;
        ride.status = 'accepted';
    }

    // Find and update the specific passenger status
    if (passengerId) {
        console.log('confirmRide: passengerId received:', passengerId);
        console.log('confirmRide: passengers before update:', ride.passengers.map(p => ({ id: p._id.toString(), user: p.user, status: p.status })));
        const passenger = ride.passengers.find(p => {
            const userId = p.user && p.user._id ? p.user._id.toString() : p.user?.toString?.();
            const passengerDocId = p._id?.toString?.();
            return userId === passengerId || passengerDocId === passengerId;
        });
        console.log('confirmRide: passenger lookup result:', passenger ? { id: passenger._id.toString(), status: passenger.status, user: passenger.user } : 'not found');
        if (passenger) {
            passenger.status = ride.status === 'ongoing' ? 'ongoing' : 'accepted';
            console.log('confirmRide: set passenger status to:', passenger.status);
        }
    } else {
        // If no specific passenger, accept all pending passengers
        ride.passengers.forEach(passenger => {
            if (passenger.status === 'pending') {
                passenger.status = ride.status === 'ongoing' ? 'ongoing' : 'accepted';
            }
        });
    }

    // For carpool rides, recalculate fares when accepting passengers
    if (ride.vehicleType.includes('Carpool')) {
        const activePassengerStatuses = ride.status === 'ongoing' ? ['accepted', 'ongoing'] : ['accepted'];
        const activePassengers = ride.passengers.filter(p => activePassengerStatuses.includes(p.status));
        if (activePassengers.length > 0) {
            const totalFare = ride.fare; // Original total fare
            const farePerPassenger = Math.round(totalFare / activePassengers.length);
            console.log(`Recalculating carpool fares: ${activePassengers.length} passengers, ₹${farePerPassenger} each`);

            // Update fare for all active passengers
            activePassengers.forEach(passenger => {
                passenger.fare = farePerPassenger;
            });
        }
    }

    ride.markModified('passengers');
    await ride.save();
    console.log('Ride saved, passengers:', ride.passengers.map(p => ({ user: p.user, status: p.status })));

    return await rideModel.findById(rideId).populate('passengers.user').populate('captain').select('+otp');
}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    if (!captain) {
        throw new Error('Captain not authenticated');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('passengers.user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    // Update all accepted passengers to ongoing
    ride.passengers.forEach(passenger => {
        if (passenger.status === 'accepted') {
            passenger.status = 'ongoing';
        }
    });

    ride.status = 'ongoing';
    await ride.save();

    return ride;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    if (!captain) {
        throw new Error('Captain not authenticated');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('passengers.user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error(`Ride not ongoing (current status: ${ride.status})`);
    }

    const updatedRide = await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'
    }, { new: true });

    // Fetch the updated ride with populated passengers
    const populatedRide = await rideModel.findById(rideId).populate('passengers.user').populate('captain').select('+otp');

    return populatedRide || updatedRide || ride;
}

module.exports.requestCarpool = async ({
    rideId, user, pickup, destination
}) => {
    if (!rideId || !user || !pickup || !destination) {
        throw new Error('Ride ID, user, pickup, and destination are required');
    }

    const ride = await rideModel.findById(rideId).populate('captain');
    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted' && ride.status !== 'ongoing') {
        throw new Error('Ride is not available for carpooling');
    }

    // Check if user is already a passenger
    const existingPassenger = ride.passengers.find(p => p.user.toString() === user._id.toString());
    if (existingPassenger) {
        throw new Error('User is already a passenger on this ride');
    }

    // Calculate fare for new passenger
    const fare = await getFare(pickup, destination);
    const vehicleType = ride.vehicleType;
    const baseFare = fare[vehicleType] || fare[vehicleType.replace('Carpool', '')];

    // Add passenger as pending
    ride.passengers.push({
        user: user._id,
        fare: baseFare,
        status: 'pending'
    });

    await ride.save();

    return await rideModel.findById(rideId).populate('passengers.user').populate('captain');
}

