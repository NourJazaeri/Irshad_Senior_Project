import React from "react";
import { LineChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart } from "recharts";

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
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e40af" stopOpacity={1} />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={100} 
            stroke="#000000"
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="#000000"
            width={40}
          />
          <Tooltip 
            formatter={(value, name) => {
              // Only show the value once, not for both Area and Line
              if (name === "Score") {
                return [`${value}%`, name];
              }
              return null;
            }}
            itemSorter={() => 0}
          />
          <Legend 
            wrapperStyle={{ color: '#000000' }}
            formatter={(value) => <span style={{ color: '#000000' }}>{value}</span>}
          />
          <Area 
            type="linear" 
            dataKey="Score" 
            fill="url(#areaGradient)" 
            stroke="none"
            legendType="none"
            tooltipType="none"
          />
          <Line 
            type="linear" 
            dataKey="Score" 
            stroke="url(#lineGradient)" 
            strokeWidth={3} 
            dot={{ r: 5, fill: "#3b82f6" }} 
            activeDot={{ r: 7, fill: "#1e40af" }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
