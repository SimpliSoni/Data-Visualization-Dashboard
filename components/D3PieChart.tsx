import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Insight } from '../types';

interface D3PieChartProps {
  data: Insight[];
  field: keyof Insight;
  title?: string;
  subtitle?: string;
  isDoughnut?: boolean;
  limit?: number;
}

interface PieData {
  name: string;
  value: number;
}

const COLORS = [
  '#7367F0', '#FF9F43', '#28C76F', '#00CFE8', '#EA5455',
  '#A8AAAE', '#9E95F5', '#FFB976', '#5BD193', '#4DD4E8',
];

const D3PieChart: React.FC<D3PieChartProps> = ({ 
  data, 
  field,
  title = "Distribution Chart",
  subtitle = "D3.js Pie Chart",
  isDoughnut = true,
  limit = 8
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 300 });

  // Process data for the chart
  const processData = (rawData: Insight[]): PieData[] => {
    const countMap = rawData.reduce((acc, item) => {
      const value = String(item[field] || 'Unknown');
      if (value && value !== 'Unknown' && value.trim() !== '') {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  };

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setDimensions({
          width: width,
          height: Math.min(width, 300)
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

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Chart dimensions
    const size = Math.min(dimensions.width, dimensions.height);
    const radius = size / 2 - 20;
    const innerRadius = isDoughnut ? radius * 0.55 : 0;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    // Create chart group centered
    const g = svg.append("g")
      .attr("transform", `translate(${dimensions.width / 2},${dimensions.height / 2})`);

    // Create pie generator
    const pie = d3.pie<PieData>()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.02);

    // Create arc generator
    const arc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(4);

    // Create hover arc (larger)
    const arcHover = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 8)
      .cornerRadius(4);

    // Color scale
    const colorScale = d3.scaleOrdinal<string>()
      .domain(chartData.map(d => d.name))
      .range(COLORS);

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-pie-tooltip")
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

    // Calculate total for percentage
    const total = chartData.reduce((sum, d) => sum + d.value, 0);

    // Draw pie slices
    const slices = g.selectAll(".slice")
      .data(pie(chartData))
      .enter()
      .append("g")
      .attr("class", "slice");

    slices.append("path")
      .attr("d", arc)
      .attr("fill", d => colorScale(d.data.name))
      .style("cursor", "pointer")
      .style("opacity", 0)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover as any)
          .style("filter", "brightness(1.1)");

        const percentage = ((d.data.value / total) * 100).toFixed(1);
        tooltip
          .style("visibility", "visible")
          .html(`
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #EBE9F1; padding-bottom: 6px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${colorScale(d.data.name)};"></div>
              <span style="font-weight: 600; color: #5D596C;">${d.data.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <span style="color: #A5A3AE;">Count:</span>
              <span style="font-weight: 700; color: #5D596C;">${d.data.value}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px; margin-top: 4px;">
              <span style="color: #A5A3AE;">Share:</span>
              <span style="font-weight: 600; color: #7367F0;">${percentage}%</span>
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
          .attr("d", arc as any)
          .style("filter", "none");
        
        tooltip.style("visibility", "hidden");
      })
      // Animate slices
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .style("opacity", 1)
      .attrTween("d", function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t)) || "";
        };
      });

    // Center text for doughnut
    if (isDoughnut) {
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.2em")
        .style("font-size", "24px")
        .style("font-weight", "700")
        .style("fill", "#5D596C")
        .text(total.toLocaleString());

      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.2em")
        .style("font-size", "12px")
        .style("fill", "#A5A3AE")
        .text("Total");
    }

    // Cleanup tooltip on unmount
    return () => {
      d3.selectAll(".d3-pie-tooltip").remove();
    };
  }, [data, dimensions, field, isDoughnut, limit]);

  // Get legend data
  const legendData = processData(data);

  return (
    <div className="bg-white p-6 rounded-card shadow-card">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-txt-main">{title}</h3>
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
            D3.js
          </span>
        </div>
        <p className="text-sm text-txt-muted">{subtitle}</p>
      </div>
      
      <div ref={containerRef} className="w-full flex flex-col items-center">
        <svg ref={svgRef} />
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {legendData.slice(0, 6).map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-txt-muted truncate max-w-[100px]" title={item.name}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {data.length === 0 && (
        <div className="flex items-center justify-center h-[300px] text-txt-muted">
          No data available for chart
        </div>
      )}
    </div>
  );
};

export default D3PieChart;
