/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Egg, Search, Plus, Calendar, Thermometer, Droplets, ChevronLeft, ChevronRight, Save, Sparkles, FileText, Check, Clipboard, Activity, Pencil, Trash2 } from 'lucide-react';
import { repo, DURACAO_INCUBACAO, addDays, getCurrentDateString } from '../repository';
import { Chocada } from '../types';
import { Button, Card, StatusChip, Input, Select, ConfirmDialog } from './GlacierUI';
import { CircularProgressRing, TempBarChart, MiniProgressRing } from './Charts';
import { useAuth } from '../contexts/AuthContext';

// --- CARD COMPONENTS (Memoized) ---
interface ChocadaCardEmAndamentoProps {
  chocada: Chocada;
  onNavigate: (screenName: string, params?: any) => void;
  currentUser: any;
  setDelTarget: (id: string | null) => void;
}

const ChocadaCardEmAndamento = React.memo<ChocadaCardEmAndamentoProps>(({
  chocada: ch,
  onNavigate,
  currentUser,
  setDelTarget,
}) => {
  const duration = DURACAO_INCUBACAO[ch.tipoOvo] || 21;
  const start = new Date(ch.dataInicio + 'T12:00:00');
  const now = new Date(getCurrentDateString() + 'T12:00:00');
  const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(100, Math.round((elapsed / duration) * 100));

  return (
    <div
      onClick={() => onNavigate('chocada_detalhes', { id: ch.id })}
      className="bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-brand)]/25 rounded-2xl p-4 flex flex-col min-[460px]:flex-row gap-4 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
    >
      <MiniProgressRing day={elapsed} total={duration} status={ch.status} />

      <div className="flex-1 space-y-2 text-[var(--color-ink)] min-w-0">
        <div className="flex flex-col min-[520px]:flex-row min-[520px]:justify-between min-[520px]:items-start gap-2">
          <div className="truncate">
            <h3 className="font-bold text-sm tracking-tight truncate">{ch.nome}</h3>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--color-muted)] font-semibold uppercase">
              <span className="flex items-center gap-0.5"><Egg className="w-3 h-3 text-[var(--color-brand)]" /> {ch.quantidadeOvosAtivos} ovos</span>
              <span>•</span>
              <span>Início: {repo.formatReadableDate(ch.dataInicio)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <StatusChip status={ch.status} />
            {currentUser?.role !== 'LEITOR' && (
              <>
            <button
              type="button"
              title="Editar chocada"
              onClick={(event) => {
                event.stopPropagation();
                onNavigate('chocada_editar', { id: ch.id });
              }}
              className="p-1.5 bg-[var(--color-surface-soft)]/50 hover:bg-[var(--color-brand-soft)] text-[var(--color-muted)] hover:text-[var(--color-brand)] rounded-lg transition-colors cursor-pointer"
            >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
            <button
              type="button"
              title="Excluir chocada"
              onClick={(event) => {
                event.stopPropagation();
                setDelTarget(ch.id);
              }}
              className="p-1.5 bg-[var(--color-surface-soft)]/50 hover:bg-[var(--color-danger-soft)] text-[var(--color-muted)] hover:text-[var(--color-danger)] rounded-lg transition-colors cursor-pointer"
            >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[9px] font-bold text-[var(--color-muted)] uppercase">
            <span>Previsão de Nascimento</span>
            <span className="text-[var(--color-ink)]">{repo.formatReadableDate(ch.dataPrevistaNascimento)}</span>
          </div>
          <div className="w-full bg-[var(--color-surface-soft)] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                ch.status === 'ATRASADA'
                  ? 'bg-[var(--color-danger)]'
                  : ch.status === 'PROXIMA'
                  ? 'bg-[var(--color-warning)]'
                  : 'bg-[var(--color-brand)]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

interface ChocadaCardFinalizadaProps {
  chocada: Chocada;
  onNavigate: (screenName: string, params?: any) => void;
}

const ChocadaCardFinalizada = React.memo<ChocadaCardFinalizadaProps>(({
  chocada: ch,
  onNavigate,
}) => {
  const registro = repo.getRegistrosNascimento(ch.id)[0];
  const nascidos = registro?.pintinhosNascidos ?? 0;
  const totalOvos = ch.quantidadeOvosInicial;
  const taxaEclosao = totalOvos > 0 ? Math.round((nascidos / totalOvos) * 100) : 0;

  return (
    <div
      onClick={() => onNavigate('chocada_detalhes', { id: ch.id })}
      className="bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-brand)]/20 rounded-xl px-4 py-3.5 flex items-center gap-4 transition-all duration-200 cursor-pointer group"
    >
      {/* Mini avatar com inicial */}
      <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-brand-soft)] transition-colors">
        <span className="text-sm font-black text-[var(--color-muted)] group-hover:text-[var(--color-brand)] transition-colors">
          {ch.nome.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Informações */}
      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <div className="w-full sm:w-auto min-w-0">
          <h3 className="font-bold text-sm text-[var(--color-ink)] truncate leading-tight">{ch.nome}</h3>
          <p className="text-[9px] text-[var(--color-muted)] font-semibold uppercase tracking-wider mt-0.5">
            {ch.tipoOvo}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[var(--color-muted)]">
          <span className="text-[9px] text-[var(--color-muted-light)] uppercase font-bold tracking-wider">Período</span>
          <span className="font-semibold">{repo.formatReadableDate(ch.dataInicio)}</span>
          <span className="text-[var(--color-muted-light)]">→</span>
          <span className="font-semibold">{repo.formatReadableDate(ch.dataPrevistaNascimento)}</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div>
            <p className="text-[9px] text-[var(--color-muted-light)] uppercase font-bold tracking-wider">Ovos</p>
            <p className="text-xs font-bold text-[var(--color-ink)]">{totalOvos}</p>
          </div>
          <div className="w-px h-6 bg-[var(--color-line)]" />
          <div>
            <p className="text-[9px] text-[var(--color-muted-light)] uppercase font-bold tracking-wider">Nascidos</p>
            <p className="text-xs font-bold text-[var(--color-success)]">{nascidos}</p>
          </div>
          <div className="w-px h-6 bg-[var(--color-line)]" />
          <div>
            <p className="text-[9px] text-[var(--color-muted-light)] uppercase font-bold tracking-wider">Taxa</p>
            <div className="flex items-center gap-1.5">
              <div className="w-10 sm:w-12 bg-[var(--color-surface-soft)] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    taxaEclosao >= 70
                      ? 'bg-[var(--color-success)]'
                      : taxaEclosao >= 40
                      ? 'bg-[var(--color-warning)]'
                      : 'bg-[var(--color-danger)]'
                  }`}
                  style={{ width: `${taxaEclosao}%` }}
                />
              </div>
              <span className={`text-[10px] font-black ${
                taxaEclosao >= 70
                  ? 'text-[var(--color-success)]'
                  : taxaEclosao >= 40
                  ? 'text-[var(--color-warning)]'
                  : 'text-[var(--color-danger)]'
              }`}>
                {taxaEclosao}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status + Ações */}
      <div className="flex items-center gap-2 shrink-0">
        <StatusChip status={ch.status} />
        <ChevronRight className="w-4 h-4 text-[var(--color-muted-light)] group-hover:text-[var(--color-brand)] transition-colors hidden sm:block" />
      </div>
    </div>
  );
});

// --- VIEW: LISTA DE CHOCADAS ---
interface ChocadasListaProps {
  onNavigate: (screenName: string, params?: any) => void;
}

export const ChocadasListaView: React.FC<ChocadasListaProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'TODOS' | 'ANDAMENTO' | 'ATRASADA' | 'FINALIZADA'>('TODOS');
  const [filteredChocadas, setFilteredChocadas] = useState<Chocada[]>([]);
  const [delTarget, setDelTarget] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const isEmAndamento = (c: Chocada) => c.status === 'EM_ANDAMENTO' || c.status === 'PROXIMA' || c.status === 'ATRASADA';
  const isFinalizada = (c: Chocada) => c.status === 'FINALIZADA' || c.status === 'CANCELADA';

  useEffect(() => {
    const list = repo.getChocadas();
    let term = searchTerm.toLowerCase().trim();
    let result = list;

    if (term) {
      result = result.filter(c => c.nome.toLowerCase().includes(term) || c.tipoOvo.toLowerCase().includes(term));
    }

    if (activeFilter === 'ANDAMENTO') {
      result = result.filter(c => c.status === 'EM_ANDAMENTO' || c.status === 'PROXIMA');
    } else if (activeFilter === 'ATRASADA') {
      result = result.filter(c => c.status === 'ATRASADA');
    } else if (activeFilter === 'FINALIZADA') {
      result = result.filter(c => c.status === 'FINALIZADA');
    } else if (activeFilter === 'CANCELADA') {
      result = result.filter(c => c.status === 'CANCELADA');
    }

    setFilteredChocadas(result);
  }, [searchTerm, activeFilter]);

  const handleConfirmDelete = async () => {
    if (!delTarget) return;
    const result = await repo.deleteChocada(delTarget);
    if (result.success) {
      setFilteredChocadas(prev => prev.filter(ch => ch.id !== delTarget));
      setDeleteError('');
    } else {
      setDeleteError(result.message);
    }
    setDelTarget(null);
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* Top Header */}
      <header className="flex justify-between items-center gap-3 w-full px-4 sm:px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Egg className="w-5 h-5 text-[var(--color-brand)] fill-[var(--color-brand)]/10" />
          <h1 className="font-headline font-bold text-[var(--color-ink)] text-base leading-tight">Lista de Chocadas</h1>
        </div>
        {currentUser?.role !== 'LEITOR' && (
          <button
            onClick={() => onNavigate('chocada_nova')}
            className="p-2 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-brand)]/35 rounded-xl text-[var(--color-brand)] shadow-sm cursor-pointer hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-grow overflow-y-auto px-4 sm:px-5 py-5 space-y-5 scrollbar-thin pb-32 lg:pb-20">
        {deleteError && (
          <div className="py-2.5 px-4 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-xs rounded-xl font-bold">
            {deleteError}
          </div>
        )}

        {/* Search bar matching photo pattern exactly */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 pl-11 pr-4 text-[var(--color-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium"
            placeholder="Buscar por lote ou espécie..."
          />
        </div>

        {/* Filter pills horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0 select-none">
          {([
            { code: 'TODOS', label: 'Todos' },
            { code: 'ANDAMENTO', label: 'Em Andamento' },
            { code: 'ATRASADA', label: 'Atrasados' },
            { code: 'FINALIZADA', label: 'Finalizados' },
            { code: 'CANCELADA', label: 'Inativados' },
          ] as const).map((pill) => {
            const isActive = activeFilter === pill.code;
            return (
              <button
                key={pill.code}
                onClick={() => setActiveFilter(pill.code)}
                className={`py-2 px-4 rounded-full text-xs font-semibold whitespace-nowrap border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[var(--color-brand-soft)] border-[var(--color-brand)]/30 text-[var(--color-brand)] shadow-sm'
                    : 'bg-[var(--color-surface-soft)] border-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {filteredChocadas.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Egg className="w-12 h-12 text-[var(--color-muted-light)] mx-auto opacity-40" />
            <p className="text-[var(--color-muted)] font-medium text-sm">Nenhum lote correspondente.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Seção: Em Andamento */}
            {filteredChocadas.filter(isEmAndamento).length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-brand)]">
                    Em Andamento
                  </h2>
                  <span className="text-[10px] font-bold text-[var(--color-muted-light)] ml-1">
                    ({filteredChocadas.filter(isEmAndamento).length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredChocadas.filter(isEmAndamento).map((ch) => (
                    <ChocadaCardEmAndamento
                      key={ch.id}
                      chocada={ch}
                      onNavigate={onNavigate}
                      currentUser={currentUser}
                      setDelTarget={setDelTarget}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Seção: Finalizadas / Inativadas */}
            {filteredChocadas.filter(isFinalizada).length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-muted)]" />
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                    Finalizadas
                  </h2>
                  <span className="text-[10px] font-bold text-[var(--color-muted-light)] ml-1">
                    ({filteredChocadas.filter(isFinalizada).length})
                  </span>
                </div>
                <div className="space-y-2">
                  {filteredChocadas.filter(isFinalizada).map((ch) => (
                    <ChocadaCardFinalizada
                      key={ch.id}
                      chocada={ch}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={delTarget !== null}
        title="Excluir Chocada"
        message="Deseja realmente remover esta chocada do cadastro? Os registros vinculados ficam preservados no banco, mas o lote sai das listas ativas."
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDelTarget(null)}
      />
    </div>
  );
};


// --- VIEW: DETALHES DA CHOCADA ---
interface ChocadaDetalhesProps {
  id: string;
  onNavigate: (screenName: string, params?: any) => void;
}

export const ChocadaDetalhesView: React.FC<ChocadaDetalhesProps> = ({ id, onNavigate }) => {
  const { currentUser } = useAuth();
  const [chocada, setChocada] = useState<Chocada | undefined>(undefined);
  const [logs, setLogs] = useState<any[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    const data = repo.getChocadaById(id);
    if (data) {
      setChocada(data);
      setLogs(repo.getRegistrosDiarios(id));
    }
  }, [id]);

  if (!chocada) {
    return (
      <div className="p-6 text-center text-[var(--color-muted)] bg-[var(--color-bg)] min-h-screen">
        Lote não encontrado.
        <Button onClick={() => onNavigate('chocadas_lista')} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const duration = DURACAO_INCUBACAO[chocada.tipoOvo] || 21;
  const start = new Date(chocada.dataInicio + 'T12:00:00');
  const now = new Date(getCurrentDateString() + 'T12:00:00');
  const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const handleDelete = async () => {
    const result = await repo.deleteChocada(chocada.id);
    if (result.success) {
      setDeleteOpen(false);
      onNavigate('chocadas_lista');
    } else {
      setDeleteOpen(false);
      setDeleteError(result.message);
    }
  };

  const handleCancel = async () => {
    const result = await repo.cancelarChocada(chocada.id);
    if (result.success) {
      setCancelOpen(false);
      onNavigate('chocadas_lista');
    } else {
      setCancelOpen(false);
      setDeleteError(result.message);
    }
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* Dynamic Navigation Topbar */}
      <header className="flex flex-col min-[520px]:flex-row min-[520px]:justify-between min-[520px]:items-center gap-3 w-full px-4 sm:px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3 w-full min-[520px]:w-auto min-w-0">
          <button onClick={() => onNavigate('chocadas_lista')} className="p-1 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand)]/30 cursor-pointer select-none transition-all flex items-center shadow-sm">
            <ChevronLeft className="w-4 h-4 inline mr-1" /> Voltar
          </button>
          <span className="font-headline font-bold text-[var(--color-ink)] text-xs truncate">
            Lote: {chocada.nome}
          </span>
        </div>
        {currentUser?.role !== 'LEITOR' && (
          <div className="flex items-center gap-2 flex-wrap w-full min-[520px]:w-auto">
            {!chocada.cancelada && (
              <button
                onClick={() => setCancelOpen(true)}
                className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--color-warning)] uppercase cursor-pointer hover:bg-[var(--color-warning-soft)] transition-all"
              >
                Inativar
              </button>
            )}
            <button
              onClick={() => onNavigate('chocada_editar', { id: chocada.id })}
              className="rounded-lg border border-[var(--color-brand)]/20 bg-[var(--color-brand-soft)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--color-brand)] uppercase cursor-pointer hover:bg-[var(--color-brand-soft)] transition-all"
            >
              Editar
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--color-danger)] uppercase cursor-pointer hover:bg-[var(--color-danger-soft)] transition-all"
            >
              Excluir
            </button>
          </div>
        )}
      </header>

      {/* Main Viewport */}
      <div className="flex-grow overflow-y-auto px-4 sm:px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-32 lg:pb-20">
        {deleteError && (
          <div className="py-2.5 px-4 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-xs rounded-xl font-bold">
            {deleteError}
          </div>
        )}
        
        {/* Layout em 2 colunas no desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda: Progresso + Info Geral */}
          <div className="space-y-6">
            {/* Frozen Arc Circle layout */}
            <section className="bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand)]/5 blur-[80px] rounded-full -mr-16 -mt-16"></div>
              <CircularProgressRing currentDay={elapsed} totalDays={duration} status={chocada.status} />
              
              <div className="mt-4 flex gap-2">
                <span className="px-3.5 py-1.5 bg-[var(--color-brand-soft)] text-[var(--color-brand)] text-[10px] font-bold rounded-full border border-[var(--color-brand)]/20 uppercase tracking-widest leading-none">
                  Ativo
                </span>
                {elapsed >= 18 && (
                  <span className="px-3.5 py-1.5 bg-[var(--color-warning-soft)] text-[var(--color-warning)] text-[10px] font-bold rounded-full border border-[var(--color-warning)]/20 uppercase tracking-widest leading-none italic animate-pulse">
                    Fase de Eclosão
                  </span>
                )}
              </div>
            </section>

            {/* Realtime Thermostats statistics */}
            <section className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3.5">
              <div className="bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm rounded-xl p-4 flex flex-col gap-1.5 relative overflow-hidden group">
                <Thermometer className="absolute right-3.5 top-3 text-[var(--color-brand)]/10 w-8 h-8" />
                <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider">Temperatura Ideal</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[var(--color-ink)]">{chocada.temperaturaIdeal}°C</span>
                  <span className="text-[9px] text-[var(--color-brand)] font-bold">OK</span>
                </div>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm rounded-xl p-4 flex flex-col gap-1.5 relative overflow-hidden group">
                <Droplets className="absolute right-3.5 top-3 text-[var(--color-warning)]/10 w-8 h-8" />
                <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider">Umidade Ideal</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[var(--color-ink)]">{chocada.umidadeIdeal}%</span>
                  <span className="text-[9px] text-[var(--color-warning)] font-bold">OK</span>
                </div>
              </div>
            </section>

            {/* Detailed Info properties container */}
            <section className="bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm rounded-2xl p-5 space-y-4">
              <h3 className="text-[11px] font-bold tracking-widest text-[var(--color-brand)] uppercase flex items-center gap-1.5">
                <Clipboard className="w-4 h-4" /> Informações Gerais
              </h3>
              
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-y-4 gap-x-3 text-xs font-semibold leading-normal">
                <div>
                  <p className="text-[var(--color-muted)] uppercase text-[9px] font-bold">Data de Início</p>
                  <p className="text-[var(--color-ink)] font-medium mt-0.5">{repo.formatReadableDate(chocada.dataInicio)}</p>
                </div>
                <div>
                  <p className="text-[var(--color-muted)] uppercase text-[9px] font-bold">Previsão Nascimento</p>
                  <p className="text-[var(--color-ink)] font-medium mt-0.5">{repo.formatReadableDate(chocada.dataPrevistaNascimento)}</p>
                </div>
                <div>
                  <p className="text-[var(--color-muted)] uppercase text-[9px] font-bold">Quantidade Inicial</p>
                  <p className="text-[var(--color-ink)] font-medium mt-0.5">{chocada.quantidadeOvosInicial} Ovos</p>
                </div>
                <div>
                  <p className="text-[var(--color-muted)] uppercase text-[9px] font-bold">Saldo Ativo Vigente</p>
                  <p className="text-[var(--color-brand)] font-black mt-0.5">{chocada.quantidadeOvosAtivos} Ovos</p>
                </div>
              </div>
            </section>
          </div>

          {/* Coluna Direita: Gráfico + Ações */}
          <div className="space-y-6">
            {/* Temperature chart variation banner */}
            <section className="bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm rounded-2xl p-5 space-y-3.5">
              <div className="flex justify-between items-center text-[var(--color-ink)]">
                <h3 className="text-[11px] font-bold tracking-widest text-[var(--color-brand)] uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Histórico Flutuação 24h
                </h3>
                <span className="text-[8px] uppercase font-mono tracking-widest text-[var(--color-muted)] font-bold">Var: ±0.2°C</span>
              </div>
              <TempBarChart />
            </section>

            {/* Actions Button Grid */}
            <section className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 pb-4">
              {currentUser?.role !== 'LEITOR' && !chocada.cancelada && (
                <>
                  <button
                    onClick={() => onNavigate('registro_diario_novo', { id: chocada.id })}
                    className="p-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-warm)]/50 border border-[var(--color-line)] shadow-sm rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer text-[var(--color-ink)]"
                  >
                    <Clipboard className="w-5 h-5 text-[var(--color-brand)]" />
                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Registrar Inspeção</span>
                  </button>
                  <button
                    onClick={() => onNavigate('ovoscopia_nova', { id: chocada.id })}
                    className="p-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-warm)]/50 border border-[var(--color-line)] shadow-sm rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer text-[var(--color-ink)]"
                  >
                    <Sparkles className="w-5 h-5 text-[var(--color-warning)]" />
                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Ovoscopia</span>
                  </button>
                  <button
                    onClick={() => onNavigate('nascimento_novo', { id: chocada.id })}
                    className="p-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-warm)]/50 border border-[var(--color-line)] shadow-sm rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer text-[var(--color-ink)]"
                  >
                    {chocada.finalizada ? (
                      <>
                        <Pencil className="w-5 h-5 text-[var(--color-warning)]" />
                        <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Editar Nascimento</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-[var(--color-success)]" />
                        <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Registrar Nascimento</span>
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => onNavigate('relatorio_chocada', { id: chocada.id })}
                className="p-4 bg-[var(--color-info-soft)] border border-[var(--color-info)]/20 hover:bg-[var(--color-info)]/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer text-[var(--color-info)]"
              >
                <FileText className="w-5 h-5" />
                <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Exibir Relatório</span>
              </button>
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Excluir Chocada"
        message={`Deseja realmente remover a chocada "${chocada.nome}" do cadastro?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        isOpen={cancelOpen}
        title="Inativar e Estornar Lote"
        message={`Deseja inativar o lote "${chocada.nome}"? Isso irá estornar todos os registros de nascimento e inspeções, removendo os pintinhos do estoque atual.`}
        confirmLabel="Inativar"
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
};


// --- VIEW: CADASTRO NOVA CHOCADA ---
interface ChocadaNovaProps {
  onNavigate: (screenName: string, params?: any) => void;
  idToEdit?: string; // If passed, makes it edit screen!
}

export const ChocadaNovaView: React.FC<ChocadaNovaProps> = ({ onNavigate, idToEdit }) => {
  const [nome, setNome] = useState('');
  const [tipoOvo, setTipoOvo] = useState('Galinha');
  const [quantidadeOvosInicial, setQuantidadeInicial] = useState<number>(24);
  const [dataInicio, setDataInicio] = useState(getCurrentDateString());
  const [chocadeiraId, setChocadeiraId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const existingChocada = idToEdit ? repo.getChocadaById(idToEdit) : undefined;
  const currentChocadeira = existingChocada ? repo.getChocadeiraById(existingChocada.chocadeiraId) : undefined;
  const availableChocadeiras = repo.getChocadeirasDisponiveis(idToEdit);
  const selectableChocadeiras = currentChocadeira && !availableChocadeiras.some(ch => ch.id === currentChocadeira.id)
    ? [currentChocadeira, ...availableChocadeiras]
    : availableChocadeiras;
  const chocadeirasList = selectableChocadeiras.map(ch => ({
    value: ch.id,
    label: `${ch.nome} (Cap. ${ch.capacidadeMaximaOvos})`
  }));

  // Automatic calculation duration
  const estimatedDuration = DURACAO_INCUBACAO[tipoOvo] || 21;
  const birthPrediction = addDays(dataInicio, estimatedDuration);

  useEffect(() => {
    // Set default incubator if available
    const activeChocadeiras = repo.getChocadeirasDisponiveis(idToEdit);
    if (activeChocadeiras.length > 0) {
      setChocadeiraId(activeChocadeiras[0].id);
    }

    if (idToEdit) {
      const existing = repo.getChocadaById(idToEdit);
      if (existing) {
        setNome(existing.nome);
        setTipoOvo(existing.tipoOvo);
        setQuantidadeInicial(existing.quantidadeOvosInicial);
        setDataInicio(existing.dataInicio);
        setChocadeiraId(existing.chocadeiraId);
        setObservacoes(existing.observacoes);
      }
    }
  }, [idToEdit]);

  const handleSave = async () => {
    setErrorMsg('');
    const existing = idToEdit ? repo.getChocadaById(idToEdit) : undefined;
    if (idToEdit && !existing) {
      setErrorMsg('Chocada nÃ£o encontrada para ediÃ§Ã£o.');
      return;
    }
    const formPayload: Chocada = {
      id: existing?.id || '',
      nome,
      tipoOvo,
      quantidadeOvosInicial,
      quantidadeOvosAtivos: existing?.quantidadeOvosAtivos ?? quantidadeOvosInicial,
      dataInicio,
      dataPrevistaNascimento: birthPrediction,
      chocadeiraId,
      temperaturaIdeal: existing?.temperaturaIdeal ?? 37.5,
      umidadeIdeal: existing?.umidadeIdeal ?? (tipoOvo === 'Pato' ? 60 : 55),
      status: existing?.status ?? 'EM_ANDAMENTO',
      observacoes,
      finalizada: existing?.finalizada ?? false,
      cancelada: existing?.cancelada ?? false,
      criadoEm: existing?.criadoEm || '',
      atualizadoEm: existing?.atualizadoEm || '',
      excluido: existing?.excluido ?? false
    };

    const result = await repo.saveChocada(formPayload);
    if (result.success) {
      onNavigate('chocadas_lista');
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* Header */}
      <header className="flex justify-between items-center gap-3 w-full px-4 sm:px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => onNavigate('chocadas_lista')} className="p-1 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand)]/30 cursor-pointer select-none transition-all shadow-sm">
            Cancelar
          </button>
          <span className="font-headline font-bold text-[var(--color-ink)] text-sm truncate">
            {idToEdit ? 'Editar Ciclo' : 'Configurar Ciclo'}
          </span>
        </div>
      </header>

      {/* Form content scrolling wrapper */}
      <div className="flex-grow overflow-y-auto px-4 sm:px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-32 lg:pb-20 max-w-4xl mx-auto w-full">
        
        {idToEdit && (
          <div className="py-2.5 px-4 bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/20 text-[var(--color-warning)] text-xs rounded-xl font-semibold flex items-center gap-2">
            <Clipboard className="w-4 h-4 shrink-0" />
            Você está editando informações do lote cadastrado.
          </div>
        )}

        {errorMsg && (
          <div className="py-2.5 px-4 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-xs rounded-xl font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <Card className="space-y-5">
          <Input
            id="nome-chocada"
            label="Nome da Chocada"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Lote A - Primavera"
          />

          <div className="grid grid-cols-1 min-[520px]:grid-cols-2 gap-4">
            <Select
              id="tipo-ovo"
              label="Espécie / Tipo"
              value={tipoOvo}
              onChange={(e) => setTipoOvo(e.target.value)}
              options={[
                { value: 'Galinha', label: 'Galinha (21 dias)' },
                { value: 'Codorna', label: 'Codorna (17 dias)' },
                { value: 'Pato', label: 'Pato (28 dias)' },
                { value: 'Peru', label: 'Peru (28 dias)' }
              ]}
            />

            <Input
              id="quantidade"
              label="Quantidade de Ovos"
              value={quantidadeOvosInicial}
              type="number"
              onChange={(e) => setQuantidadeInicial(Number(e.target.value))}
              placeholder="Ex: 24"
            />
          </div>

          <div className="grid grid-cols-1 min-[520px]:grid-cols-2 gap-4">
            <Input
              id="data-inicio"
              label="Data de Início"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />

            {chocadeirasList.length > 0 ? (
              <Select
                id="select-chocadeira"
                label="Chocadeira Utilizada"
                value={chocadeiraId}
                onChange={(e) => setChocadeiraId(e.target.value)}
                options={chocadeirasList}
              />
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--color-muted)] block uppercase tracking-wider">Chocadeira</label>
                <div className="py-3 px-4 bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-danger)]/20 text-xs rounded-xl font-medium">
                  Sem chocadeiras disponíveis!
                </div>
              </div>
            )}
          </div>

          {/* Predict card auto calculating dates dynamically matching photos */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-4 border-dashed relative overflow-hidden flex flex-col min-[460px]:flex-row min-[460px]:items-center min-[460px]:justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-brand)]" />
              <span className="text-[var(--color-muted)] font-medium font-sans">Previsão Calculada de Nascimento</span>
            </div>
            <span className="font-extrabold text-[var(--color-brand)] tracking-tight">
              {repo.formatReadableDate(birthPrediction)}
            </span>
          </div>

          <div className="space-y-1 w-full">
            <label className="text-xs font-semibold text-[var(--color-muted)] px-1 block uppercase tracking-wider">
              Observações Adicionais
            </label>
            <textarea
              className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-ink)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium resize-none text-xs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas sobre genética, linhagem das matrizes ou condições climáticas específicas..."
              rows={3}
            />
          </div>

          <Button onClick={handleSave} className="font-bold">
            <Save className="w-4 h-4" /> Finalizar e Registrar
          </Button>
        </Card>
      </div>
    </div>
  );
};
