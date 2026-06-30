"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis
} from "recharts";

const data = [
  { month: "Jan", price: 42 },
  { month: "Feb", price: 45 },
  { month: "Mar", price: 48 },
  { month: "Apr", price: 46 },
  { month: "May", price: 51 },
  { month: "Jun", price: 54 },
];

export default function PriceChart() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-8">
        Price Trend
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="price"
              stroke="#16a34a"
              strokeWidth={4}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
