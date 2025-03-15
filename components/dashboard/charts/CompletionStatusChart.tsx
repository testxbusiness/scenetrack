'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface CompletionStatusChartProps {
  data: {
    name: string
    value: number
  }[]
  total: number
}

// Colors for completion status
const COLORS = ['#4F46E5', '#D1D5DB'] // Indigo for completed, Gray for incomplete

export default function CompletionStatusChart({ data, total }: CompletionStatusChartProps) {
  // If no data, show a message
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Nessun dato disponibile
      </div>
    )
  }

  // Calculate completion percentage
  const completedValue = data.find(item => item.name === 'Completate')?.value || 0
  const completionPercentage = Math.round((completedValue / total) * 100)

  return (
    <div className="flex flex-col md:flex-row items-center justify-between">
      <div className="w-full md:w-1/2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={50}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} scene`, 'Quantità']}
              labelFormatter={(name) => `${name}`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4">
        <div className="text-6xl font-bold text-primary">
          {completionPercentage}%
        </div>
        <div className="text-xl text-muted-foreground mt-2">
          Completamento
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm text-muted-foreground">
            {completedValue} su {total} scene completate
          </div>
          <div className="text-sm text-muted-foreground">
            {total - completedValue} scene rimanenti
          </div>
        </div>
      </div>
    </div>
  )
}
