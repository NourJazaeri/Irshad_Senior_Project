import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function AverageScoreChart({ traineeStats }) {
  if (!traineeStats || traineeStats.length === 0) {
    return (
      <>
        <div className="font-semibold mb-2">Average Score by Trainee</div>
        <div className="text-gray-500 text-center py-10">No trainee data available</div>
      </>
    );
  }

  const data = traineeStats.map(t => ({
    name: t.traineeName,
    Score: t.avgScore,
  }));

  return (
    <>
      <div className="font-semibold mb-2">Average Score by Trainee</div>
      <div className="text-gray-500 text-sm mb-4">Quiz performance comparison</div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={v => `${v}%`} />
          <Legend />
          <Line type="monotone" dataKey="Score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
