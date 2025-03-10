'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SceneProgressionChartProps {
  data: {
    date: string
    count: number
    cumulative: number
  }[]
}

export default function SceneProgressionChart({ data }: SceneProgressionChartProps) {
  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Nessun dato disponibile
      </div>
    )
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            interval={Math.ceil(data.length / 5) - 1} // Show approximately 5 ticks
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number, name: string) => {
              return [value, name === 'cumulative' ? 'Scene totali' : 'Scene create']
            }}
            labelFormatter={(date) => `Data: ${date}`}
          />
          <Line 
            type="monotone" 
            dataKey="cumulative" 
            stroke="#8884d8" 
            name="Scene totali"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#82ca9d" 
            name="Scene create"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
