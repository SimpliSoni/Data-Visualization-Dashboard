import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Insight } from '../types';

interface D3BarChartProps {
  data: Insight[];
  title?: string;
  subtitle?: string;
}

interface YearData {
  year: number;
  intensity: number;
  count: number;
}

const D3BarChart: React.FC<D3BarChartProps> = ({ 
  data, 
  title = "Intensity by Year",
  subtitle = "D3.js Bar Chart - Average intensity values"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 350 });

  const processData = (rawData: Insight[]): YearData[] => {
    const yearMap = rawData.reduce((acc, item) => {
      const year = item.end_year || item.start_year;
      if (year && year > 1990 && year <= 2100) {
        if (!acc[year]) {
          acc[year] = { year, intensity: 0, count: 0 };
        }
        acc[year].intensity += item.intensity || 0;
        acc[year].count += 1;
      }
      return acc;
    }, {} as Record<number, YearData>);

    return Object.values(yearMap)
      .map(d => ({
        ...d,
        intensity: d.count > 0 ? +(d.intensity / d.count).toFixed(2) : 0
      }))
      .filter(d => d.intensity > 0)
      .sort((a, b) => a.year - b.year);
  };

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 350
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // D3 Rendering
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const chartData = processData(data);
    if (chartData.length === 0) return;

    // Chart dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    // Add gradient definition
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "barGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#7367F0");
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#9E95F5");

    // Create chart group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(chartData.map(d => d.year.toString()))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.intensity) || 10])
      .nice()
      .range([height, 0]);

    // X Axis
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#A8AAAE")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("dx", "-0.5em")
      .attr("dy", "0.5em");

    g.selectAll(".x-axis path, .x-axis line")
      .style("stroke", "#DBDADE");

    // Y Axis
    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#A8AAAE");

    g.selectAll(".y-axis path")
      .style("display", "none");
    
    g.selectAll(".y-axis line")
      .style("stroke", "#DBDADE")
      .style("stroke-dasharray", "3,3");

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-width)
        .tickFormat(() => ""))
      .selectAll("line")
      .style("stroke", "#EBE9F1")
      .style("stroke-dasharray", "3,3");

    g.selectAll(".grid path")
      .style("display", "none");

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "white")
      .style("border", "1px solid #DBDADE")
      .style("border-radius", "6px")
      .style("padding", "12px")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
      .style("font-size", "13px")
      .style("z-index", "1000")
      .style("pointer-events", "none");

    // Bars with animation
    g.selectAll(".bar")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.year.toString()) || 0)
      .attr("width", xScale.bandwidth())
      .attr("y", height) // Start from bottom
      .attr("height", 0) // Start with 0 height
      .attr("fill", "url(#barGradient)")
      .attr("rx", 4) // Rounded corners
      .attr("ry", 4)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", "#5E50EE")
          .attr("transform", "scale(1.02)");
        
        tooltip
          .style("visibility", "visible")
          .html(`
            <div style="font-weight: 600; color: #5D596C; margin-bottom: 8px; border-bottom: 1px solid #EBE9F1; padding-bottom: 6px;">
              Year: ${d.year}
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <span style="color: #A5A3AE;">Avg Intensity:</span>
              <span style="font-weight: 700; color: #7367F0;">${d.intensity.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px; margin-top: 4px;">
              <span style="color: #A5A3AE;">Records:</span>
              <span style="font-weight: 600; color: #5D596C;">${d.count}</span>
            </div>
          `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", "url(#barGradient)")
          .attr("transform", "scale(1)");
        
        tooltip.style("visibility", "hidden");
      })
      // Animate bars
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr("y", d => yScale(d.intensity))
      .attr("height", d => height - yScale(d.intensity));

    // Y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#A5A3AE")
      .text("Average Intensity");

    // Cleanup tooltip on unmount
    return () => {
      d3.selectAll(".d3-tooltip").remove();
    };
  }, [data, dimensions]);

  return (
    <div className="bg-white p-6 rounded-card shadow-card">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-txt-main">{title}</h3>
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
            D3.js
          </span>
        </div>
        <p className="text-sm text-txt-muted">{subtitle}</p>
      </div>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} className="w-full" />
      </div>
      {data.length === 0 && (
        <div className="flex items-center justify-center h-[350px] text-txt-muted">
          No data available for chart
        </div>
      )}
    </div>
  );
};

export default D3BarChart;
