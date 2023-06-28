import React from 'react'
import Avatar from './Avatar';

const Contact = ({id, username, onClick, selected, online}) => {
    return (
        <div key={id} onClick={() => onClick(id)}
            className={"flex items-center gap-4 border-b border-gray-900  cursor-pointer " + (selected ? 'bg-gray-900' : '')} >
            {
                selected && (
                    <div className='w-1 bg-blue-500 h-16 rounded-r-md   '>
                    </div>
                )
            }

            <div className='flex gap-2 py-3 pl-4 items-center'>
                <Avatar
                    online={online}
                    username={username}
                    userId={id}
                />
                <span className='text-white font-semibold text-lg'>
                    {username}
                </span>
            </div>
        </div>
    )
}

export default Contact