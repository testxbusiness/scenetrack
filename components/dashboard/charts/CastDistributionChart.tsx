'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface CastDistributionData {
  name: string
  count: number
}

interface CastDistributionChartProps {
  data: CastDistributionData[]
}

export default function CastDistributionChart({ data }: CastDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove()

    // Sort data by count in descending order
    const sortedData = [...data].sort((a, b) => b.count - a.count)
    
    // Take top 10 cast members for readability
    const displayData = sortedData.slice(0, 10)

    // Set up dimensions
    const margin = { top: 20, right: 20, bottom: 60, left: 60 }
    const width = chartRef.current.clientWidth - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    // Create SVG
    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Set up scales
    const x = d3
      .scaleBand()
      .domain(displayData.map((d: CastDistributionData) => d.name))
      .range([0, width])
      .padding(0.2)

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(displayData, (d: CastDistributionData) => d.count) || 0])
      .nice()
      .range([height, 0])

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '12px')

    // Add Y axis
    svg
      .append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '12px')

    // Add Y axis label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .text('Numero di scene')
      .style('font-size', '12px')

    // Add bars
    svg
      .selectAll('.bar')
      .data(displayData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d: CastDistributionData) => x(d.name) || 0)
      .attr('width', x.bandwidth())
      .attr('y', (d: CastDistributionData) => y(d.count))
      .attr('height', (d: CastDistributionData) => height - y(d.count))
      .attr('fill', '#3b82f6') // Blue color
      .attr('rx', 2) // Rounded corners

    // Add value labels on top of bars
    svg
      .selectAll('.label')
      .data(displayData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d: CastDistributionData) => (x(d.name) || 0) + x.bandwidth() / 2)
      .attr('y', (d: CastDistributionData) => y(d.count) - 5)
      .attr('text-anchor', 'middle')
      .text((d: CastDistributionData) => d.count)
      .style('font-size', '12px')
      .style('fill', '#6b7280')

  }, [data])

  return (
    <div className="w-full h-[300px]" ref={chartRef}>
      {(!data || data.length === 0) && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Nessun dato disponibile
        </div>
      )}
    </div>
  )
}
