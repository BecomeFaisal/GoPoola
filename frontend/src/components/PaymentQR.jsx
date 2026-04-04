import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

const PaymentQR = ({ amount, upiId, rideId }) => {
    // Generate UPI payment URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=GoPoola&am=${amount}&cu=INR&tn=Ride Payment ${rideId}`

    return (
        <div className='flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-lg'>
            <h3 className='text-xl font-semibold mb-4 text-gray-800'>Collect Payment</h3>

            <div className='bg-gray-50 p-4 rounded-lg mb-4'>
                <QRCodeSVG
                    value={upiUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                    className="mx-auto"
                />
            </div>

            <div className='text-center'>
                <p className='text-2xl font-bold text-green-600 mb-2'>₹{amount}</p>
                <p className='text-sm text-gray-600 mb-2'>Scan QR code to pay</p>
                <p className='text-xs text-gray-500'>UPI ID: {upiId}</p>
            </div>

            <div className='mt-4 p-3 bg-blue-50 rounded-lg w-full'>
                <p className='text-sm text-blue-800 text-center'>
                    Ask passenger to scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)
                </p>
            </div>
        </div>
    )
}

export default PaymentQR