import React from 'react'
import { useState } from 'react'

const Register = () => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

  return (
    <div className='bg-blue-50 h-screen flex items-center'>
        <form className='w-64 mx-auto'>
            <input value={username} 
                onChange={e => setUsername(e.target.value)} 
                type="text" placeholder='username' 
                className="block w-full rounded-sm mb-2 p-2 outline-blue-500" />

            <input value={password}
                onChange={e => setPassword(e.target.value)}
                type="password" placeholder='password' 
                className='block  w-full rounded-sm mb-2 p-2 outline-blue-500' />
            <button className='bg-blue-500 text-white w-full rounded-sm p-2'>Register</button>
        </form>
    </div>
  )
}

export default Register