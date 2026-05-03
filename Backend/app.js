const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');

connectToDb();

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://go-poola.vercel.app',
    'https://go-poola-p5y8fnc79-becomefaisals-projects.vercel.app',
    'https://go-poola-pnuw07bhv-becomefaisals-projects.vercel.app',
    /\.vercel\.app$/
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return allowed === origin;
            } else if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        })) {
            return callback(null, true);
        }

        // Reject the request
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);




module.exports = app;

