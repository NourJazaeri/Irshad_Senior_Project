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
      <div className="font-semibold mb-2">Detailed Performance by Group</div>
      <div className="text-gray-500 text-sm mb-4">Individual trainee metrics per team</div>
      <div className="flex space-x-1 mb-4 border-b border-gray-200">
        {groupNames.map(name => (
          <button
            key={name}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === name 
                ? "text-gray-900 border-b-2 border-gray-900" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left">Trainee</th>
              <th className="px-3 py-2 text-center">Completed</th>
              <th className="px-3 py-2 text-center">In Progress</th>
              <th className="px-3 py-2 text-center">Overdue</th>
              <th className="px-3 py-2 text-center">Average Score</th>
              <th className="px-3 py-2 text-center">Completion %</th>
            </tr>
          </thead>
          <tbody>
            {groups[activeTab]?.map(t => (
              <tr key={t.traineeName} className="border-b">
                <td className="px-3 py-2">{t.traineeName}</td>
                <td className="px-3 py-2 text-center">{t.completed}</td>
                <td className="px-3 py-2 text-center">{t.inProgress}</td>
                <td className="px-3 py-2 text-center">{t.overdue}</td>
                <td className="px-3 py-2 text-center">{t.avgScore}%</td>
                <td className="px-3 py-2 text-center">{t.completionPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
