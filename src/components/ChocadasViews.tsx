/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Egg, Search, Plus, Calendar, Thermometer, Droplets, ChevronLeft, Save, Sparkles, FileText, Check, Clipboard, Activity, Pencil, Trash2 } from 'lucide-react';
import { repo, DURACAO_INCUBACAO, addDays, getCurrentDateString } from '../repository';
import { Chocada } from '../types';
import { Button, Card, StatusChip, Input, Select, ConfirmDialog } from './GlacierUI';
import { CircularProgressRing, TempBarChart, MiniProgressRing } from './Charts';
import { useAuth } from '../contexts/AuthContext';

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
    }

    setFilteredChocadas(result);
  }, [searchTerm, activeFilter]);

  const handleConfirmDelete = () => {
    if (!delTarget) return;
    repo.deleteChocada(delTarget);
    setFilteredChocadas(prev => prev.filter(ch => ch.id !== delTarget));
    setDelTarget(null);
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Egg className="w-5 h-5 text-sky-400 fill-sky-400/10" />
          <h1 className="font-headline font-bold text-slate-100 text-base leading-tight">Lista de Chocadas</h1>
        </div>
        {currentUser?.role !== 'LEITOR' && (
          <button
            onClick={() => onNavigate('chocada_nova')}
            className="p-2 bg-slate-900 border border-sky-400/20 hover:border-sky-400/40 rounded-xl text-sky-400"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-grow overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin pb-20">
        {/* Search bar matching photo pattern exactly */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141c2e] border border-sky-500/15 rounded-xl py-3 pl-11 pr-4 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium"
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
          ] as const).map((pill) => {
            const isActive = activeFilter === pill.code;
            return (
              <button
                key={pill.code}
                onClick={() => setActiveFilter(pill.code)}
                className={`py-2 px-4 rounded-full text-xs font-semibold whitespace-nowrap border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-sky-500/15 border-sky-400/30 text-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.05)]'
                    : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Card Feed - Grid responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredChocadas.length === 0 ? (
            <div className="col-span-full text-center py-12 space-y-3 Card">
              <Egg className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-medium">Nenhum lote correspondente.</p>
            </div>
          ) : (
            filteredChocadas.map((ch) => {
              const duration = DURACAO_INCUBACAO[ch.tipoOvo] || 21;
              const start = new Date(ch.dataInicio + 'T12:00:00');
              const now = new Date(getCurrentDateString() + 'T12:00:00');
              const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
              const remaining = Math.max(0, duration - elapsed);
              const progressPercent = Math.min(100, Math.round((elapsed / duration) * 100));

              return (
                <div
                  key={ch.id}
                  onClick={() => onNavigate('chocada_detalhes', { id: ch.id })}
                  className="bg-slate-950/60 hover:bg-slate-900/60 border border-sky-500/10 rounded-2xl p-4 flex gap-4 transition-all duration-300 hover:border-sky-400/30 cursor-pointer relative"
                >
                  <MiniProgressRing day={elapsed} total={duration} status={ch.status} />

                  <div className="flex-1 space-y-2 text-slate-100 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="truncate">
                        <h3 className="font-bold text-sm tracking-tight truncate">{ch.nome}</h3>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-semibold uppercase">
                          <span className="flex items-center gap-0.5"><Egg className="w-3 h-3 text-[#7dd3fc]" /> {ch.quantidadeOvosAtivos} ovos</span>
                          <span>•</span>
                          <span>Início: {repo.formatReadableDate(ch.dataInicio)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
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
                              className="p-2 bg-slate-900/70 hover:bg-sky-500/10 text-slate-500 hover:text-sky-300 rounded-lg transition-colors cursor-pointer"
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
                              className="p-2 bg-slate-900/70 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                        <span>Previsão de Nascimento</span>
                        <span className="text-slate-200">{repo.formatReadableDate(ch.dataPrevistaNascimento)}</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full shadow-[0_0_8px_rgba(125,211,252,0.3)] ${
                            ch.status === 'ATRASADA' ? 'bg-red-400' :
                            ch.status === 'PROXIMA' ? 'bg-purple-400' : 'bg-sky-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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

  useEffect(() => {
    const data = repo.getChocadaById(id);
    if (data) {
      setChocada(data);
      setLogs(repo.getRegistrosDiarios(id));
    }
  }, [id]);

  if (!chocada) {
    return (
      <div className="p-6 text-center text-slate-400 bg-slate-950 min-h-screen">
        Lote não encontrado.
        <Button onClick={() => onNavigate('chocadas_lista')} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const duration = DURACAO_INCUBACAO[chocada.tipoOvo] || 21;
  const start = new Date(chocada.dataInicio + 'T12:00:00');
  const now = new Date(getCurrentDateString() + 'T12:00:00');
  const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const handleDelete = () => {
    repo.deleteChocada(chocada.id);
    setDeleteOpen(false);
    onNavigate('chocadas_lista');
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Dynamic Navigation Topbar */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('chocadas_lista')} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 hover:text-white cursor-pointer select-none">
            <ChevronLeft className="w-4 h-4 inline mr-1" /> Voltar
          </button>
          <span className="font-headline font-bold text-slate-200 text-xs truncate max-w-[150px]">
            Lote: {chocada.nome}
          </span>
        </div>
        {currentUser?.role !== 'LEITOR' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('chocada_editar', { id: chocada.id })}
              className="text-xs font-bold text-sky-400 hover:underline uppercase"
            >
              Editar
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="text-xs font-bold text-red-400 hover:underline uppercase"
            >
              Excluir
            </button>
          </div>
        )}
      </header>

      {/* Main Viewport */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20">
        
        {/* Layout em 2 colunas no desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda: Progresso + Info Geral */}
          <div className="space-y-6">
            {/* Frozen Arc Circle layout */}
            <section className="bg-slate-950/60 border border-sky-500/10 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-[80px] rounded-full -mr-16 -mt-16"></div>
              <CircularProgressRing currentDay={elapsed} totalDays={duration} status={chocada.status} />
              
              <div className="mt-4 flex gap-2">
                <span className="px-3.5 py-1.5 bg-sky-500/10 text-sky-300 text-[10px] font-bold rounded-full border border-sky-400/20 uppercase tracking-widest leading-none">
                  Ativo
                </span>
                {elapsed >= 18 && (
                  <span className="px-3.5 py-1.5 bg-purple-500/10 text-purple-300 text-[10px] font-bold rounded-full border border-purple-400/20 uppercase tracking-widest leading-none italic animate-pulse">
                    Fase de Eclosão
                  </span>
                )}
              </div>
            </section>

            {/* Realtime Thermostats statistics */}
            <section className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-950/60 border border-sky-500/10 rounded-xl p-4 flex flex-col gap-1.5 relative overflow-hidden group">
                <Thermometer className="absolute right-3.5 top-3 text-sky-400/20 w-8 h-8" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temperatura Ideal</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-100">{chocada.temperaturaIdeal}°C</span>
                  <span className="text-[9px] text-[#7dd3fc] font-bold">OK</span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-sky-500/10 rounded-xl p-4 flex flex-col gap-1.5 relative overflow-hidden group">
                <Droplets className="absolute right-3.5 top-3 text-purple-400/20 w-8 h-8" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Umidade Ideal</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[#c8a0f0]">{chocada.umidadeIdeal}%</span>
                  <span className="text-[9px] text-purple-400 font-bold">OK</span>
                </div>
              </div>
            </section>

            {/* Detailed Info properties container */}
            <section className="bg-slate-950/60 border border-sky-500/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-[11px] font-bold tracking-widest text-[#7dd3fc] uppercase flex items-center gap-1.5">
                <Clipboard className="w-4 h-4" /> Informações Gerais
              </h3>
              
              <div className="grid grid-cols-2 gap-y-4 text-xs font-semibold leading-normal">
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-bold">Data de Início</p>
                  <p className="text-slate-100 font-medium mt-0.5">{repo.formatReadableDate(chocada.dataInicio)}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-bold">Previsão Nascimento</p>
                  <p className="text-slate-100 font-medium mt-0.5">{repo.formatReadableDate(chocada.dataPrevistaNascimento)}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-bold">Quantidade Inicial</p>
                  <p className="text-slate-100 font-medium mt-0.5">{chocada.quantidadeOvosInicial} Ovos</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-bold">Saldo Ativo Vigente</p>
                  <p className="text-[#7dd3fc] font-black mt-0.5">{chocada.quantidadeOvosAtivos} Ovos</p>
                </div>
              </div>
            </section>
          </div>

          {/* Coluna Direita: Gráfico + Ações */}
          <div className="space-y-6">
            {/* Temperature chart variation banner */}
            <section className="bg-slate-950/60 border border-sky-500/10 rounded-2xl p-5 space-y-3.5">
              <div className="flex justify-between items-center text-slate-100">
                <h3 className="text-[11px] font-bold tracking-widest text-[#7dd3fc] uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Histórico Flutuação 24h
                </h3>
                <span className="text-[8px] uppercase font-mono tracking-widest text-slate-400 font-bold">Var: ±0.2°C</span>
              </div>
              <TempBarChart />
            </section>

            {/* Actions Button Grid */}
            <section className="grid grid-cols-2 gap-3 pb-4">
              {currentUser?.role !== 'LEITOR' && (
                <>
                  <button
                    onClick={() => onNavigate('registro_diario_novo', { id: chocada.id })}
                    className="p-4 bg-slate-950/60 hover:bg-slate-900 border border-sky-500/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer text-slate-300"
                  >
                    <Clipboard className="w-5 h-5 text-sky-400" />
                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Registrar Inspeção</span>
                  </button>
                  <button
                    onClick={() => onNavigate('ovoscopia_nova', { id: chocada.id })}
                    className="p-4 bg-slate-950/60 hover:bg-slate-900 border border-sky-500/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer text-slate-300"
                  >
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Ovoscopia</span>
                  </button>
                  <button
                    onClick={() => onNavigate('nascimento_novo', { id: chocada.id })}
                    className="p-4 bg-slate-950/60 hover:bg-slate-900 border border-sky-500/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer text-slate-300"
                  >
                    <Plus className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Registrar Nascimento</span>
                  </button>
                </>
              )}
              <button
                onClick={() => onNavigate('relatorio_chocada', { id: chocada.id })}
                className="p-4 bg-[#7dd3fc]/5 border border-[#7dd3fc]/20 hover:bg-[#7dd3fc]/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer text-sky-300"
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

  const chocadeirasList = repo.getChocadeiras().map(ch => ({
    value: ch.id,
    label: `${ch.nome} (Cap. ${ch.capacidadeMaximaOvos})`
  }));

  // Automatic calculation duration
  const estimatedDuration = DURACAO_INCUBACAO[tipoOvo] || 21;
  const birthPrediction = addDays(dataInicio, estimatedDuration);

  useEffect(() => {
    // Set default incubator if available
    const activeChocadeiras = repo.getChocadeiras();
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

  const handleSave = () => {
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

    const result = repo.saveChocada(formPayload);
    if (result.success) {
      onNavigate('chocadas_lista');
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('chocadas_lista')} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 hover:text-white cursor-pointer select-none">
            Cancelar
          </button>
          <span className="font-headline font-bold text-slate-200 text-sm">
            {idToEdit ? 'Editar Ciclo' : 'Configurar Ciclo'}
          </span>
        </div>
      </header>

      {/* Form content scrolling wrapper */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 max-w-4xl mx-auto w-full">
        
        {idToEdit && (
          <div className="py-2.5 px-4 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs rounded-xl font-semibold flex items-center gap-2">
            <Clipboard className="w-4 h-4 shrink-0" />
            Você está editando informações do lote cadastrado.
          </div>
        )}

        {errorMsg && (
          <div className="py-2.5 px-4 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <Card glow className="space-y-5">
          <Input
            id="nome-chocada"
            label="Nome da Chocada"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Lote A - Primavera"
          />

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
                <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Chocadeira</label>
                <div className="py-3 px-4 bg-red-500/5 text-red-400 border border-red-500/20 text-xs rounded-xl font-medium">
                  Sem chocadeiras ativas!
                </div>
              </div>
            )}
          </div>

          {/* Predict card auto calculating dates dynamically matching photos */}
          <div className="bg-[#141c2e] border border-sky-500/10 rounded-xl p-4 border-dashed relative overflow-hidden flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span className="text-slate-400 font-medium font-sans">Previsão Calculada de Nascimento</span>
            </div>
            <span className="font-extrabold text-sky-400 tracking-tight">
              {repo.formatReadableDate(birthPrediction)}
            </span>
          </div>

          <div className="space-y-1 w-full">
            <label className="text-xs font-semibold text-slate-400 px-1 block uppercase tracking-wider">
              Observações Adicionais
            </label>
            <textarea
              className="w-full bg-[#1a2438]/30 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium resize-none text-xs"
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
