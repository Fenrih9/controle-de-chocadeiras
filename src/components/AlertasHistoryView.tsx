/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Clock,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
  Filter,
} from 'lucide-react';
import { repo } from '../repository';
import { Notificacao, SeveridadeNotificacao } from '../types';
import { severityConfig, timeAgo } from './notificacoes-utils';

interface AlertasHistoryViewProps {
  onNavigate: (screenName: string, params?: any) => void;
}

function formatDateFull(isoTimestamp: string): string {
  if (!isoTimestamp) return '';
  const date = new Date(isoTimestamp);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const FILTER_OPTIONS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'NAO_LIDOS', label: 'Não lidos' },
  { value: 'LIDOS', label: 'Lidos' },
] as const;

type StatusFilter = (typeof FILTER_OPTIONS)[number]['value'];

type SeverityFilter = 'TODOS' | SeveridadeNotificacao;

const AlertasHistoryView: React.FC<AlertasHistoryViewProps> = ({ onNavigate }) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('TODOS');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<'TODOS' | 'HOJE' | '7DIAS' | '30DIAS'>('TODOS');

  const loadNotificacoes = useCallback(() => {
    setNotificacoes([...repo.getNotificacoes()]);
  }, []);

  useEffect(() => {
    loadNotificacoes();
    const unsubscribe = repo.onNotificacoesChange(loadNotificacoes);
    return unsubscribe;
  }, [loadNotificacoes]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = notificacoes.length;
    const naoLidos = notificacoes.filter(n => !n.lido).length;
    const critico = notificacoes.filter(n => n.severidade === 'CRITICO').length;
    const atencao = notificacoes.filter(n => n.severidade === 'ATENCAO').length;
    const informativo = notificacoes.filter(n => n.severidade === 'INFORMATIVO').length;
    const criticoNaoLido = notificacoes.filter(n => n.severidade === 'CRITICO' && !n.lido).length;
    const atencaoNaoLido = notificacoes.filter(n => n.severidade === 'ATENCAO' && !n.lido).length;
    return { total, naoLidos, critico, atencao, informativo, criticoNaoLido, atencaoNaoLido };
  }, [notificacoes]);

  // Filtrar e ordenar
  const notificacoesFiltradas = useMemo(() => {
    let filtered = [...notificacoes];

    // Filtro de status (lido/não lido)
    if (statusFilter === 'NAO_LIDOS') {
      filtered = filtered.filter(n => !n.lido);
    } else if (statusFilter === 'LIDOS') {
      filtered = filtered.filter(n => n.lido);
    }

    // Filtro de severidade
    if (severityFilter !== 'TODOS') {
      filtered = filtered.filter(n => n.severidade === severityFilter);
    }

    // Filtro de data
    if (dateRange !== 'TODOS') {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === 'HOJE') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateRange === '7DIAS') {
        cutoff.setDate(cutoff.getDate() - 7);
      } else if (dateRange === '30DIAS') {
        cutoff.setDate(cutoff.getDate() - 30);
      }
      filtered = filtered.filter(n => new Date(n.timestamp_completo) >= cutoff);
    }

    // Busca textual
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.titulo.toLowerCase().includes(term) ||
          n.descricao.toLowerCase().includes(term) ||
          (n.entidade_relacionada || '').toLowerCase().includes(term)
      );
    }

    // Ordenar: não lidos primeiro, depois por timestamp decrescente
    filtered.sort((a, b) => {
      if (a.lido !== b.lido) return a.lido ? 1 : -1;
      return new Date(b.timestamp_completo).getTime() - new Date(a.timestamp_completo).getTime();
    });

    return filtered;
  }, [notificacoes, statusFilter, severityFilter, searchText, dateRange]);

  // Agrupar por severidade (apenas para visualização, não re-ordena)
  const grupos = useMemo(() => {
    const g = {
      CRITICO: notificacoesFiltradas.filter(n => n.severidade === 'CRITICO'),
      ATENCAO: notificacoesFiltradas.filter(n => n.severidade === 'ATENCAO'),
      INFORMATIVO: notificacoesFiltradas.filter(n => n.severidade === 'INFORMATIVO'),
    };
    return g;
  }, [notificacoesFiltradas]);

  const handleMarcarTodasLidas = async () => {
    await repo.marcarTodasNotificacoesLidas();
  };

  const handleMarcarLida = async (notif: Notificacao) => {
    if (!notif.lido) {
      await repo.marcarNotificacaoLida(notif.id, true);
    }
    if (notif.link_destino) {
      const params: any = {};
      if (notif.chocada_id) params.id = notif.chocada_id;
      onNavigate(notif.link_destino, params);
    }
  };

  const hasActiveFilters = statusFilter !== 'TODOS' || severityFilter !== 'TODOS' || dateRange !== 'TODOS' || searchText.trim() !== '';

  const clearFilters = () => {
    setStatusFilter('TODOS');
    setSeverityFilter('TODOS');
    setDateRange('TODOS');
    setSearchText('');
  };

  const totalAcaoNotRead = stats.criticoNaoLido + stats.atencaoNaoLido;

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[var(--color-brand)]" />
          <h1 className="font-headline font-bold text-[var(--color-ink)] text-sm leading-tight">
            Histórico de Notificações
          </h1>
          {totalAcaoNotRead > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-[9px] font-extrabold uppercase tracking-wider border border-[var(--color-danger)]/20">
              {totalAcaoNotRead} pendente{totalAcaoNotRead !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {stats.naoLidos > 0 && (
            <button
              onClick={handleMarcarTodasLidas}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-brand-soft)] hover:bg-[var(--color-brand-soft-hover)] text-[var(--color-brand)] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-[var(--color-brand)]/10"
              title="Marcar todas como lidas"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Marcar todas</span>
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              showFilters || hasActiveFilters
                ? 'bg-[var(--color-brand-soft)] border-[var(--color-brand)]/30 text-[var(--color-brand)]'
                : 'bg-[var(--color-surface-hover)] border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)]/30'
            }`}
            title="Filtrar notificações"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-5 lg:px-8 pt-4 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-6xl mx-auto w-full">
        <div className="card-base p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-danger-soft)] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-[var(--color-danger)]" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-[var(--color-ink)] leading-none">{stats.critico}</span>
            <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mt-0.5">
              {stats.criticoNaoLido > 0 ? `${stats.criticoNaoLido} não lido${stats.criticoNaoLido !== 1 ? 's' : ''}` : 'Críticos'}
            </span>
          </div>
        </div>
        <div className="card-base p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-warning-soft)] flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-[var(--color-warning)]" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-[var(--color-ink)] leading-none">{stats.atencao}</span>
            <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mt-0.5">
              {stats.atencaoNaoLido > 0 ? `${stats.atencaoNaoLido} não lido${stats.atencaoNaoLido !== 1 ? 's' : ''}` : 'Atenção'}
            </span>
          </div>
        </div>
        <div className="card-base p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-info-soft)] flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-[var(--color-info)]" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-[var(--color-ink)] leading-none">{stats.informativo}</span>
            <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mt-0.5">Informativos</span>
          </div>
        </div>
        <div className="card-base p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-soft)] flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-[var(--color-brand)]" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-[var(--color-ink)] leading-none">{stats.total}</span>
            <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mt-0.5">Total</span>
          </div>
        </div>
      </div>

      {/* Filtros expansíveis */}
      {showFilters && (
        <div className="px-5 lg:px-8 py-3 border-b border-[var(--color-line)] bg-[var(--color-surface)]/50 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted-light)] pointer-events-none" />
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Buscar notificações..."
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-2 pl-9 pr-8 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-light)] hover:text-[var(--color-ink)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status */}
            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-2 px-3 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all cursor-pointer appearance-none"
              >
                {FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Severidade */}
            <div>
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value as SeverityFilter)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-2 px-3 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all cursor-pointer appearance-none"
              >
                <option value="TODOS">Todas as severidades</option>
                <option value="CRITICO">🔴 Crítico</option>
                <option value="ATENCAO">🟠 Atenção</option>
                <option value="INFORMATIVO">🔵 Informativo</option>
              </select>
            </div>

            {/* Período */}
            <div>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value as typeof dateRange)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-2 px-3 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all cursor-pointer appearance-none"
              >
                <option value="TODOS">Todo período</option>
                <option value="HOJE">Hoje</option>
                <option value="7DIAS">Últimos 7 dias</option>
                <option value="30DIAS">Últimos 30 dias</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-line)]">
              <span className="text-[10px] font-medium text-[var(--color-muted)]">
                <Filter className="w-3 h-3 inline mr-1" />
                {notificacoesFiltradas.length} resultado{notificacoesFiltradas.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--color-surface-hover)] hover:bg-[var(--color-danger-soft)] text-[var(--color-muted)] hover:text-[var(--color-danger)] text-[10px] font-semibold transition-all cursor-pointer"
              >
                <X className="w-3 h-3" />
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista principal */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-4 scrollbar-thin pb-20 max-w-6xl mx-auto w-full">
        {/* Agrupamento por severidade com cabeçalhos */}
        {(['CRITICO', 'ATENCAO', 'INFORMATIVO'] as SeveridadeNotificacao[]).map(severidade => {
          const items = grupos[severidade];
          if (items.length === 0) return null;
          const config = severityConfig[severidade];

          return (
            <div key={severidade} className="mb-6 last:mb-0">
              {/* Cabeçalho do grupo */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <span
                  className="text-[10px] font-extrabold uppercase tracking-widest"
                  style={{ color: config.color }}
                >
                  {config.emoji} {config.label}
                </span>
                <span className="text-[10px] font-medium text-[var(--color-muted-light)]">
                  ({items.length})
                </span>
              </div>

              <div className="space-y-2">
                {items.map(notif => {
                  const SeverityIcon = config.icon;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleMarcarLida(notif)}
                      className={`
                        w-full text-left card-base p-4 flex items-start gap-3.5 cursor-pointer
                        transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]
                        active:scale-[0.99]
                        ${!notif.lido ? 'ring-1 ring-[var(--color-brand)]/10' : ''}
                      `}
                    >
                      {/* Indicador visual de severidade + não lido */}
                      <div className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center border"
                          style={{
                            backgroundColor: config.bgSoft,
                            borderColor: `${config.color}20`,
                          }}
                        >
                          <SeverityIcon className="w-4.5 h-4.5" style={{ color: config.color }} />
                        </div>
                        {!notif.lido && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h4
                            className={`text-sm leading-tight ${
                              !notif.lido ? 'font-extrabold' : 'font-semibold'
                            } text-[var(--color-ink)]`}
                          >
                            {notif.titulo}
                          </h4>
                          <ChevronRight className="w-4 h-4 text-[var(--color-muted-light)] shrink-0 mt-0.5" />
                        </div>
                        <p className="text-[12px] text-[var(--color-ink-secondary)] mt-1 leading-relaxed">
                          {notif.descricao}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-muted)]">
                            <Clock className="w-3 h-3" />
                            <span title={formatDateFull(notif.timestamp_completo)}>
                              {timeAgo(notif.timestamp_completo)}
                            </span>
                          </div>
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                            style={{
                              color: config.color,
                              backgroundColor: config.bgSoft,
                              borderColor: `${config.color}20`,
                            }}
                          >
                            {config.label}
                          </span>
                          {notif.entidade_relacionada && (
                            <span className="text-[10px] font-medium text-[var(--color-muted-light)] truncate max-w-[200px]">
                              {notif.entidade_relacionada}
                            </span>
                          )}
                          {notif.lido && (
                            <span className="text-[9px] font-medium text-[var(--color-muted-light)] flex items-center gap-1">
                              <CheckCheck className="w-2.5 h-2.5" />
                              Lida
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Estado vazio */}
        {notificacoesFiltradas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <Bell className="w-14 h-14 text-[var(--color-muted-light)]/30 mb-4" />
            <p className="text-base font-bold text-[var(--color-muted)]">
              {hasActiveFilters
                ? 'Nenhuma notificação encontrada'
                : 'Nenhuma notificação registrada'}
            </p>
            <p className="text-xs text-[var(--color-muted-light)] mt-1.5 max-w-xs">
              {hasActiveFilters
                ? 'Tente ajustar os filtros ou ampliar o período de busca.'
                : 'As notificações aparecerão aqui conforme eventos forem registrados no sistema.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-[var(--color-brand-soft)] hover:bg-[var(--color-brand-soft-hover)] text-[var(--color-brand)] text-xs font-bold transition-all cursor-pointer border border-[var(--color-brand)]/10"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertasHistoryView;
