import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'

const Captainlogin = () => {

  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')

  const { captain, setCaptain } = React.useContext(CaptainDataContext)
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
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  const submitHandler = async (e) => {
    e.preventDefault();
    const captainData = {
      email: email,
      password
    }
    console.log('CaptainLogin: logging in with email:', email);

    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/login`, captainData)

    if (response.status === 200) {
      const data = response.data
      console.log('CaptainLogin: login successful, captain ID:', data.captain._id);
      console.log('CaptainLogin: token received:', data.token ? 'present' : 'missing');

      // Verify token content
      const decoded = decodeToken(data.token);
      console.log('CaptainLogin: decoded token ID:', decoded?._id);
      console.log('CaptainLogin: token ID matches captain ID?', decoded?._id === data.captain._id);

      // IMPORTANT: Clear ALL user-related data to prevent mixing tokens
      localStorage.removeItem('user')
      localStorage.removeItem('userData')
      localStorage.removeItem('userRole')
      localStorage.removeItem('captain-token')
      
      // Set captain data
      setCaptain(data.captain)
      localStorage.setItem('token', data.token)
      localStorage.setItem('captainToken', data.token)
      localStorage.setItem('captainData', JSON.stringify(data.captain))
      localStorage.setItem('userRole', 'captain')
      
      console.log('CaptainLogin: localStorage cleared and captain token set');
      
      navigate('/captain-home')

    }

    setEmail('')
    setPassword('')
  }
  return (
    <div className='p-7 h-screen flex flex-col justify-between'>
      <div>
        <img className='w-32 mb-3' src="/LogoDark.png" alt="GoPoola Logo" />

        <form onSubmit={(e) => {
          submitHandler(e)
        }}>
          <h3 className='text-lg font-medium mb-2'>What's your email</h3>
          <input
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
            type="email"
            placeholder='email@example.com'
          />

          <h3 className='text-lg font-medium mb-2'>Enter Password</h3>

          <input
            className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
            }}
            required type="password"
            placeholder='password'
          />

          <button
            className='bg-[#111] text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base'
          >Login</button>

        </form>
        <p className='text-center'>Join a fleet? <Link to='/captain-signup' className='text-blue-600'>Register as a Captain</Link></p>
      </div>
      <div>
        <Link
          to='/login'
          className='bg-[#d5622d] flex items-center justify-center text-white font-semibold mb-5 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base'
        >Sign in as User</Link>
      </div>
    </div>
  )
}

export default Captainlogin