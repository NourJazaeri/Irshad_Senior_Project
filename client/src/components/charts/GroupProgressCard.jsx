import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const getColor = percent => {
  if (percent >= 85) return "#2563eb"; // darker blue (high performance like Engineering 92%)
  if (percent >= 70) return "#10b981"; // green (good performance like Marketing 85%)
  if (percent >= 50) return "#f97316"; // orange (medium performance like Sales 78%)
  return "#ec4899"; // pink (low performance)
};

export default function GroupProgressCard({ groupStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {groupStats.map(({ groupName, completionRate, traineeCount }) => (
        <div key={groupName} className="flex flex-col items-center">
          <div style={{ width: '100px', height: '100px' }}>
            <CircularProgressbar
              value={completionRate}
              text={`${completionRate}%`}
              styles={buildStyles({
                pathColor: getColor(completionRate),
                textColor: getColor(completionRate),
                trailColor: "#e5e7eb",
              })}
            />
          </div>
          <div className="mt-3 text-base font-semibold text-gray-700 text-center">{groupName}</div>
          <div className="text-sm text-gray-500">{traineeCount} trainees</div>
        </div>
      ))}
    </div>
  );
}
