"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Image from "next/image";

type ForecastEntry = {
  dt: number;
  temperature: number;
  description: string;
  icon: string;
};

type TemperatureChartProps = {
  forecast: ForecastEntry[];
};

const formatTemperature = (celsius: number) => ({
  c: Math.round(celsius),
  f: Math.round((celsius * 9) / 5 + 32),
});

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function TemperatureChart({ forecast }: TemperatureChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });

  // Handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const container = containerRef.current;
      if (container) {
        const width = container.clientWidth;
        setDimensions({
          width: Math.max(width, 300),
          height: 300,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!forecast || forecast.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 30, bottom: 60, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create gradient definition
    const defs = svg.append("defs");

    const gradient = defs
      .append("linearGradient")
      .attr("id", "temperature-gradient")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgb(59, 130, 246)")
      .attr("stop-opacity", 0.5);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgb(59, 130, 246)")
      .attr("stop-opacity", 0.05);

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(forecast, (d: ForecastEntry) => new Date(d.dt * 1000)) as [Date, Date])
      .range([0, innerWidth]);

    const temps = forecast.map((d: ForecastEntry) => d.temperature);
    const tempMin = Math.min(...temps) - 2;
    const tempMax = Math.max(...temps) + 2;

    const yScale = d3
      .scaleLinear()
      .domain([tempMin, tempMax])
      .range([innerHeight, 0])
      .nice();

    // Create area generator
    const area = d3
      .area<ForecastEntry>()
      .x((d) => xScale(new Date(d.dt * 1000)))
      .y0(innerHeight)
      .y1((d) => yScale(d.temperature))
      .curve(d3.curveMonotoneX);

    // Create line generator
    const line = d3
      .line<ForecastEntry>()
      .x((d) => xScale(new Date(d.dt * 1000)))
      .y((d) => yScale(d.temperature))
      .curve(d3.curveMonotoneX);

    // Draw gradient area
    g.append("path")
      .datum(forecast)
      .attr("fill", "url(#temperature-gradient)")
      .attr("d", area)
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .attr("opacity", 1);

    // Draw line
    const path = g
      .append("path")
      .datum(forecast)
      .attr("fill", "none")
      .attr("stroke", "rgb(59, 130, 246)")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Animate line drawing
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeQuadInOut)
      .attr("stroke-dashoffset", 0);

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      );

    // Add axes
    const xAxis = d3.axisBottom(xScale).tickFormat((d: d3.NumberValue) => {
      const date = d as Date;
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    });

    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .style("font-size", "12px")
      .style("color", "rgb(100, 116, 139)");

    g.append("g")
      .call(yAxis)
      .style("font-size", "12px")
      .style("color", "rgb(100, 116, 139)");

    // Add Y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -35)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "rgb(100, 116, 139)")
      .text("Temperature (°C)");

    // Tooltip reference
    const tooltip = d3.select(tooltipRef.current);

    // Add data points with interaction
    const points = g
      .selectAll("circle")
      .data(forecast)
      .join("circle")
      .attr("cx", (d: ForecastEntry) => xScale(new Date(d.dt * 1000)))
      .attr("cy", (d: ForecastEntry) => yScale(d.temperature))
      .attr("r", 0)
      .attr("fill", "rgb(59, 130, 246)")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // Animate points
    points
      .transition()
      .delay((_: unknown, i: number) => 1500 + i * 100)
      .duration(300)
      .attr("r", 6);

    // Add hover interactions
    points
      .on("mouseover", function (event: MouseEvent, d: ForecastEntry) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 10)
          .attr("stroke-width", 3);

        const temps = formatTemperature(d.temperature);

        tooltip
          .style("display", "block")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px")
          .html(`
            <div class="font-semibold text-slate-800 dark:text-slate-100">
              ${formatTime(d.dt)}
            </div>
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 my-1">
              ${temps.c}°C
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-300">
              ${temps.f}°F
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
              ${d.description}
            </div>
          `);
      })
      .on("mousemove", function (event: MouseEvent) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 6)
          .attr("stroke-width", 2);

        tooltip.style("display", "none");
      });
  }, [forecast, dimensions]);

  if (!forecast || forecast.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
        Temperature Trend
      </h3>
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible"
        />
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-50 hidden rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
          style={{
            position: "fixed",
            display: "none",
          }}
        />
        {/* Weather icons below the chart */}
        <div className="mt-4 flex justify-around">
          {forecast.map((entry) => (
            <div key={entry.dt} className="flex flex-col items-center">
              <Image
                src={`https://openweathermap.org/img/wn/${entry.icon}.png`}
                alt={entry.description}
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {formatTime(entry.dt)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
