import React, { useState } from "react";

export default function TraineeProgressTable({ traineeStats }) {
  // Group trainees by group name
  const groups = {};
  traineeStats.forEach(t => {
    if (!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  });
  const groupNames = Object.keys(groups);
  const [activeTab, setActiveTab] = useState(groupNames[0] || "");

  return (
    <>
      <div className="font-semibold text-lg mb-2">Detailed Performance by Group</div>
      <div className="text-gray-500 text-sm mb-6">Individual trainee metrics per team</div>
      
      {/* Tabs */}
      <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
        {groupNames.map(name => (
          <button
            key={name}
            className={`flex-1 px-6 py-2 font-medium rounded-md transition-all ${
              activeTab === name 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-blue-800 to-blue-600 text-white">
              <th className="px-6 py-4 text-left font-semibold">Trainee</th>
              <th className="px-6 py-4 text-center font-semibold">Completed</th>
              <th className="px-6 py-4 text-center font-semibold">In Progress</th>
              <th className="px-6 py-4 text-center font-semibold">Overdue</th>
              <th className="px-6 py-4 text-center font-semibold">Average Score</th>
              <th className="px-6 py-4 text-center font-semibold">Completion %</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {groups[activeTab]?.map((t, index) => (
              <tr 
                key={t.traineeName} 
                className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <td className="px-6 py-4 font-medium text-gray-900">{t.traineeName}</td>
                <td className="px-6 py-4 text-center text-gray-700">{t.completed}</td>
                <td className="px-6 py-4 text-center text-gray-700">{t.inProgress}</td>
                <td className="px-6 py-4 text-center text-gray-700">{t.overdue}</td>
                <td className="px-6 py-4 text-center text-gray-700">{t.avgScore}%</td>
                <td className="px-6 py-4 text-center text-gray-700">{t.completionPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
