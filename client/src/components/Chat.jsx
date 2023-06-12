import React from 'react'
import { useContext } from 'react';
import { useState, useEffect } from 'react'
import Avatar from './Avatar';
import Logo from './Logo';
import { UserContext } from '../UserContext';

const Chat = () => {
    const [ws, setWs] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const {username, id} = useContext(UserContext);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8800');
        setWs(ws);
        ws.addEventListener('message', handleMessage)
    }, []);

    function showOnlineUsers(users) {
        const people = {};
        users.forEach(({ userId, username }) => {
            people[userId] = username;
        });
        setOnlineUsers(people);
        console.log(onlineUsers);
    }

    function handleMessage(e) {
        const msgData = JSON.parse(e.data);
        // console.log(msgData.online);

        if ('online' in msgData) {
            showOnlineUsers(msgData.online);
        }
    }

    const otherUsers = {...onlineUsers};
    delete otherUsers[id];


    return (
        <div className='flex h-screen'>
            <div className="bg-white w-1/3">
                <Logo />
                {
                    Object.keys(otherUsers).map(userId => (
                        <div key={userId} onClick={() => setSelectedUserId(userId)}
                        className={"flex items-center gap-4 border-b border-gray-300  cursor-pointer " + (userId===selectedUserId ? 'bg-blue-100' : '')} >
                        {
                            userId===selectedUserId && (
                                <div className='w-1 bg-blue-500 h-16 rounded-r-md   '>
                                </div>
                            )
                        }

                        <div className='flex gap-2 py-3 pl-4 items-center'>
                            <Avatar 
                                    username = {onlineUsers[userId]}
                                    userId = {userId}
                                />
                                <span className='font-semibold text-lg'>
                                {onlineUsers[userId]}
                                </span>
                        </div>
                            
                        </div>
                    ))
                }

            </div>
            <div className="bg-blue-100 w-2/3 p-2 flex flex-col">
                <div className="flex-grow messages">
                    {!selectedUserId && (
                        <div className='flex flex-col items-center justify-center h-full'>
                            <div className='text-gray-500 text-md'>&larr; Select a user to chat</div>
                        </div>
                    )}
                </div>
                <div className='flex gap-2'>
                    <input type="text" placeholder='Type your message here'
                        className='bg-white p-2 flex-grow border outline-blue-500 rounded-md' />
                    <button className='bg-blue-500 p-2 text-white rounded-md'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>

                    </button>
                </div>
            </div>
        </div>
    )
}

export default Chat