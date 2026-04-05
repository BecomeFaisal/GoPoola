import React from 'react'

const RidePopUp = (props) => {
    const totalPassengers = props.ride?.passengers?.length || 0;
    const isCarpool = props.ride?.vehicleType?.includes('Carpool');
    const perPersonFare = totalPassengers > 0 ? Math.round(props.ride?.fare / totalPassengers) : props.ride?.fare;

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setRidePopupPanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-2'>New Ride Available!</h3>
            {isCarpool && <p className='text-sm text-blue-600 font-medium mb-3'>🚗 Carpool Ride</p>}
            
            {/* Show all passengers */}
            <div className='mb-4'>
              <h4 className='text-lg font-semibold mb-2'>Passenger{totalPassengers > 1 ? 's' : ''} ({totalPassengers})</h4>
              {props.ride?.passengers?.map((passenger, index) => (
                <div key={index} className='flex items-center justify-between p-3 bg-yellow-50 rounded-lg mb-2 border border-yellow-200'>
                    <div className='flex items-center gap-3'>
                        <img className='h-10 rounded-full object-cover w-10' src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" alt="" />
                        <div>
                          <h2 className='text-base font-medium'>{passenger.user?.fullname?.firstname} {passenger.user?.fullname?.lastname}</h2>
                          <p className='text-xs text-gray-500'>{passenger.user?.email}</p>
                        </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold'>₹{passenger.fare}</p>
                      <p className='text-xs text-gray-600 capitalize'>{passenger.status}</p>
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
                            <h3 className='text-lg font-medium'>₹{props.ride?.fare} <span className='text-sm text-gray-500'>(₹{perPersonFare} per person)</span></h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.vehicleType}</p>
                        </div>
                    </div>
                </div>
                <div className='mt-5 w-full '>
                    <button onClick={() => {
                        props.setConfirmRidePopupPanel(true)
                        props.confirmRide()

                    }} className=' bg-green-600 w-full text-white font-semibold p-2 px-10 rounded-lg'>Accept Ride</button>

                    <button onClick={() => {
                        props.setRidePopupPanel(false)

                    }} className='mt-2 w-full bg-gray-300 text-gray-700 font-semibold p-2 px-10 rounded-lg'>Ignore</button>


                </div>
            </div>
        </div>
    )
}

export default RidePopUp