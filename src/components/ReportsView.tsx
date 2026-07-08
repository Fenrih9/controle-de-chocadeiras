/** @license SPDX-License-Identifier: Apache-2.0 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Filter, X, Egg, Activity, CheckCircle,
  Award, BarChart2, FileText, AlertTriangle,
  HelpCircle, ArrowLeft,
} from 'lucide-react';
import { repo } from '../repository';
import { Chocadeira, Chocada } from '../types';
import { Button, Card } from './GlacierUI';
import { ReportKPICard, TrendData } from './ReportKPICard';
import { ReportChartBlock, ChartDataPoint } from './ReportChartBlock';

interface ReportsViewProps {
  onNavigate: (screen: string, params?: any) => void;
}

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getFilterLabel(periodo: string, ano: string, mes: number): string {
  if (periodo === 'mes') return `${MESES_NOMES[mes]}/${ano}`;
  if (periodo === 'ano') return `Ano ${ano}`;
  return 'Todo histórico';
}

function getPreviousFilter(periodo: string, ano: string, mes: number): { periodo: string; ano: string; mes: number } {
  if (periodo === 'mes') {
    if (mes === 0) return { periodo: 'mes', ano: String(Number(ano) - 1), mes: 11 };
    return { periodo: 'mes', ano, mes: mes - 1 };
  }
  if (periodo === 'ano') {
    return { periodo: 'ano', ano: String(Number(ano) - 1), mes: 0 };
  }
  return { periodo: 'tudo', ano, mes: 0 };
}

/** Filtra chocadas por período */
function filterChocadas(
  chocadas: Chocada[],
  periodo: string,
  ano: string,
  mes: number,
  chocadeiraId: string,
  tipoOvo: string,
): Chocada[] {
  return chocadas.filter(c => {
    if (chocadeiraId !== 'todas' && c.chocadeiraId !== chocadeiraId) return false;
    if (tipoOvo !== 'todos' && c.tipoOvo !== tipoOvo) return false;
    if (periodo === 'ano') {
      const a = c.dataInicio ? c.dataInicio.substring(0, 4) : '';
      if (a !== ano) return false;
    } else if (periodo === 'mes') {
      const a = c.dataInicio ? c.dataInicio.substring(0, 4) : '';
      const m = c.dataInicio ? parseInt(c.dataInicio.substring(5, 7), 10) - 1 : -1;
      if (a !== ano || m !== mes) return false;
    }
    return true;
  });
}

/** Calcula métricas agregadas para um conjunto de chocadas */
function computeMetrics(chocadas: Chocada[]) {
  let totalIncubados = 0;
  let totalIncubadosComNascimento = 0;
  let totalNascidos = 0;
  let totalInferteis = 0;
  let totalDescartados = 0;
  let totalPerdas = 0;
  let anyFertilityData = false;

  chocadas.forEach(c => {
    totalIncubados += c.quantidadeOvosInicial;

    const nascimentos = repo.getRegistrosNascimento(c.id);
    const nac = nascimentos.length > 0 ? nascimentos[0] : null;
    if (nac) {
      totalIncubadosComNascimento += c.quantidadeOvosInicial;
      totalNascidos += nac.pintinhosNascidos;
      totalPerdas += (nac.perdas || 0);
    }

    const ovoscos = repo.getOvoscopias(c.id);
    let inferteis = 0;
    let descartados = 0;
    ovoscos.forEach(o => {
      inferteis += o.ovosInferteis;
      descartados += o.ovosDescartados;
      if (o.ovosInferteis > 0 || o.ovosDescartados > 0) anyFertilityData = true;
    });
    totalInferteis += inferteis;
    totalDescartados += descartados;
  });

  const ovosFerteis = totalIncubados - totalInferteis - totalDescartados;
  const temNascimentos = totalNascidos > 0;

  return {
    totalIncubados,
    totalIncubadosComNascimento,
    totalNascidos,
    totalInferteis,
    totalDescartados,
    ovosFerteis: Math.max(0, ovosFerteis),
    totalPerdas,
    anyFertilityData,
    temNascimentos,
    taxaFertilidade: totalIncubados > 0 ? Math.round((ovosFerteis / totalIncubados) * 100) : 0,
    taxaEclosao: totalIncubadosComNascimento > 0 ? Math.round((totalNascidos / totalIncubadosComNascimento) * 100) : 0,
    eclodibilidade: ovosFerteis > 0 ? Math.round((totalNascidos / ovosFerteis) * 100) : 0,
    perdasIncubacao: Math.max(0, totalIncubadosComNascimento - totalNascidos),
  };
}

