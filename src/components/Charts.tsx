/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check } from 'lucide-react';

// circular progress ring
interface CircularProgressProps {
  currentDay: number;
  totalDays: number;
  status?: string;
  size?: number;
}

export const CircularProgressRing: React.FC<CircularProgressProps> = ({
  currentDay,
  totalDays,
  status = 'EM_ANDAMENTO',
  size = 192,
}) => {
  const normDay = Math.max(0, currentDay);
  const normTotal = Math.max(1, totalDays);
  const percent = Math.min(100, Math.round((normDay / normTotal) * 100));
  
  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Cores baseadas no status — tema atual
  let ringColor = "text-[var(--color-brand)]";
  let filterColor = "rgba(var(--color-brand-rgb, 212, 163, 115), 0.25)";
  if (status === 'PROXIMA') {
    ringColor = "text-[var(--color-warning)]";
    filterColor = "rgba(var(--color-warning-rgb, 201, 160, 90), 0.25)";
  } else if (status === 'ATRASADA') {
    ringColor = "text-[var(--color-danger)]";
    filterColor = "rgba(var(--color-danger-rgb, 196, 106, 106), 0.25)";
  } else if (status === 'FINALIZADA') {
    ringColor = "text-[var(--color-success)]";
    filterColor = "rgba(var(--color-success-rgb, 127, 168, 106), 0.25)";
  } else if (status === 'CANCELADA') {
    ringColor = "text-[var(--color-muted)]";
    filterColor = "rgba(var(--color-muted-rgb, 143, 136, 117), 0.2)";
  }

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background Circle */}
        <circle
          className="text-[var(--color-surface-soft)]"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        {/* Active Progress Circle */}
        <circle
          className={`transition-all duration-500 ease-out ${ringColor}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${filterColor})`
          }}
        />
      </svg>
      {/* Centered label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {status === 'ATRASADA' ? (
          <>
            <span className="text-3xl font-extrabold text-[var(--color-danger)]">D+{normDay - normTotal}</span>
            <span className="text-[10px] font-bold text-[var(--color-muted)] tracking-widest uppercase">Atraso</span>
          </>
        ) : (
          <>
            <span className="text-4xl font-extrabold text-[var(--color-ink)]">Dia {normDay}</span>
            <span className="text-xs font-semibold text-[var(--color-muted)]">de {normTotal} Dias</span>
          </>
        )}
      </div>
    </div>
  );
};

// Historical temperature variation graph
export const TempBarChart: React.FC = () => {
  // Mocking 12 bars for 24h temperature fluctuation
  const heights = [75, 80, 68, 100, 75, 82, 50, 75, 85, 80, 66, 100];
  
  return (
    <div className="h-24 w-full flex items-end gap-1 px-1">
      {heights.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end h-full">
          <div 
            style={{ height: `${h}%` }}
            className="w-full bg-gradient-to-t from-[var(--color-brand)]/15 to-[var(--color-brand)]/45 rounded-t shadow-sm hover:to-[var(--color-brand)]/60 hover:from-[var(--color-brand)]/25 transition-all duration-300 cursor-pointer"
          />
        </div>
      ))}
    </div>
  );
};

// Mini progress bars for listings
export const MiniProgressRing: React.FC<{ day: number; total: number; status?: string }> = ({
  day,
  total,
  status = 'EM_ANDAMENTO',
}) => {
  const percent = Math.min(100, Math.round((day / total) * 100));
  
  const radius = 14;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  let color = "text-[var(--color-brand)]";
  if (status === 'PROXIMA') color = "text-[var(--color-warning)]";
  if (status === 'ATRASADA') color = "text-[var(--color-danger)]";
  if (status === 'FINALIZADA') color = "text-[var(--color-success)]";
  if (status === 'CANCELADA') color = "text-[var(--color-muted)]";

  return (
    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <circle
          className="text-[var(--color-surface-soft)]"
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <circle
          className={`${color} transition-all duration-500`}
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {status === 'FINALIZADA' ? (
          <Check className="w-5 h-5 text-[var(--color-success)]" />
        ) : (
          <>
            <span className={`text-[9px] font-extrabold ${color}`}>
              {status === 'ATRASADA' ? 'D+' : `D${day}`}
            </span>
            <span className="text-[7px] text-[var(--color-muted)] font-medium leading-none">
              {status === 'ATRASADA' ? 'Atr' : `f.${total}`}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
