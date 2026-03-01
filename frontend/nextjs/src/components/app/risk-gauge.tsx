"use client";

import { useEffect, useRef } from "react";
import { getRiskColor } from "@/lib/api";

interface RiskGaugeProps {
  score: number;
  label?: string;
  size?: number;
}

export function RiskGauge({ score, label = "Risk Score", size = 200 }: RiskGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const color = getRiskColor(score);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 16;
    const lineWidth = 12;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -0.5 * Math.PI, 1.5 * Math.PI);
    ctx.strokeStyle = "rgba(30,41,59,0.4)";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Score arc
    const endAngle = -0.5 * Math.PI + (score / 100) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -0.5 * Math.PI, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Score text
    ctx.fillStyle = color;
    ctx.font = `bold ${size * 0.22}px 'Space Grotesk', system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(Math.round(score)), cx, cy - 6);

    // Label text
    ctx.fillStyle = "#94A3B8";
    ctx.font = `500 ${size * 0.065}px 'JetBrains Mono', monospace`;
    ctx.fillText(label.toUpperCase(), cx, cy + size * 0.14);
  }, [score, color, label, size]);

  return (
    <div className="flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="drop-shadow-lg"
      />
    </div>
  );
}
