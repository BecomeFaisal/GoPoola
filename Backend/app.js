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
    /.+\.vercel\.app$/
];

function isOriginAllowed(origin) {
    if (!origin) return false;
    return allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
            return allowed === origin;
        }
        if (allowed instanceof RegExp) {
            return allowed.test(origin);
        }
        return false;
    });
}

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS origin denied'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 200
};

app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        console.log(`[CORS] Preflight ${req.method} ${req.originalUrl} origin=${req.headers.origin || 'none'}`);
    }
    if (req.path === '/users/register' && req.method === 'POST') {
        console.log(`[REQUEST] ${req.method} ${req.originalUrl} origin=${req.headers.origin || 'none'}`);
    }
    next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    if (origin && isOriginAllowed(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.header('Vary', 'Origin');
    next();
});
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

// Ensure preflight and other requests always return CORS headers
app.options('*', cors(corsOptions));

// Error handler: always include CORS headers on error responses
app.use((err, req, res, next) => {
    const origin = req.headers.origin || '';
    if (origin && isOriginAllowed(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.header('Vary', 'Origin');
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});




module.exports = app;

