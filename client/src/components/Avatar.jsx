import React from 'react'

const Avatar = ({ username, userId, online }) => {
  const colors = ['bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200', 'bg-indigo-200', 'bg-gray-200', 'bg-teal-200', 'bg-orange-200'];

  const userIdbase = parseInt(userId, 16);
  const colorInd = userIdbase % colors.length;
  const color = colors[colorInd];
  return (
    <div>
      <div className={'w-12 relative h-12 bg-red-200 flex items-center rounded-full ' + color}>
        <div className="text-center w-full text-2xl opacity-70 ">{username[0]}</div>
        {online && (
          <div className='absolute w-3 h-3 rounded-full bg-green-500 border  border-white top-0 left-0'></div>
        )}

        {!online && (
          <div className='absolute w-3 h-3 rounded-full bg-gray-500 border  border-white top-0 left-0'></div>
        )}
      </div>
    </div>
  )
}

export default Avatar