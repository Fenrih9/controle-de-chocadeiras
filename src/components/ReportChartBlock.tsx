/** @license SPDX-License-Identifier: Apache-2.0 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Table2 } from 'lucide-react';

export interface ChartDataPoint {
  label: string;
  incubados: number;
  nascidos: number;
  perdidos: number;
}

interface ReportChartBlockProps {
  data: ChartDataPoint[];
  /** Se true, mostra comparação lado a lado (tabela/cards) em vez de gráfico */
  compactMode: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="card-base p-3 shadow-[var(--shadow-elevated)] border !border-[var(--color-line-strong)] !bg-[var(--color-surface)]/95 backdrop-blur-sm">
      <p className="text-xs font-bold text-[var(--color-ink)] mb-1.5">{label}</p>
      <div className="space-y-0.5">
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-[10px]">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--color-muted)]">{entry.name}:</span>
            <span className="font-bold text-[var(--color-ink)]">{entry.value.toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Mostra uma tabela lado a lado quando há poucos pontos de dado */
const CompactComparisonTable: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {data.map((d) => {
        const total = d.incubados || 1;
        const taxaNasc = Math.round((d.nascidos / total) * 100);
        const taxaPerda = Math.round((d.perdidos / total) * 100);
        return (
          <div key={d.label} className="card-base p-4 space-y-2">
            <span className="text-[10px] font-bold text-[var(--color-brand)] uppercase tracking-wider block">{d.label}</span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Incubados</span>
                <span className="font-bold text-[var(--color-ink)]">{d.incubados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Nascidos</span>
                <span className="font-bold text-emerald-600">{d.nascidos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Perdas</span>
                <span className="font-bold text-rose-500">{d.perdidos}</span>
              </div>
              <div className="pt-1.5 border-t border-[var(--color-line)] flex justify-between text-[10px]">
                <span className="text-[var(--color-muted)]">Eclosão</span>
                <span className="font-extrabold text-[var(--color-brand)]">{taxaNasc}%</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--color-muted)]">Perdas</span>
                <span className="font-extrabold text-rose-500">{taxaPerda}%</span>
              </div>
            </div>
            {/* Mini barra de progresso visual */}
            <div className="w-full bg-[var(--color-surface-soft)] rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${taxaNasc}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const ReportChartBlock: React.FC<ReportChartBlockProps> = ({ data, compactMode }) => {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-muted)] text-xs italic rounded-xl border border-dashed border-[var(--color-line)]">
        Nenhum dado disponível para o período selecionado.
      </div>
    );
  }

  if (compactMode) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted)]">
          <Table2 className="w-3.5 h-3.5" />
          <span className="font-semibold uppercase tracking-wider">Comparação direta por período</span>
        </div>
        <CompactComparisonTable data={data} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--color-muted)', fontWeight: 600 }}
            axisLine={{ stroke: 'var(--color-line)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            iconType="rect"
            iconSize={8}
          />
          <Bar
            dataKey="incubados"
            name="Ovos Incubados"
            fill="var(--color-brand)"
            radius={[3, 3, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="nascidos"
            name="Pintinhos Nascidos"
            fill="#10b981"
            radius={[3, 3, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="perdidos"
            name="Perdas na Incubação"
            fill="var(--color-danger)"
            radius={[3, 3, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
