import React, { useRef, useState, useEffect, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FinishRide from '../components/FinishRide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import LiveTracking from '../components/LiveTracking'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'

const CaptainRiding = () => {

    const [ finishRidePanel, setFinishRidePanel ] = useState(false)
    const [ carpoolNotification, setCarpoolNotification ] = useState(null)
    const location = useLocation()
    const [ rideData, setRideData ] = useState(location.state?.ride)
    const finishRidePanelRef = useRef(null)

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

    const currentPassengers = rideData?.passengers?.length || 0
    const passengerShare = rideData?.passengers?.[0]?.fare || rideData?.fare || 0
    const totalRideFare = rideData?.passengers?.reduce((sum, p) => sum + (p.fare || 0), 0) || rideData?.fare || 0

    useEffect(() => {
        const handleCarpoolRequest = (data) => {
            console.log('CaptainRiding: Received carpool request:', data)
            setCarpoolNotification(data)
        }

        const handlePassengerAccepted = (data) => {
            console.log('CaptainRiding: Passenger accepted:', data)
            const updatedRide = data?.ride || data
            if (updatedRide) {
                setRideData(updatedRide)
                setCarpoolNotification(null)
                alert(`Passenger ${data.newPassenger?.user?.fullname?.firstname || 'new passenger'} accepted! Fare per passenger: ₹${data.farePerPassenger || passengerShare}`)
            }
        }

        socket.on('carpool-request', handleCarpoolRequest)
        socket.on('passenger-accepted', handlePassengerAccepted)

        return () => {
            socket.off('carpool-request', handleCarpoolRequest)
            socket.off('passenger-accepted', handlePassengerAccepted)
        }
    }, [socket, passengerShare])

    const acceptCarpoolRequest = async (passengerId) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/accept-passenger`, {
                rideId: carpoolNotification.rideId,
                passengerId: passengerId
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('captainToken') || localStorage.getItem('token')}`
                }
            })

            console.log('Carpool request accepted:', response.data)
            setCarpoolNotification(null)
            setRideData(response.data)
        } catch (error) {
            console.error('Error accepting carpool request:', error)
        }
    }



    useGSAP(function () {
        if (finishRidePanel) {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ finishRidePanel ])


    return (
        <div className='h-screen relative flex flex-col justify-end'>

            {/* Carpool Notification */}
            {carpoolNotification && (
                <div className='fixed top-20 right-4 bg-yellow-400 text-black p-4 rounded-lg shadow-lg z-20 max-w-sm'>
                    <h3 className='font-semibold'>New Passenger Request!</h3>
                    <p className='text-sm'>Passenger: {carpoolNotification.passengerName}</p>
                    <p className='text-sm'>Route: {carpoolNotification.pickup} → {carpoolNotification.destination}</p>
                    <p className='text-sm'>Current passengers: {carpoolNotification.currentPassengers}</p>
                    <p className='text-sm'>Fare after acceptance: ₹{carpoolNotification.fareAfterAcceptance} per passenger</p>
                    <div className='mt-2 flex gap-2'>
                        <button
                            onClick={() => acceptCarpoolRequest(carpoolNotification.passengerId)}
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

            <div className='fixed p-6 top-0 flex items-center justify-between w-screen'>
                <img className='w-16' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
                <Link to='/captain-home' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>
            </div>

            <div className='h-1/5 p-6 flex items-center justify-between relative bg-yellow-400 pt-10'
                onClick={() => {
                    setFinishRidePanel(true)
                }}
            >
                <h5 className='p-1 text-center w-[90%] absolute top-0'><i className="text-3xl text-gray-800 ri-arrow-up-wide-line"></i></h5>
                <div className='flex-1'>
                    <h4 className='text-xl font-semibold'>{'4 KM away'}</h4>
                    <div className='mt-2'>
                        <p className='text-sm text-gray-800'>Passengers: {currentPassengers}</p>
                        <p className='text-sm font-semibold'>₹{passengerShare} per passenger</p>
                        <p className='text-sm text-gray-800'>Total ride value: ₹{totalRideFare}</p>
                    </div>
                    {rideData?.passengers?.length > 1 && (
                        <div className='mt-3'>
                            <div className='flex flex-wrap gap-2'>
                                {rideData.passengers.map((passenger, index) => (
                                    <div key={index} className='bg-white bg-opacity-20 rounded px-2 py-1 text-xs'>
                                        {passenger.user.fullname.firstname} - ₹{passenger.fare}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button className=' bg-green-600 text-white font-semibold p-3 px-10 rounded-lg'>Complete Ride</button>
            </div>
            <div ref={finishRidePanelRef} className='fixed w-full z-[500] bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <FinishRide
                    ride={rideData}
                    setFinishRidePanel={setFinishRidePanel} />
            </div>

            <div className='h-screen fixed w-screen top-0 z-[-1]'>
                <LiveTracking />
            </div>

        </div>
    )
}

export default CaptainRiding