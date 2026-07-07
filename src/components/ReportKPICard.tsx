/** @license SPDX-License-Identifier: Apache-2.0 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';

export interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'flat';
  label: string;
}

interface ReportKPICardProps {
  /** Valor principal exibido (ex: "84%", "1.250") */
  value: string | number;
  /** Rótulo curto da métrica */
  label: string;
  /** Subtítulo ou descrição adicional */
  subtitle?: string;
  /** Cor de destaque (classe Tailwind para texto) */
  accent?: 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'muted';
  /** Ícone opcional (lucide-react component) */
  icon?: React.ReactNode;
  /** Dado de tendência comparativa */
  trend?: TrendData;
  /** Se true, mostra estado vazio em vez de valor enganoso */
  noData?: boolean;
  /** Mensagem para estado vazio */
  noDataMessage?: string;
}

const accentClasses: Record<string, { text: string; bg: string; ring: string }> = {
  brand:   { text: 'text-[var(--color-brand)]',   bg: 'bg-[var(--color-brand-soft)]',   ring: 'ring-[var(--color-brand)]/20' },
  success: { text: 'text-emerald-600',            bg: 'bg-emerald-50/50',               ring: 'ring-emerald-500/20' },
  danger:  { text: 'text-[var(--color-danger)]',   bg: 'bg-[var(--color-danger-soft)]',   ring: 'ring-[var(--color-danger)]/20' },
  warning: { text: 'text-[var(--color-warning)]',   bg: 'bg-[var(--color-warning-soft)]',   ring: 'ring-[var(--color-warning)]/20' },
  info:    { text: 'text-[var(--color-info)]',     bg: 'bg-[var(--color-info-soft)]',     ring: 'ring-[var(--color-info)]/20' },
  muted:   { text: 'text-[var(--color-muted)]',    bg: 'bg-[var(--color-surface-hover)]',  ring: 'ring-[var(--color-line)]' },
};

export const ReportKPICard: React.FC<ReportKPICardProps> = ({
  value,
  label,
  subtitle,
  accent = 'brand',
  icon,
  trend,
  noData = false,
  noDataMessage = 'Sem dados no período',
}) => {
  const ac = accentClasses[accent];

  return (
    <div className="card-base p-4 lg:p-5 relative overflow-hidden group hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
      {/* Ícone decorativo de fundo */}
      {icon && (
        <div className="absolute top-3 right-3 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity">
          {icon}
        </div>
      )}

      <div className="relative z-10">
        {/* Rótulo */}
        <span className="text-[9px] lg:text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest block leading-tight">
          {label}
        </span>

        {/* Valor ou estado vazio */}
        {noData ? (
          <div className="mt-3 flex items-center gap-2 opacity-60">
            <HelpCircle className={`w-4 h-4 ${ac.text}`} />
            <span className="text-xs text-[var(--color-muted)] italic font-medium">{noDataMessage}</span>
          </div>
        ) : (
          <div className="mt-1.5">
            <span className={`text-2xl lg:text-3xl font-black tracking-tight ${ac.text}`}>
              {value}
            </span>
          </div>
        )}

        {/* Subtítulo */}
        {subtitle && !noData && (
          <p className="text-[10px] text-[var(--color-muted-light)] font-bold uppercase mt-0.5 leading-tight">
            {subtitle}
          </p>
        )}

        {/* Indicador de Tendência */}
        {trend && !noData && (
          <div className="mt-2 flex items-center gap-1">
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            ) : trend.direction === 'down' ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-[var(--color-muted)]" />
            )}
            <span
              className={`text-[10px] font-bold ${
                trend.direction === 'up'
                  ? 'text-emerald-600'
                  : trend.direction === 'down'
                  ? 'text-rose-500'
                  : 'text-[var(--color-muted)]'
              }`}
            >
              {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'} {trend.label}
            </span>
          </div>
        )}
      </div>

      {/* Barra decorativa inferior */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${ac.bg} opacity-60`} />
    </div>
  );
};
