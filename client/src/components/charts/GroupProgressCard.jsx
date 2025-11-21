import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function GroupProgressCard({ groupStats }) {
  return (
    <>
      {/* SVG Gradient Definition */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />   {/* Light blue start */}
            <stop offset="50%" stopColor="#3b82f6" />  {/* Medium blue middle */}
            <stop offset="100%" stopColor="#1e40af" /> {/* Dark blue end */}
          </linearGradient>
        </defs>
      </svg>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupStats.map(({ groupName, completionRate, traineeCount }) => (
          <div key={groupName} className="flex flex-col items-center space-y-4 bg-gray-50 p-6 rounded-lg shadow-md border-2 border-gray-200">
            <div className="font-bold text-gray-800 text-lg mb-2">{groupName}</div>
            <div className="relative" style={{ width: '120px', height: '120px' }}>
              {/* Blue filled circle background with white border */}
              <div className="absolute rounded-full bg-blue-600 flex items-center justify-center" 
                   style={{ 
                     top: '18px', 
                     left: '18px', 
                     width: '84px',
                     height: '84px',
                     boxShadow: '0 0 0 4px white'  // White gap/border
                   }}>
                <span className="text-white font-bold text-2xl">{completionRate}%</span>
              </div>
              {/* Progress ring overlay with gradient */}
              <CircularProgressbar
                value={completionRate}
                text=""
                styles={buildStyles({
                  pathColor: "url(#progressGradient)", // Use gradient instead of solid color
                  trailColor: "#bfdbfe",               // Light blue background ring
                  pathTransitionDuration: 0.5,
                  strokeLinecap: "round",              // Rounded ends
                })}
                strokeWidth={10}                       // Thicker stroke to match image
              />
            </div>
            <div className="text-sm text-gray-500 mt-2">{traineeCount} trainees</div>
          </div>
        ))}
      </div>
    </>
  );
}
