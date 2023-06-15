import React from 'react'
import { useContext } from 'react';
import { useState, useEffect, useRef } from 'react'
import Avatar from './Avatar';
import Logo from './Logo';
import { UserContext } from '../UserContext';
import { uniqBy } from 'lodash';
import axios from 'axios';
import Contact from './Contact';

const Chat = () => {
    const [ws, setWs] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [offlineUsers, setOfflineUsers] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const { username, id, setId, setUsername } = useContext(UserContext);
    const [newMessageText, setNewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const divUnderMsg = useRef();

    useEffect(() => {
        connectToWebSocket();
    }, [selectedUserId]);

    function connectToWebSocket() {
        const ws = new WebSocket('wss://chat-server-green.vercel.app');
        // const ws = new WebSocket('ws://chat-server-green.vercel.app/');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('close', () => {
            setTimeout(() => {
                console.log("Reconnecting...")
                connectToWebSocket();
            }, 1000)
        })
    }

    useEffect(() => {
        if (selectedUserId) {
             axios.get("/messages/" + selectedUserId).then(res => {
                setMessages(res.data);
                console.log(selectedUserId);
            })
        }
    }, [selectedUserId])

    useEffect(() => {
        axios.get('/people').then(res => {
            const offlineUsersArr = res.data
                .filter(p => p._id !== id)
                .filter(p => !Object.keys(onlineUsers).includes(p._id));

            const offlineUsers = {};
            offlineUsersArr.forEach(p => {
                offlineUsers[p._id] = p;
            });
            setOfflineUsers(offlineUsers);
        })
    }, [onlineUsers])


    function showOnlineUsers(users) {
        const people = {};
        users.forEach(({ userId, username }) => {
            people[userId] = username;
        });
        setOnlineUsers(people);
    }

    function handleMessage(e) {
        const msgData = JSON.parse(e.data);
        // console.log(msgData.online);

        if ('online' in msgData) {
            showOnlineUsers(msgData.online);
        }
        else if ('text' in msgData) {
            if(msgData.sender === selectedUserId)
            setMessages(prev => [...prev, { ...msgData }]);
        }
    }

    function logout() {
        axios.post('/logout').then(() => {
            setWs(null);
            setId(null);
            setUsername(null);
        })
    }

    function sendFile(e){
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = () =>{
            sendMessage(null, {
                name: e.target.files[0].name,
                data: reader.result, 

            })
        };

    }

    const otherUsers = { ...onlineUsers };
    delete otherUsers[id];

    const msgWithoutDups = uniqBy(messages, '_id');

    async function sendMessage(e, file=null) {
        if(e) e.preventDefault();
        await ws.send(JSON.stringify({
            reciever: selectedUserId,
            text: newMessageText,
            file,
        }))
        
        if(file){
            setTimeout(() =>{
                axios.get('/messages/'+selectedUserId).then(res => {
                    setMessages(res.data);
                })
            }, 500);   
        }
        else{
            setNewMessageText('');
            setMessages(prev => [...prev, {
                text: newMessageText,
                sender: id,
                reciever: selectedUserId,
                _id: Date.now(),
            }])
        }

    }

    useEffect(() => {
        const div = divUnderMsg.current;
        if (div) {
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages])

    return (
        <div className='flex h-screen'>
            <div className="bg-white w-1/3 flex flex-col">
                <div className='flex-grow'>
                    <Logo />
                    {

                        Object.keys(otherUsers).map(userId => (
                            <Contact
                                key={userId}
                                id={userId}
                                online={true}
                                username={otherUsers[userId]}
                                onClick={(() => setSelectedUserId(userId))}
                                selected={userId === selectedUserId}
                            />
                        ))
                    }
                    {
                        Object.keys(offlineUsers).map(userId => (
                            <Contact
                                key={userId}
                                id={userId}
                                online={false}
                                username={offlineUsers[userId].username}
                                onClick={(() => setSelectedUserId(userId))}
                                selected={userId === selectedUserId}
                            />
                        ))
                    }
                </div>
                <div className='p-2 text-center flex items-center justify-center'>
                    <span className='mr-4 flex items-center text-gray-600'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                        </svg>
                        Hello, {username}</span>
                    <button onClick={logout} className='text-sm text-gray-500 bg-blue-100 rounded-md border py-1 px-2'>
                        Logout
                    </button>
                </div>
            </div>

            <div className="bg-blue-100 w-2/3 p-2 flex flex-col">
                <div className="flex-grow messages">
                    {!selectedUserId && (
                        <div className='flex flex-col items-center justify-center h-full'>
                            <div className='text-gray-500 text-md'>&larr; Select a user to chat</div>
                        </div>
                    )}
                </div>
                {!!selectedUserId && (
                    <div className='relative h-full'>
                        <div className='absolute inset-0 overflow-y-scroll'>
                            {msgWithoutDups.map((msg) => (
                                <div key={msg._id} className={(msg.sender === id ? ' text-right' : ' text-left')}>
                                    <div className={'max-w-lg text-left inline-block p-2 m-2 rounded-md  ' + (msg.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                                        {msg.text}
                                        {msg.file &&(
                                            <div>
                                                <a target='_blank' className='underline' href={axios.defaults.baseURL + '/fileUpload/' + msg.file}>
                                                    {msg.file}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={divUnderMsg}></div>
                        </div>
                    </div>
                )}

                {!!selectedUserId && (
                    <form className='flex gap-2' onSubmit={sendMessage}>
                        <input type="text" placeholder='Type your message here'
                            className='bg-white p-2 flex-grow border outline-blue-500 rounded-md'
                            value={newMessageText}
                            onChange={e => setNewMessageText(e.target.value)}
                        />
                        <label type='button' className='cursor-pointer bg-gray-300 p-2 rounded-md text-blue-500'>
                        <input type="file" className='hidden' onChange={sendFile} />
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
                            </svg>

                        </label>
                        <button type="submit" className='bg-blue-500 p-2 text-white rounded-md'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                )}

            </div>
        </div>
    )
}

export default Chat
