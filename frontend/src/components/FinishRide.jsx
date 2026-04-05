import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import PaymentQR from './PaymentQR'

const FinishRide = (props) => {
    const navigate = useNavigate()
    const [selectedPassenger, setSelectedPassenger] = useState(null)
    const [collectedPayments, setCollectedPayments] = useState({})

    const passengerList = props.ride?.passengers || []
    const passengerCount = passengerList.length
    const totalFare = passengerList.reduce((sum, passenger) => sum + (passenger.fare || 0), 0) || props.ride?.fare || 0
    const collectedAmount = passengerList.reduce((sum, passenger) => sum + ((collectedPayments[passenger._id] ? passenger.fare || 0 : 0)), 0)
    const allCollected = passengerCount > 0 && passengerList.every(passenger => collectedPayments[passenger._id])

    useEffect(() => {
        const initialCollected = {}
        passengerList.forEach(passenger => {
            initialCollected[passenger._id] = false
        })
        setCollectedPayments(initialCollected)
        setSelectedPassenger(null)
    }, [props.ride?._id])

    async function endRide() {
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/end-ride`, {
            rideId: props.ride._id
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })

        if (response.status === 200) {
            navigate('/captain-home')
        }
    }

    function markCollected(passengerId) {
        setCollectedPayments(prev => ({
            ...prev,
            [passengerId]: true
        }))
    }

    const selectedFare = selectedPassenger?.fare || 0

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => props.setFinishRidePanel(false)}>
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>
            <h3 className='text-2xl font-semibold mb-5'>Finish this Ride</h3>

            {selectedPassenger ? (
                <div className='flex flex-col items-center'>
                    <PaymentQR
                        amount={selectedFare}
                        upiId="devilraquema-1@oksbi"
                        rideId={props.ride?._id}
                    />
                    <div className='w-full mt-6 space-y-3'>
                        <button
                            onClick={() => setSelectedPassenger(null)}
                            className='w-full bg-gray-500 text-white font-semibold p-3 rounded-lg'
                        >
                            Back
                        </button>
                        <button
                            onClick={() => {
                                markCollected(selectedPassenger._id)
                                setSelectedPassenger(null)
                            }}
                            className='w-full bg-green-600 text-white font-semibold p-3 rounded-lg'
                        >
                            Mark ₹{selectedFare} as Paid
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className='mb-4 p-4 border-2 border-yellow-400 rounded-lg bg-yellow-50'>
                        <h4 className='text-lg font-semibold'>Carpool summary</h4>
                        <p className='text-sm text-gray-600 mt-2'>Passengers: {passengerCount}</p>
                        <p className='text-sm text-gray-600'>Total due: ₹{totalFare}</p>
                        {passengerCount > 1 && (
                            <p className='text-sm text-green-700'>Pay each passenger their reduced fare individually.</p>
                        )}
                    </div>

                    {passengerCount > 0 && (
                        <div className='space-y-3'>
                            <div className='p-4 rounded-lg bg-white border border-gray-200'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <h4 className='text-base font-semibold'>Collected</h4>
                                        <p className='text-xs text-gray-500'>₹{collectedAmount} / ₹{totalFare}</p>
                                    </div>
                                    <div className='text-right'>
                                        <p className='text-sm font-semibold'>{allCollected ? 'All paid' : 'Pending'}</p>
                                    </div>
                                </div>
                            </div>
                            {passengerList.map((passenger, index) => {
                                const paid = collectedPayments[passenger._id]
                                return (
                                    <div key={passenger._id || index} className='p-4 border rounded-lg bg-white'>
                                        <div className='flex items-center justify-between mb-3'>
                                            <div>
                                                <h3 className='text-base font-semibold'>{passenger.user?.fullname?.firstname} {passenger.user?.fullname?.lastname}</h3>
                                                <p className='text-xs text-gray-500'>{passenger.user?.email}</p>
                                            </div>
                                            <div className='text-right'>
                                                <p className='text-sm font-semibold'>₹{passenger.fare}</p>
                                                <p className={`text-xs ${paid ? 'text-green-600' : 'text-yellow-700'}`}>{paid ? 'Collected' : 'Awaiting'}</p>
                                            </div>
                                        </div>
                                        <div className='flex flex-wrap items-center justify-between gap-2'>
                                            <p className='text-xs text-gray-600 capitalize'>Status: {passenger.status || 'confirmed'}</p>
                                            <div className='flex gap-2 flex-wrap'>
                                                <button
                                                    disabled={paid}
                                                    onClick={() => setSelectedPassenger(passenger)}
                                                    className={`text-xs font-semibold px-3 py-2 rounded-lg ${paid ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                                >
                                                    {paid ? 'Paid' : `Show QR ₹${passenger.fare}`}
                                                </button>
                                                {!paid && (
                                                    <button
                                                        onClick={() => markCollected(passenger._id)}
                                                        className='text-xs font-semibold px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700'
                                                    >
                                                        Mark Collected
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className='mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200'>
                        <p className='text-sm text-blue-700'>Tip: use each passenger QR to collect reduced fare, then finish the ride once all are marked paid.</p>
                    </div>

                    <div className='flex gap-2 justify-between flex-col items-center'>
                        <div className='w-full mt-5'>
                            <div className='flex items-center gap-5 p-3 border-b-2'>
                                <i className="ri-map-pin-user-fill"></i>
                                <div>
                                    <h3 className='text-lg font-medium'>Pickup</h3>
                                    <p className='text-sm -mt-1 text-gray-600'>{props.ride?.pickup}</p>
                                </div>
                            </div>
                            <div className='flex items-center gap-5 p-3 border-b-2'>
                                <i className="text-lg ri-map-pin-2-fill"></i>
                                <div>
                                    <h3 className='text-lg font-medium'>Destination</h3>
                                    <p className='text-sm -mt-1 text-gray-600'>{props.ride?.destination}</p>
                                </div>
                            </div>
                        </div>

                        <div className='mt-10 w-full space-y-3'>
                            <button
                                onClick={endRide}
                                disabled={!allCollected}
                                className={`w-full mt-5 flex text-lg justify-center font-semibold p-3 rounded-lg ${allCollected ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                {allCollected ? 'Finish Ride' : 'Finish Ride after collecting all payments'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default FinishRide