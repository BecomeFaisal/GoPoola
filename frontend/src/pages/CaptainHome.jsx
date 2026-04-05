import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import { useEffect, useContext } from 'react'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'
import LiveTracking from '../components/LiveTracking'

const CaptainHome = () => {

    const [ ridePopupPanel, setRidePopupPanel ] = useState(false)
    const [ confirmRidePopupPanel, setConfirmRidePopupPanel ] = useState(false)
    const [ carpoolNotification, setCarpoolNotification ] = useState(null)
    const [ currentRide, setCurrentRide ] = useState(null)

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)
    const [ ride, setRide ] = useState(null)

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

    const navigate = useNavigate()

    // Helper function to decode JWT without external library
    const decodeToken = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('CaptainHome: Failed to decode token:', error);
            return null;
        }
    }

    useEffect(() => {
        socket.emit('join', {
            userId: captain._id,
            userType: 'captain'
        })
        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {

                    socket.emit('update-location-captain', {
                        userId: captain._id,
                        location: {
                            ltd: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    })
                })
            }
        }

        const locationInterval = setInterval(updateLocation, 10000)
        updateLocation()

        // return () => clearInterval(locationInterval)
    }, [])

    useEffect(() => {
        socket.on('new-ride', (data) => {
            setRide(data)
            setRidePopupPanel(true)
        })

        socket.on('carpool-request', (data) => {
            setCarpoolNotification(data)
        })

        socket.on('passenger-accepted', (data) => {
            console.log('CaptainHome: passenger accepted event', data)
            if (data.ride) {
                setRide(data.ride)
                setCurrentRide(data.ride)
            }
        })

        socket.on('ride-started', (data) => {
            setCurrentRide(data)
            setConfirmRidePopupPanel(false)
        })

        return () => {
            socket.off('new-ride')
            socket.off('carpool-request')
            socket.off('passenger-accepted')
            socket.off('ride-started')
        }
    }, [socket])

    async function confirmRide() {
        const token = localStorage.getItem('captainToken') || localStorage.getItem('token');
        console.log('CaptainHome confirmRide: captain from context:', captain);
        console.log('CaptainHome confirmRide: token from localStorage:', token ? 'present' : 'missing');
        
        // CRITICAL: Verify token content
        const decoded = decodeToken(token);
        console.log('CaptainHome confirmRide: decoded token ID:', decoded?._id);
        console.log('CaptainHome confirmRide: captain context ID:', captain._id);
        console.log('CaptainHome confirmRide: token ID matches captain ID?', decoded?._id === captain._id);
        console.log('CaptainHome confirmRide: rideId:', ride._id);

        if (decoded?._id !== captain._id) {
            console.error('CaptainHome confirmRide: TOKEN MISMATCH! Token contains wrong captain ID');
            console.error('Token has ID:', decoded?._id, 'but captain has ID:', captain._id);
            alert('ERROR: Authentication token mismatch. Please logout and login again.');
            return;
        }

        try {
            const authToken = localStorage.getItem('captainToken') || token;
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/confirm`, {
                rideId: ride._id,
            }, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            })
            console.log('CaptainHome confirmRide: success response:', response.data);

            setRidePopupPanel(false)
            setConfirmRidePopupPanel(true)
        } catch (error) {
            console.error('CaptainHome confirmRide: error:', error.response?.data || error.message);
        }
    }

    async function acceptPassenger(passengerId) {
        try {
            const authToken = localStorage.getItem('captainToken') || localStorage.getItem('token');
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/accept-passenger`, {
                rideId: carpoolNotification.rideId,
                passengerId: passengerId
            }, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            })

            setCarpoolNotification(null)
            // Update current ride and main ride with new passenger data
            if (currentRide) {
                setCurrentRide(response.data)
            }
            if (ride) {
                setRide(response.data) // Update the ride shown in ConfirmRidePopUp
            }
        } catch (error) {
            console.error('Error accepting passenger:', error)
        }
    }

    useGSAP(function () {
        if (ridePopupPanel) {
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ ridePopupPanel ])

    useGSAP(function () {
        if (confirmRidePopupPanel) {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePopupPanel ])

    const handleLogout = async () => {
        const authToken = localStorage.getItem('captainToken') || localStorage.getItem('token')
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/captains/logout`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            if (response.status === 200) {
                localStorage.removeItem('captainToken');
                localStorage.removeItem('token');
                navigate('/captain-login');
            }
        } catch (error) {
            console.error('Logout failed:', error);
            // Still remove token and navigate
            localStorage.removeItem('captainToken');
            localStorage.removeItem('token');
            navigate('/captain-login');
        }
    }

    return (
        <div className='h-screen'>
            <button
                onClick={handleLogout}
                className='fixed top-4 right-4 z-50 bg-white border border-gray-200 shadow-sm text-black px-4 py-2 rounded-full hover:bg-gray-100'
            >
                Logout
            </button>
            <div className='h-3/5'>
                <LiveTracking />
            </div>
            <div className='h-2/5 p-6'>
                <CaptainDetails />
            </div>
            <div ref={ridePopupPanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <RidePopUp
                    ride={ride}
                    setRidePopupPanel={setRidePopupPanel}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    confirmRide={confirmRide}
                />
            </div>
            <div ref={confirmRidePopupPanelRef} className='fixed w-full h-screen z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <ConfirmRidePopUp
                    ride={ride}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    setRidePopupPanel={setRidePopupPanel}
                    onPassengerAccepted={(updatedRide) => setRide(updatedRide)} />
            </div>

            {/* Carpool Notification */}
            {carpoolNotification && (
                <div className='fixed top-20 right-4 bg-yellow-400 text-black p-4 rounded-lg shadow-lg z-20 max-w-sm'>
                    <h3 className='font-semibold'>New Passenger Request!</h3>
                    <p className='text-sm'>Passenger: {carpoolNotification.passengerName}</p>
                    <p className='text-sm'>Route: {carpoolNotification.pickup} → {carpoolNotification.destination}</p>
                    <p className='text-sm'>Current passengers: {carpoolNotification.currentPassengers || 1}</p>
                    <p className='text-sm'>Fare after acceptance: ₹{carpoolNotification.fareAfterAcceptance || carpoolNotification.fare} per passenger</p>
                    <div className='mt-2 flex gap-2'>
                        <button
                            onClick={() => acceptPassenger(carpoolNotification.passengerId)}
                            className='bg-green-600 text-white px-3 py-1 rounded text-sm'
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => setCarpoolNotification(null)}
                            className='bg-red-600 text-white px-3 py-1 rounded text-sm'
                        >
                            Decline
                        </button>
                    </div>
                </div>
            )}

            {/* Current Ride Info */}
            {currentRide && (
                <div className='fixed bottom-20 left-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-20 max-w-sm'>
                    <h3 className='font-semibold'>Current Ride</h3>
                    <p className='text-sm'>Passengers: {currentRide.passengers.length}</p>
                    <p className='text-sm'>Status: {currentRide.status}</p>
                </div>
            )}
        </div>
    )
}

export default CaptainHome