import React from 'react'
import { useContext } from 'react';
import { useState, useEffect, useRef} from 'react'
import Avatar from './Avatar';
import Logo from './Logo';
import { UserContext } from '../UserContext';
import { uniqBy } from 'lodash';

const Chat = () => {
    const [ws, setWs] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const { username, id } = useContext(UserContext);
    const [newMessageText, setNewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const divUnderMsg = useRef();

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
        else if ('text' in msgData) {
            setMessages(prev => [...prev, { ...msgData }]);
        }
    }

    const otherUsers = { ...onlineUsers };
    delete otherUsers[id];

    const msgWithoutDups = uniqBy(messages, 'id');

    function sendMessage(e) {
        e.preventDefault();
        ws.send(JSON.stringify({
            reciever: selectedUserId,
            text: newMessageText
        }))
        setNewMessageText('');
        setMessages(prev => [...prev, {
            text: newMessageText,
            sender: id,
            reciever: selectedUserId,
            id: Date.now(),
        }])

    }
    
    useEffect(() =>{
        const div = divUnderMsg.current;
        if(div){
            div.scrollIntoView({behavior: 'smooth', block: 'end'});
        }
    }, [messages])

    return (
        <div className='flex h-screen'>
            <div className="bg-white w-1/3">
                <Logo />
                {
                    Object.keys(otherUsers).map(userId => (
                        <div key={userId} onClick={() => setSelectedUserId(userId)}
                            className={"flex items-center gap-4 border-b border-gray-300  cursor-pointer " + (userId === selectedUserId ? 'bg-blue-100' : '')} >
                            {
                                userId === selectedUserId && (
                                    <div className='w-1 bg-blue-500 h-16 rounded-r-md   '>
                                    </div>
                                )
                            }

                            <div className='flex gap-2 py-3 pl-4 items-center'>
                                <Avatar
                                    username={onlineUsers[userId]}
                                    userId={userId}
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
                {!!selectedUserId && (
                    <div className='relative h-full'>
                        <div className='absolute inset-0 overflow-y-scroll'>
                            {msgWithoutDups.map((msg, index) => (
                                <div className={(msg.sender === id ? 'text-right' : 'text-left')}>
                                    <div className={'max-w-lg text-left inline-block p-2 m-2 rounded-md ' + (msg.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                                        {msg.text}
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