/** Agrupa dados para o gráfico temporal */
function buildChartData(
  chocadas: Chocada[],
  periodo: string,
  ano: string,
  mes: number,
): ChartDataPoint[] {
  if (periodo === 'mes') {
    // Agrupamento semanal
    const semanas = [
      { label: 'Semana 1', inicio: 1, fim: 7 },
      { label: 'Semana 2', inicio: 8, fim: 14 },
      { label: 'Semana 3', inicio: 15, fim: 21 },
      { label: 'Semana 4', inicio: 22, fim: 31 },
    ];
    return semanas.map(sem => {
      let incubados = 0, nascidos = 0;
      chocadas.forEach(c => {
        if (!c.dataInicio) return;
        const dia = parseInt(c.dataInicio.substring(8, 10), 10);
        if (dia >= sem.inicio && dia <= sem.fim) {
          incubados += c.quantidadeOvosInicial;
          const nac = repo.getRegistrosNascimento(c.id)[0];
          if (nac) nascidos += nac.pintinhosNascidos;
        }
      });
      return { label: sem.label, incubados, nascidos, perdidos: incubados - nascidos };
    });
  }

  // Agrupamento mensal
  return MESES_ABREV.map((nome, index) => {
    let incubados = 0, nascidos = 0;
    chocadas.forEach(c => {
      if (!c.dataInicio) return;
      const a = c.dataInicio.substring(0, 4);
      const m = parseInt(c.dataInicio.substring(5, 7), 10) - 1;
      const bateAno = periodo === 'tudo' || a === ano;
      if (m === index && bateAno) {
        incubados += c.quantidadeOvosInicial;
        const nac = repo.getRegistrosNascimento(c.id)[0];
        if (nac) nascidos += nac.pintinhosNascidos;
      }
    });
    return { label: nome, incubados, nascidos, perdidos: incubados - nascidos };
  });
}

// ──────────────────────────────────────────────────────
// Table Row (Memoized)
// ──────────────────────────────────────────────────────

interface MemoizedTableRowProps {
  chocada: Chocada;
  chocadeiras: Chocadeira[];
  onNavigate: (screen: string, params?: any) => void;
}

