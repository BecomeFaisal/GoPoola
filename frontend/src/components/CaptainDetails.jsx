
import React, { useContext } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'

const CaptainDetails = () => {

    const { captain } = useContext(CaptainDataContext)

    return (
        <div>
            <div className='flex items-center justify-between'>
                <div className='flex items-center justify-start gap-3'>
                    <img className='h-10 w-10 rounded-full object-cover' src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdlMd7stpWUCmjpfRjUsQ72xSWikidbgaI1w&s" alt="" />
                    <h4 className='text-lg font-medium capitalize'>{captain.fullname.firstname + " " + captain.fullname.lastname}</h4>
                    <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span className='text-sm text-green-600'>Online</span>
                    </div>
                </div>
            </div>
            <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
                <h5 className='text-md font-semibold mb-2'>Vehicle Details</h5>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <p className='text-sm text-gray-600'>Vehicle Type</p>
                        <p className='font-medium capitalize'>{captain.vehicle?.vehicleType || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-600'>Color</p>
                        <p className='font-medium capitalize'>{captain.vehicle?.color || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-600'>Number Plate</p>
                        <p className='font-medium uppercase'>{captain.vehicle?.plate || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-600'>Capacity</p>
                        <p className='font-medium'>{captain.vehicle?.capacity || 'N/A'} seats</p>
                    </div>
                </div>
                <div className='mt-3'>
                    <p className='text-sm text-gray-600'>UPI ID</p>
                    <p className='font-medium'>{captain.upiId || 'captain@upi'}</p>
                </div>
            </div>
        </div>
    )
}

export default CaptainDetails