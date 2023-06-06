import React from 'react'
import { useState } from 'react'
import axios from 'axios';
import { useContext } from 'react';
import { UserContext } from '../UserContext';

const Register = () => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext)

    async function handleSubmit(e) {
        e.preventDefault();
        const url = isLoginOrRegister === 'register' ? '/register' : '/login';
        const {data} = await axios.post(url, {username, password});
        setLoggedInUsername(username);
        setId(data.id);
    }

  return (
    <div className='bg-blue-50 h-screen flex items-center'>
        <form className='w-64 mx-auto' onSubmit={handleSubmit}>
            <input value={username} 
                onChange={e => setUsername(e.target.value)} 
                type="text" placeholder='username' 
                className="block w-full rounded-sm mb-2 p-2 outline-blue-500" />

            <input value={password}
                onChange={e => setPassword(e.target.value)}
                type="password" placeholder='password' 
                className='block  w-full rounded-sm mb-2 p-2 outline-blue-500' />
            <button className='bg-blue-500 text-white w-full rounded-sm p-2'>
            {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
            </button>
            <div className='text-center mt-2'>
            {isLoginOrRegister ==='register' && 
                <div>
                    Already a user?  
                    <button className='text-blue-500 pl-2' onClick={() =>{setIsLoginOrRegister('login')}}>
                        Login  
                    </button>
                </div>
            }
            {isLoginOrRegister ==='login' && 
                <div>
                    Don't have an account?  
                    <button className='text-blue-500 pl-2' onClick={() =>{setIsLoginOrRegister('register')}}>
                        Register  
                    </button>
                </div>
            }
                
            </div>
        </form>
    </div>
  )
}

export default Register