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

  // Cores baseadas no status — tema claro
  let ringColor = "text-[#3f5f31]";
  let filterColor = "rgba(63, 95, 49, 0.25)";
  if (status === 'PROXIMA') {
    ringColor = "text-[#c9854a]";
    filterColor = "rgba(201, 133, 74, 0.25)";
  } else if (status === 'ATRASADA') {
    ringColor = "text-[#b85745]";
    filterColor = "rgba(184, 87, 69, 0.25)";
  } else if (status === 'FINALIZADA') {
    ringColor = "text-emerald-600";
    filterColor = "rgba(5, 150, 105, 0.25)";
  } else if (status === 'CANCELADA') {
    ringColor = "text-[#6f756a]";
    filterColor = "rgba(111, 117, 106, 0.2)";
  }

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background Circle */}
        <circle
          className="text-[#f1eadf]"
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
            <span className="text-3xl font-extrabold text-[#b85745]">D+{normDay - normTotal}</span>
            <span className="text-[10px] font-bold text-[#6f756a] tracking-widest uppercase">Atraso</span>
          </>
        ) : (
          <>
            <span className="text-4xl font-extrabold text-[#263225]">Dia {normDay}</span>
            <span className="text-xs font-semibold text-[#6f756a]">de {normTotal} Dias</span>
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
            className="w-full bg-gradient-to-t from-[#3f5f31]/15 to-[#3f5f31]/45 rounded-t shadow-sm hover:to-[#3f5f31]/60 hover:from-[#3f5f31]/25 transition-all duration-300 cursor-pointer"
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

  let color = "text-[#3f5f31]";
  if (status === 'PROXIMA') color = "text-[#c9854a]";
  if (status === 'ATRASADA') color = "text-[#b85745]";
  if (status === 'FINALIZADA') color = "text-emerald-600";
  if (status === 'CANCELADA') color = "text-[#6f756a]";

  return (
    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <circle
          className="text-slate-200"
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
          <Check className="w-5 h-5 text-emerald-600" />
        ) : (
          <>
            <span className={`text-[9px] font-extrabold ${color}`}>
              {status === 'ATRASADA' ? 'D+' : `D${day}`}
            </span>
            <span className="text-[7px] text-[#6f756a] font-medium leading-none">
              {status === 'ATRASADA' ? 'Atr' : `f.${total}`}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
