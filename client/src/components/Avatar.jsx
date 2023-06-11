import React from 'react'

const Avatar = ({username, userId}) => {
    const colors = ['bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200', 'bg-indigo-200', 'bg-gray-200', 'bg-teal-200', 'bg-orange-200'];

    const userIdbase = parseInt(userId, 16);
    console.log(userIdbase);
    const colorInd = userIdbase % colors.length;
    console.log(colorInd);
    const color = colors[colorInd];
  return (
    <div className={'w-12 h-12 bg-red-200 flex items-center rounded-full ' + color}>
        <div className="text-center w-full text-2xl opacity-70 ">{username[0]}</div>
    </div>
  )
}

export default Avatar