import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const ConfirmRidePopUp = (props) => {
    const [ otp, setOtp ] = useState('')
    const navigate = useNavigate()
    const totalPassengers = props.ride?.passengers?.length || 0;
    const isCarpool = props.ride?.vehicleType?.includes('Carpool');
    const currentPassengerFare = isCarpool ? props.ride?.passengers?.[0]?.fare || props.ride?.fare : props.ride?.fare;

    const submitHander = async (e) => {
        e.preventDefault()

        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/start-ride`, {
            params: {
                rideId: props.ride._id,
                otp: otp
            },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('captainToken') || localStorage.getItem('token')}`
            }
        })

        if (response.status === 200) {
            props.setConfirmRidePopupPanel(false)
            props.setRidePopupPanel(false)
            navigate('/captain-riding', { state: { ride: response.data } })
        }
    }

    const handleAcceptCarpoolRequest = async (passengerId) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/accept-passenger`, {
                rideId: props.ride._id,
                passengerId: passengerId
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('captainToken') || localStorage.getItem('token')}`
                }
            });
            
            if (response.status === 200) {
                alert('Passenger request accepted!');
                // Refresh ride data
                props.onPassengerAccepted && props.onPassengerAccepted(response.data);
            }
        } catch (error) {
            alert('Failed to accept passenger: ' + error.response?.data?.message);
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setRidePopupPanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-3'>Confirm Ride to Start</h3>
            {isCarpool && <p className='text-sm text-blue-600 font-medium mb-2'>🚗 Carpool Ride - {totalPassengers} Passengers</p>}
            
            {/* Show all passengers */}
            <div className='mb-4 max-h-32 overflow-y-auto'>
              {props.ride?.passengers?.map((passenger, index) => (
                <div key={index} className='flex items-center justify-between p-2 bg-yellow-50 rounded-lg mb-2 border border-yellow-200'>
                    <div className='flex items-center gap-2'>
                        <img className='h-8 rounded-full object-cover w-8' src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" alt="" />
                        <div className='flex-1'>
                          <h4 className='text-sm font-medium'>{passenger.user?.fullname?.firstname}</h4>
                          <p className='text-xs text-gray-500'>{passenger.user?.email}</p>
                        </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-semibold'>₹{passenger.fare}</p>
                      <p className='text-xs text-gray-600 capitalize'>{passenger.status}</p>
                      {passenger.status === 'pending' && (
                        <button 
                          onClick={() => handleAcceptCarpoolRequest(passenger._id)}
                          className='text-xs mt-1 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600'
                        >
                          Accept
                        </button>
                      )}
                    </div>
                </div>
              ))}
            </div>

            <div className='flex gap-2 justify-between flex-col items-center'>
                <div className='w-full'>
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
                    <div className='flex items-center gap-5 p-3'>
                        <i className="ri-currency-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>₹{currentPassengerFare}</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.vehicleType}{isCarpool ? ` • ${totalPassengers} passengers` : ''}</p>
                        </div>
                    </div>
                </div>

                <div className='mt-6 w-full'>
                    <form onSubmit={submitHander}>
                        <input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" className='bg-[#eee] px-6 py-4 font-mono text-lg rounded-lg w-full mt-3' placeholder='Enter OTP' required />

                        <button type="submit" className='w-full mt-5 text-lg flex justify-center bg-green-600 text-white font-semibold p-3 rounded-lg'>Confirm & Start</button>
                        <button onClick={() => {
                            props.setConfirmRidePopupPanel(false)
                            props.setRidePopupPanel(false)

                        }} className='w-full mt-2 bg-red-600 text-lg text-white font-semibold p-3 rounded-lg'>Cancel</button>

                    </form>
                </div>
            </div>
        </div>
    )
}

export default ConfirmRidePopUp