const MemoizedTableRow = React.memo<MemoizedTableRowProps>(({ chocada: c, chocadeiras, onNavigate }) => {
  const chocadeira = chocadeiras.find(ch => ch.id === c.chocadeiraId);
  const nac = repo.getRegistrosNascimento(c.id)[0];
  const nascidos = nac ? nac.pintinhosNascidos : 0;
  const ef = c.quantidadeOvosInicial > 0 ? Math.round((nascidos / c.quantidadeOvosInicial) * 100) : 0;

  return (
    <tr className="hover:bg-[var(--color-surface-hover)]/50 transition-colors">
      <td className="px-4 py-3.5">
        <span className="text-[var(--color-ink)] font-bold block">{c.nome}</span>
        <span className="text-[10px] text-[var(--color-muted-light)]">{repo.formatReadableDate(c.dataInicio)}</span>
      </td>
      <td className="px-4 py-3.5">{chocadeira?.nome || '—'}</td>
      <td className="px-4 py-3.5">{c.tipoOvo}</td>
      <td className="px-4 py-3.5 text-center text-[var(--color-ink)] font-semibold">{c.quantidadeOvosInicial}</td>
      <td className="px-4 py-3.5 text-center text-[var(--color-success)] font-bold">
        {c.finalizada ? nascidos : <span className="text-[var(--color-muted-light)] text-[10px]">Incubando</span>}
      </td>
      <td className="px-4 py-3.5 text-center font-extrabold text-[var(--color-ink)]">
        {c.finalizada ? `${ef}%` : <span className="text-[var(--color-muted-light)] text-[10px]">—</span>}
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider border ${
          c.status === 'FINALIZADA' ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand)] border-[var(--color-brand)]/20' :
          c.status === 'ATRASADA' ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/20' :
          c.status === 'PROXIMA' ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/20' :
          c.status === 'EM_ANDAMENTO' ? 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/20' :
          'bg-[var(--color-muted)]/10 text-[var(--color-muted)] border-[var(--color-muted)]/20'
        }`}>
          {c.status === 'FINALIZADA' ? 'Finalizado' :
           c.status === 'ATRASADA' ? 'Atrasado' :
           c.status === 'PROXIMA' ? 'Próximo' :
           c.status === 'EM_ANDAMENTO' ? 'Andamento' : 'Cancelado'}
        </span>
      </td>
      <td className="px-4 py-3.5 text-center">
        <button
          onClick={() => onNavigate('relatorio_chocada', { id: c.id })}
          className="p-1 px-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)]/30 cursor-pointer text-[9px] font-bold flex items-center gap-1 mx-auto transition-all"
        >
          <FileText className="w-3 h-3" /> Detalhes
        </button>
      </td>
    </tr>
  );
});

// ──────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigate }) => {
  const [chocadas, setChocadas] = useState<Chocada[]>([]);
  const [chocadeiras, setChocadeiras] = useState<Chocadeira[]>([]);
  // Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState<'tudo' | 'ano' | 'mes'>('tudo');
  const [anoSelecionado, setAnoSelecionado] = useState('2026');
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [chocadeiraSelecionada, setChocadeiraSelecionada] = useState('todas');
  const [tipoOvoSelecionado, setTipoOvoSelecionado] = useState('todos');

  useEffect(() => {
    setChocadas(repo.getChocadas());
    setChocadeiras(repo.getChocadeiras());
  }, []);

  // Anos disponíveis
  const anosDisponiveis = useMemo(() =>
    Array.from(new Set(chocadas.map(c => c.dataInicio?.substring(0, 4)).filter(Boolean)))
      .sort()
      .reverse() as string[],
    [chocadas]
  );
  const anosExibicao = anosDisponiveis.length > 0 ? anosDisponiveis : ['2026'];
  const tiposOvosDisponiveis = ['Galinha', 'Codorna', 'Pato', 'Peru'];

  // Chocadas filtradas (período atual)
  const chocadasFiltradas = useMemo(
    () => filterChocadas(chocadas, filtroPeriodo, anoSelecionado, mesSelecionado, chocadeiraSelecionada, tipoOvoSelecionado),
    [chocadas, filtroPeriodo, anoSelecionado, mesSelecionado, chocadeiraSelecionada, tipoOvoSelecionado]
  );

  // Período anterior para comparação
  const chocadasAnteriores = useMemo(
    () => {
      const ant = getPreviousFilter(filtroPeriodo, anoSelecionado, mesSelecionado);
      return filterChocadas(chocadas, ant.periodo, ant.ano, ant.mes, chocadeiraSelecionada, tipoOvoSelecionado);
    },
    [chocadas, filtroPeriodo, anoSelecionado, mesSelecionado, chocadeiraSelecionada, tipoOvoSelecionado]
  );

  // Métricas
  const metrics = useMemo(() => computeMetrics(chocadasFiltradas), [chocadasFiltradas]);
  const prevMetrics = useMemo(() => computeMetrics(chocadasAnteriores), [chocadasAnteriores]);

  // Tendências
  const buildTrend = (current: number, prev: number, label: string): TrendData | undefined => {
    if (chocadasAnteriores.length === 0 || chocadasFiltradas.length === 0) return undefined;
    if (current === prev) return { value: 0, direction: 'flat', label };
    if (current > prev) return { value: current - prev, direction: 'up', label };
    return { value: prev - current, direction: 'down', label };
  };

  // Filtros ativos
  const hasActiveFilters = filtroPeriodo !== 'tudo' || chocadeiraSelecionada !== 'todas' || tipoOvoSelecionado !== 'todos';
  const activeFilterLabels: string[] = [];
  if (filtroPeriodo !== 'tudo') activeFilterLabels.push(getFilterLabel(filtroPeriodo, anoSelecionado, mesSelecionado));
  if (chocadeiraSelecionada !== 'todas') activeFilterLabels.push(chocadeiras.find(c => c.id === chocadeiraSelecionada)?.nome || 'Chocadeira');
  if (tipoOvoSelecionado !== 'todos') activeFilterLabels.push(tipoOvoSelecionado);

  const clearFilters = () => {
    setFiltroPeriodo('tudo');
    setChocadeiraSelecionada('todas');
    setTipoOvoSelecionado('todos');
  };

  // Dados do gráfico
  const chartData = useMemo(
    () => buildChartData(chocadasFiltradas, filtroPeriodo, anoSelecionado, mesSelecionado),
    [chocadasFiltradas, filtroPeriodo, anoSelecionado, mesSelecionado]
  );
  const nonEmptyChartData = chartData.filter(d => d.incubados > 0 || d.nascidos > 0);
  const compactMode = nonEmptyChartData.length <= 3;

  // Species data
  const dadosEspecie = useMemo(() =>
    tiposOvosDisponiveis.map(esp => {
      const lotes = chocadasFiltradas.filter(c => c.tipoOvo === esp);
      let incubados = 0, nascidos = 0;
      lotes.forEach(c => {
        incubados += c.quantidadeOvosInicial;
        const nac = repo.getRegistrosNascimento(c.id)[0];
        if (nac) nascidos += nac.pintinhosNascidos;
      });
      return { especie: esp, incubados, nascidos, taxa: incubados > 0 ? Math.round((nascidos / incubados) * 100) : 0 };
    }),
    [chocadasFiltradas]
  );

  // Chocadeira efficiency data
  const dadosChocadeira = useMemo(() =>
    chocadeiras.map(ch => {
      const lotesCh = chocadasFiltradas.filter(c => c.chocadeiraId === ch.id);
      let ovosCh = 0, nascidosCh = 0;
      lotesCh.forEach(l => {
        ovosCh += l.quantidadeOvosInicial;
        const nac = repo.getRegistrosNascimento(l.id)[0];
        if (nac) nascidosCh += nac.pintinhosNascidos;
      });
      const ef = ovosCh > 0 ? Math.round((nascidosCh / ovosCh) * 100) : 0;
      return { ch, ovosCh, nascidosCh, ef, ciclos: lotesCh.length };
    })
      .sort((a, b) => b.ef - a.ef),
    [chocadeiras, chocadasFiltradas]
  );

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-1 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand)]/30 cursor-pointer select-none transition-all shadow-sm text-xs font-semibold flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
        <h1 className="font-headline font-bold text-[var(--color-ink)] text-sm tracking-tight">
          Relatório Geral Consolidado
        </h1>
        <div className="text-[9px] text-[var(--color-muted-light)] font-mono bg-[var(--color-surface)] px-2 py-1 rounded-lg border border-[var(--color-line)]">
          {new Date().toLocaleDateString('pt-BR')}
        </div>
      </header>

      {/* Main scroll */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-24 max-w-6xl mx-auto w-full">

        {/* ── Cabeçalho de contexto ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[var(--color-line)]">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--color-ink)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--color-brand)]" />
              Eficiência Geral de Eclosão
            </h2>
            <p className="text-[11px] text-[var(--color-ink-secondary)] mt-0.5">
              {repo.getPropriedade().nome || 'Propriedade'} — {chocadasFiltradas.length} {chocadasFiltradas.length === 1 ? 'lote analisado' : 'lotes analisados'}
              {hasActiveFilters && (
                <span className="text-[var(--color-brand)] font-semibold">
                  {' '}(filtrados)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── Filtros com feedback de estado ── */}
        <div className="card-base p-4 lg:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--color-brand)] uppercase tracking-widest flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filtros
            </span>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5">
                  {activeFilterLabels.map((l, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[var(--color-brand-soft)] text-[var(--color-brand)] rounded-full text-[8px] font-bold uppercase tracking-wider border border-[var(--color-brand)]/15">
                      {l}
                    </span>
                  ))}
                </div>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-[var(--color-danger)] bg-[var(--color-danger-soft)] hover:bg-[var(--color-danger-soft)] rounded-lg border border-[var(--color-danger)]/20 transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" /> Limpar filtros
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Período */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider">Período</label>
              <select
                value={filtroPeriodo}
                onChange={e => setFiltroPeriodo(e.target.value as any)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-2 px-3 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-soft)] cursor-pointer font-medium appearance-none"
              >
                <option value="tudo">Todos os Períodos</option>
                <option value="ano">Consolidado Anual</option>
                <option value="mes">Mensal Detalhado</option>
              </select>
            </div>

            {/* Ano/Mês condicional */}
            {filtroPeriodo !== 'tudo' && (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
                  {filtroPeriodo === 'ano' ? 'Ano' : 'Ano / Mês'}
                </label>
                <div className="flex gap-2">
                  <select
                    value={anoSelecionado}
                    onChange={e => setAnoSelecionado(e.target.value)}
                    className="flex-1 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-2 px-3 text-xs text-[var(--color-ink)] focus:outline-none cursor-pointer font-medium appearance-none"
                  >
                    {anosExibicao.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {filtroPeriodo === 'mes' && (
                    <select
                      value={mesSelecionado}
                      onChange={e => setMesSelecionado(Number(e.target.value))}
                      className="flex-[2] bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-2 px-3 text-xs text-[var(--color-ink)] focus:outline-none cursor-pointer font-medium appearance-none"
                    >
                      {MESES_NOMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Chocadeira */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider">Chocadeira</label>
              <select
                value={chocadeiraSelecionada}
                onChange={e => setChocadeiraSelecionada(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-2 px-3 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-soft)] cursor-pointer font-medium appearance-none"
              >
                <option value="todas">Todas as Chocadeiras</option>
                {chocadeiras.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.nome}</option>
                ))}
              </select>
            </div>

            {/* Espécie */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider">Espécie</label>
              <select
                value={tipoOvoSelecionado}
                onChange={e => setTipoOvoSelecionado(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-2 px-3 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-soft)] cursor-pointer font-medium appearance-none"
              >
                <option value="todos">Todas as Espécies</option>
                {tiposOvosDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Badge de filtro mobile */}
          {hasActiveFilters && (
            <div className="sm:hidden flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[8px] font-bold text-[var(--color-muted)] uppercase tracking-wider">Ativos:</span>
              {activeFilterLabels.map((l, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-[var(--color-brand-soft)] text-[var(--color-brand)] rounded text-[8px] font-bold">
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── KPIs Principais ── */}
        {chocadasFiltradas.length === 0 ? (
          /* Estado vazio */
          <div className="card-base p-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[var(--color-brand-soft)] flex items-center justify-center mx-auto">
              <HelpCircle className="w-8 h-8 text-[var(--color-brand)]/50" />
            </div>
            <h3 className="font-bold text-[var(--color-ink)] text-sm">Nenhum dado encontrado</h3>
            <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
              Nenhum ciclo de incubação encontrado para os filtros atuais. Tente ampliar o período ou limpar os filtros.
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="secondary" className="!w-auto mx-auto !px-6">
                <X className="w-4 h-4" /> Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Cards KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Ovos Incubados */}
              <ReportKPICard
                value={metrics.totalIncubados}
                label="Ovos Incubados"
                subtitle="Total no período"
                accent="brand"
                icon={<Egg className="w-10 h-10" />}
                trend={buildTrend(metrics.totalIncubados, prevMetrics.totalIncubados, 'vs. período anterior')}
              />

              {/* Taxa de Fertilidade */}
              {metrics.anyFertilityData ? (
                <ReportKPICard
                  value={`${metrics.taxaFertilidade}%`}
                  label="Taxa de Fertilidade"
                  subtitle={`${metrics.ovosFerteis} ovos férteis`}
                  accent="info"
                  icon={<Activity className="w-10 h-10" />}
                  trend={buildTrend(metrics.taxaFertilidade, prevMetrics.taxaFertilidade, 'pp vs. anterior')}
                />
              ) : (
                <ReportKPICard
                  value="—"
                  label="Taxa de Fertilidade"
                  noData
                  noDataMessage="Ative o registro de fertilidade"
                  accent="muted"
                  icon={<HelpCircle className="w-10 h-10" />}
                />
              )}

              {/* Taxa de Eclosão (sobre incubados) */}
              {metrics.temNascimentos ? (
                <ReportKPICard
                  value={`${metrics.taxaEclosao}%`}
                  label="Taxa de Eclosão"
                  subtitle={`${metrics.totalNascidos} pintinhos nascidos`}
                  accent="success"
                  icon={<CheckCircle className="w-10 h-10" />}
                  trend={buildTrend(metrics.taxaEclosao, prevMetrics.taxaEclosao, 'pp vs. anterior')}
                />
              ) : (
                <ReportKPICard
                  value="—"
                  label="Taxa de Eclosão"
                  noData
                  noDataMessage="Aguardando nascimentos"
                  accent="muted"
                  icon={<HelpCircle className="w-10 h-10" />}
                />
              )}

              {/* Eclodibilidade (sobre férteis) — só exibir se fertilidade for real */}
              {metrics.anyFertilityData && metrics.temNascimentos ? (
                <ReportKPICard
                  value={`${metrics.eclodibilidade}%`}
                  label="Eclodibilidade"
                  subtitle="Eficiência sobre férteis"
                  accent="warning"
                  icon={<Award className="w-10 h-10" />}
                  trend={buildTrend(metrics.eclodibilidade, prevMetrics.eclodibilidade, 'pp vs. anterior')}
                />
              ) : null}

              {/* Perdas na Incubação */}
              {metrics.temNascimentos ? (
                <ReportKPICard
                  value={metrics.perdasIncubacao}
                  label="Perdas na Incubação"
                  subtitle={`${metrics.taxaEclosao > 0 ? (100 - metrics.taxaEclosao) : 0}% de perda`}
                  accent="danger"
                  icon={<AlertTriangle className="w-10 h-10" />}
                  trend={buildTrend(metrics.perdasIncubacao, prevMetrics.perdasIncubacao, 'vs. anterior')}
                />
              ) : (
                <ReportKPICard
                  value="—"
                  label="Perdas na Incubação"
                  noData
                  noDataMessage="Aguardando finalização"
                  accent="muted"
                  icon={<HelpCircle className="w-10 h-10" />}
                />
              )}
            </div>

            {/* ── Gráfico de Evolução Temporal ── */}
            <Card className="p-4 lg:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold tracking-widest text-[var(--color-brand)] uppercase flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4" />
                  Evolução Temporal
                </h3>
                <div className="text-[9px] text-[var(--color-muted)] font-semibold">
                  {nonEmptyChartData.length} {nonEmptyChartData.length === 1 ? 'período com dado' : 'períodos com dados'}
                </div>
              </div>

              {nonEmptyChartData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-[var(--color-muted)] text-xs italic rounded-xl border border-dashed border-[var(--color-line)]">
                  Nenhum dado temporal disponível para o período.
                </div>
              ) : (
                <ReportChartBlock data={nonEmptyChartData} compactMode={compactMode} />
              )}
            </Card>

            {/* ── Rendimento por Espécie + Eficiência Chocadeiras ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Espécies */}
              <Card className="p-4 lg:p-5 space-y-3">
                <h3 className="text-[11px] font-bold tracking-widest text-[var(--color-brand)] uppercase flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Rendimento por Espécie
                </h3>
                <div className="space-y-2">
                  {[...dadosEspecie]
                    .sort((a, b) => b.incubados - a.incubados)
                    .map(e => {
                      const hasData = e.incubados > 0;
                      return (
                        <div
                          key={e.especie}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            hasData
                              ? 'bg-[var(--color-bg-warm)] border-[var(--color-line)]'
                              : 'bg-[var(--color-surface)] border-dashed border-[var(--color-line)] opacity-50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className={`font-bold text-sm block ${hasData ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}`}>
                              {e.especie}
                            </span>
                            <span className="text-[9px] text-[var(--color-muted-light)] font-bold uppercase">
                              {hasData
                                ? `${e.nascidos} nascidos de ${e.incubados} ovos`
                                : 'Sem incubação no período'}
                            </span>
                          </div>
                          {hasData ? (
                            <div className="text-right shrink-0 ml-3">
                              <span className={`font-extrabold text-sm ${
                                e.taxa >= 80 ? 'text-[var(--color-success)]' :
                                e.taxa >= 60 ? 'text-[var(--color-warning)]' :
                                'text-[var(--color-danger)]'
                              }`}>
                                {e.taxa}%
                              </span>
                              <div className="w-16 bg-[var(--color-surface-soft)] rounded-full h-1.5 mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    e.taxa >= 80 ? 'bg-[var(--color-success)]' :
                                    e.taxa >= 60 ? 'bg-[var(--color-warning)]' :
                                    'bg-[var(--color-danger)]'
                                  }`}
                                  style={{ width: `${Math.min(e.taxa, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[8px] font-mono text-[var(--color-muted-light)] uppercase font-bold shrink-0">Inativo</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </Card>

              {/* Chocadeiras */}
              <Card className="p-4 lg:p-5 space-y-3">
                <h3 className="text-[11px] font-bold tracking-widest text-[var(--color-brand)] uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  Eficiência por Chocadeira
                </h3>
                <div className="space-y-2">
                  {dadosChocadeira.map(({ ch, ovosCh, nascidosCh, ef, ciclos }) => {
                      const isAlert = ef < 20 && ovosCh > 0;
                      return (
                        <div
                          key={ch.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isAlert
                              ? 'bg-[var(--color-danger-soft)] border-[var(--color-danger)]/20'
                              : ovosCh > 0
                              ? 'bg-[var(--color-bg-warm)] border-[var(--color-line)]'
                              : 'bg-[var(--color-surface)] border-dashed border-[var(--color-line)] opacity-50'
                          }`}
                        >
                          <div className="flex justify-between items-start text-xs mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[var(--color-ink)] truncate">{ch.nome}</span>
                                {isAlert && (
                                  <span className="px-1 py-0.5 bg-[var(--color-danger-soft)] text-[var(--color-danger)] rounded text-[8px] font-bold uppercase tracking-wider">Alerta</span>
                                )}
                              </div>
                              <span className="text-[9px] text-[var(--color-muted)] font-semibold block leading-tight">
                                {ciclos} {ciclos === 1 ? 'ciclo' : 'ciclos'} • {ch.modelo || '—'}
                              </span>
                            </div>
                            {ovosCh > 0 ? (
                              <div className="text-right shrink-0 ml-3">
                                <span className={`font-extrabold text-sm ${
                                  ef >= 80 ? 'text-[var(--color-success)]' :
                                  ef >= 60 ? 'text-[var(--color-warning)]' :
                                  'text-[var(--color-danger)]'
                                }`}>
                                  {ef}%
                                </span>
                                <span className="text-[9px] text-[var(--color-muted)] block font-semibold">
                                  {nascidosCh}/{ovosCh}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-[var(--color-muted-light)] uppercase font-bold shrink-0">Sem dados</span>
                            )}
                          </div>

                          {ovosCh > 0 && (
                            <div className="w-full bg-[var(--color-surface-soft)] rounded-full h-2 overflow-hidden border border-[var(--color-line)]">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  ef >= 80 ? 'bg-gradient-to-r from-[var(--color-success)] to-[var(--color-success)]/60' :
                                  ef >= 60 ? 'bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-warning)]/60' :
                                  'bg-gradient-to-r from-[var(--color-danger)] to-[var(--color-danger)]/60'
                                }`}
                                style={{ width: `${Math.min(ef, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>

            {/* ── Listagem de Lotes ── */}
            <Card className="p-4 lg:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold tracking-widest text-[var(--color-brand)] uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Lotes no Filtro
                </h3>
                <span className="text-[10px] text-[var(--color-muted)] font-bold uppercase">
                  {chocadasFiltradas.length} {chocadasFiltradas.length === 1 ? 'lote' : 'lotes'}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--color-line)]">
                <table className="w-full text-xs text-left text-[var(--color-ink-secondary)]">
                  <thead className="text-[10px] text-[var(--color-muted)] bg-[var(--color-surface-hover)] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-4 py-3">Lote</th>
                      <th className="px-4 py-3">Chocadeira</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3 text-center">Ovos</th>
                      <th className="px-4 py-3 text-center">Nascidos</th>
                      <th className="px-4 py-3 text-center">Eclosão</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-line)] bg-[var(--color-surface)]/50 font-medium">
                    {chocadasFiltradas.map(c => (
                    <MemoizedTableRow
                      key={c.id}
                      chocada={c}
                      chocadeiras={chocadeiras}
                      onNavigate={onNavigate}
                    />
                  ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
