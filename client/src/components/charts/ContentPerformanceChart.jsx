import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";

export default function ContentPerformanceChart({ contentPerformance }) {
  const data = contentPerformance.map(c => ({
    name: c.contentTitle,
    Completion: c.completionPercent,
  }));

  return (
    <>
      <div className="font-semibold mb-2">Content Performance</div>
      <div className="text-gray-500 text-sm mb-4">Module completion rates across all trainees</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart layout="vertical" data={data} barSize={28}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" width={140} />
          <Tooltip formatter={v => `${v}%`} />
          <Bar dataKey="Completion" fill="#10b981">
            <LabelList dataKey="Completion" position="right" formatter={v => `${v}%`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
