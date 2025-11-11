import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ProgressByTraineeChart({ traineeStats }) {
  if (!traineeStats || traineeStats.length === 0) {
    return (
      <>
        <div className="font-semibold mb-2">Progress by Trainee</div>
        <div className="text-gray-500 text-center py-10">No trainee data available</div>
      </>
    );
  }

  const data = traineeStats.map(t => ({
    name: t.traineeName,
    Completed: t.completed,
    "In Progress": t.inProgress,
    Overdue: t.overdue,
  }));

  return (
    <>
      <div className="font-semibold mb-2">Progress by Trainee</div>
      <div className="text-gray-500 text-sm mb-4">Task completion status</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barSize={20}>
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Completed" fill="#10b981" />
          <Bar dataKey="In Progress" fill="#f97316" />
          <Bar dataKey="Overdue" fill="#ec4899" />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
