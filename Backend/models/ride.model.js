const mongoose = require('mongoose');


const rideSchema = new mongoose.Schema({
    passengers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        fare: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
            default: 'pending'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captain',
    },
    pickup: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    fare: {
        type: Number,
        required: true,
    },
    vehicleType: {
        type: String,
        required: true,
        enum: [ 'car', 'motorcycle', 'auto', 'carCarpool', 'autoCarpool' ],
    },

    status: {
        type: String,
        enum: [ 'pending', 'accepted', "ongoing", 'completed', 'cancelled' ],
        default: 'pending',
    },

    duration: {
        type: Number,
    }, // in seconds

    distance: {
        type: Number,
    }, // in meters

    paymentID: {
        type: String,
    },
    orderId: {
        type: String,
    },
    signature: {
        type: String,
    },

    otp: {
        type: String,
        select: false,
        required: true,
    },
})

module.exports = mongoose.model('ride', rideSchema);