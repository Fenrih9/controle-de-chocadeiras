/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Egg, LogIn, Bell, Thermometer, Droplets, TrendingUp, Inbox, Calendar, AlertTriangle, ChevronRight, Plus, ShieldCheck, RotateCcw, Sprout } from 'lucide-react';
import { repo, DURACAO_INCUBACAO, getCurrentDateString } from '../repository';
import { Chocada } from '../types';
import { Button, Card, StatusChip } from './GlacierUI';
import { MiniProgressRing } from './Charts';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const result = await login(username, password);
    setLoading(false);
    
    if (result.success) {
      onLoginSuccess();
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#f7f2e9] flex flex-col justify-between p-6 overflow-y-auto">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-10 left-[-30%] w-80 h-80 rounded-full bg-[#3f5f31]/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-[-30%] w-80 h-80 rounded-full bg-[#3f5f31]/5 blur-[100px] pointer-events-none"></div>

      <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full space-y-8 py-10 relative z-10">
        {/* Animated Icon App Logo */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-[#3f5f31]/10 rounded-full flex items-center justify-center border border-[#3f5f31]/20 shadow-sm animate-bounce">
            <Egg className="w-10 h-10 text-[#3f5f31] fill-[#3f5f31]/10" />
          </div>
          <h1 className="text-2xl font-bold text-[#263225] font-headline mt-6 tracking-tight">
            Gestão de Chocadeiras
          </h1>
          <p className="text-xs text-[#5f6659] uppercase tracking-widest mt-1.5 font-bold text-center">
            Laranjeiras
          </p>
        </div>

        <div className="bg-[#fffaf2] border border-[#465336]/15 rounded-2xl p-6 shadow-sm space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs py-2 px-3 rounded-lg text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-[#5f6659] ml-1 block font-bold uppercase tracking-wider">Usuário</label>
              <input
                type="text"
                value={username}
                disabled={loading}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#fffaf2] border border-[#465336]/20 rounded-xl py-3 px-4 text-[#263225] placeholder-[#5f6659]/40 focus:outline-none focus:ring-2 focus:ring-[#3f5f31]/15 focus:border-[#3f5f31] transition-all font-medium disabled:opacity-50 text-sm"
                placeholder="Ex: admin"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#5f6659] ml-1 block font-bold uppercase tracking-wider">Senha</label>
              <input
                type="password"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#fffaf2] border border-[#465336]/20 rounded-xl py-3 px-4 text-[#263225] placeholder-[#5f6659]/40 focus:outline-none focus:ring-2 focus:ring-[#3f5f31]/15 focus:border-[#3f5f31] transition-all font-medium disabled:opacity-50 text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-[#3f5f31] hover:bg-[#314b27] text-[#fffaf2] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Entrando...' : 'Entrar'} <LogIn className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="text-center pb-4 shrink-0 relative z-10">
        <p className="text-[10px] text-[#6f756a] font-semibold">
          Solicite suas credenciais ao administrador do sistema.
        </p>
      </div>
    </div>
  );
};

interface DashboardViewProps {
  onNavigate: (screenName: string, params?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const chocadas = repo.getChocadas();
  const alertas = repo.getAlertas();

  // Summary Metrics calculations
  const chocadasAtivas = chocadas.filter(c => c.status === 'EM_ANDAMENTO' || c.status === 'PROXIMA' || c.status === 'ATRASADA');
  const totalOvos = chocadasAtivas.reduce((sum, c) => sum + c.quantidadeOvosAtivos, 0);
  const estoquePintinhos = repo.getEstoquePintinhosGeral();

  // Next birth logic
  let proximoNascimento = "Sem previsões";
  let proximaData = "";
  chocadasAtivas.forEach(c => {
    if (!proximaData || c.dataPrevistaNascimento < proximaData) {
      proximaData = c.dataPrevistaNascimento;
    }
  });

  if (proximaData) {
    const diff = repo.formatReadableDate(proximaData);
    proximoNascimento = diff;
  }

  // Average Hatching Rate calculations
  const finalizadas = chocadas.filter(c => c.status === 'FINALIZADA');
  let totalHatched = 0;
  let totalEggCount = 0;
  finalizadas.forEach(fn => {
    const nascimento = repo.getRegistrosNascimento(fn.id)[0];
    if (nascimento) {
      totalHatched += nascimento.pintinhosNascidos;
      totalEggCount += fn.quantidadeOvosInicial;
    }
  });

  const taxaMediaEclosao = totalEggCount > 0 ? Math.round((totalHatched / totalEggCount) * 100) : 0;

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#f7f2e9]">
      {/* Top Banner Header */}
      <header className="flex justify-between items-center w-full px-5 lg:px-8 py-4 border-b border-[#465336]/15 bg-[#fffaf2]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#465336]/15">
            <img
              alt="Perfil"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=200"
            />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#6f756a] font-bold">Produtor Rural</span>
            <h1 className="font-headline font-bold text-[#263225] text-sm leading-tight">Olá, {currentUser?.username || 'criador'}</h1>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('alertas')}
          className="p-2 bg-[#fffaf2] border border-[#465336]/15 hover:border-[#3f5f31]/35 rounded-xl relative hover:scale-105 transition-all text-[#3f5f31] shadow-sm"
        >
          <Bell className="w-5 h-5" />
          {alertas.length > 0 && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#b85745] rounded-full animate-ping"></div>
          )}
        </button>
      </header>

      {/* Main scrolling viewport content */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-24">
        <section className="relative overflow-hidden rounded-2xl bg-[#eee5d8] border border-[#465336]/10 min-h-[320px] lg:min-h-[360px] shadow-sm">
          <div className="absolute inset-0">
            <img
              alt="Ovos em incubação"
              className="h-full w-full object-cover opacity-55"
              src="https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&q=80&w=1600"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#f7f2e9] via-[#f7f2e9]/82 to-[#f7f2e9]/18"></div>
          </div>

          <div className="relative z-10 max-w-xl px-6 py-8 lg:px-10 lg:py-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#3f5f31]">Controle de Incubação</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-semibold leading-tight text-[#263225]">
              Ciclos mais simples. Resultados mais claros.
            </h2>
            <p className="mt-4 text-sm md:text-base leading-relaxed text-[#5f6659] max-w-md">
              Acompanhe chocadas, alertas e previsões em uma tela mais limpa, pronta para rotina de granja no celular ou desktop.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {currentUser?.role !== 'LEITOR' && (
                <button
                  onClick={() => onNavigate('chocada_nova')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3f5f31] px-5 py-3 text-sm font-bold text-[#fffaf2] shadow-sm transition hover:bg-[#314b27]"
                >
                  <Plus className="w-4 h-4" /> Nova Chocada
                </button>
              )}
              <button
                onClick={() => onNavigate('chocadas_lista')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#465336]/15 bg-[#fffaf2]/90 px-5 py-3 text-sm font-bold text-[#263225] transition hover:bg-[#fffaf2]"
              >
                Ver Ciclos <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, title: 'Dados seguros', text: 'Histórico sincronizado' },
            { icon: RotateCcw, title: 'Rotina simples', text: 'Ações rápidas por ciclo' },
            { icon: Sprout, title: 'Produção clara', text: 'Indicadores fáceis de ler' },
          ].map((item) => (
            <div key={item.title} className="bg-[#3f5f31] text-[#fffaf2] rounded-xl px-4 py-3 flex items-center gap-3">
              <item.icon className="w-5 h-5 shrink-0" />
              <div>
                <h3 className="text-xs font-bold">{item.title}</h3>
                <p className="text-[11px] text-[#fffaf2]/75">{item.text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Grid Metrics Bento style matching screens precisely */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Chocadas Ativas */}
          <div className="bg-[#fffdfb] border border-[#465336]/10 rounded-2xl p-5 shadow-[0_8px_30px_rgba(66,55,39,0.015)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(70,83,54,0.06)] hover:border-[#3f5f31]/30 transition-all duration-300 flex flex-col justify-between min-h-[145px] group">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-500/20">
                <Egg className="w-5 h-5 fill-blue-500/5" />
              </div>
              <span className="text-[9px] font-extrabold text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Em Curso
              </span>
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f756a] block">Chocadas Ativas</span>
              <h3 className="text-3xl font-extrabold text-[#263225] tracking-tight mt-0.5">{chocadasAtivas.length}</h3>
            </div>
          </div>

          {/* Card 2: Ovos Ativos */}
          <div className="bg-[#fffdfb] border border-[#465336]/10 rounded-2xl p-5 shadow-[0_8px_30px_rgba(66,55,39,0.015)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(70,83,54,0.06)] hover:border-[#3f5f31]/30 transition-all duration-300 flex flex-col justify-between min-h-[145px] group">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-500/20">
                <Inbox className="w-5 h-5 fill-indigo-500/5" />
              </div>
              <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Incubando
              </span>
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f756a] block">Ovos Ativos</span>
              <h3 className="text-3xl font-extrabold text-[#263225] tracking-tight mt-0.5">{totalOvos}</h3>
            </div>
          </div>

          {/* Card 3: Pintinhos Disponíveis */}
          <div className="bg-[#fffdfb] border border-[#465336]/10 rounded-2xl p-5 shadow-[0_8px_30px_rgba(66,55,39,0.015)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(70,83,54,0.06)] hover:border-[#3f5f31]/30 transition-all duration-300 flex flex-col justify-between min-h-[145px] group">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-500/20">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  {estoquePintinhos.nascidos} Nasc.
                </span>
                <span className="text-[8px] font-extrabold text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded-md">
                  {estoquePintinhos.vendidos} Vend.
                </span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f756a] block">Pintinhos Disp.</span>
              <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight mt-0.5">{estoquePintinhos.disponivel}</h3>
            </div>
          </div>

          {/* Card 4: Próxima Previsão */}
          <div className="bg-[#fffdfb] border border-[#465336]/10 rounded-2xl p-5 shadow-[0_8px_30px_rgba(66,55,39,0.015)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(70,83,54,0.06)] hover:border-[#3f5f31]/30 transition-all duration-300 flex flex-col justify-between min-h-[145px] group">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              {proximaData && (
                <span className="text-[9px] font-extrabold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Agenda
                </span>
              )}
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f756a] block">Próxima Previsão</span>
              <h3 className="text-sm font-bold text-[#263225] tracking-tight mt-2 truncate line-clamp-2">
                {proximoNascimento}
              </h3>
            </div>
          </div>

          {/* Card 5: Taxa Média de Eclosão */}
          <div className="bg-[#fffdfb] border border-[#465336]/10 rounded-2xl p-5 shadow-[0_8px_30px_rgba(66,55,39,0.015)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(70,83,54,0.06)] hover:border-[#3f5f31]/30 transition-all duration-300 flex flex-col justify-between min-h-[145px] group col-span-2 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 transition-colors group-hover:bg-teal-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold text-teal-700 bg-teal-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Eficácia
              </span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f756a]">T. Média Eclosão</span>
                <span className="text-xs font-bold text-teal-600">{taxaMediaEclosao}%</span>
              </div>
              <div className="w-full bg-[#f1eadf] h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${taxaMediaEclosao}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Critical Notifications Alerts block */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-widest text-[#7dd3fc] flex items-center gap-1.5 uppercase">
              <AlertTriangle className="w-4 h-4 text-red-400 fill-red-400/15" /> Alertas Críticos
            </h2>
            <button 
              onClick={() => onNavigate('alertas')}
              className="text-[10px] font-bold text-slate-400 hover:text-sky-300 uppercase tracking-widest"
            >
              Ver todos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alertas.slice(0, 2).map((al) => (
              <div 
                key={al.id} 
                onClick={() => al.chocadaId && onNavigate('chocada_detalhes', { id: al.chocadaId })}
                className={`p-4 rounded-xl border cursor-pointer hover:brightness-95 active:scale-95 transition-all text-xs flex gap-3.5 ${
                  al.tipo === 'error' 
                    ? 'bg-[#fef2f2] border-[#fee2e2] text-[#7f1d1d]' 
                    : 'bg-[#fffbeb] border-[#fef3c7] text-[#78350f]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${al.tipo === 'error' ? 'bg-[#fee2e2]' : 'bg-[#fef3c7]'}`}>
                  {al.tipo === 'error' ? <Thermometer className="w-5 h-5 text-[#ef4444]" /> : <Droplets className="w-5 h-5 text-[#f59e0b]" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">{al.titulo}</h4>
                  <p className="text-[#6f756a] text-xs mt-1 leading-snug">{al.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Active Batches block */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-widest text-[#7dd3fc] uppercase">Chocadas Recentes</h2>
            {currentUser?.role !== 'LEITOR' && (
              <button 
                onClick={() => onNavigate('chocada_nova')}
                className="p-1 px-2.5 rounded-lg bg-sky-500/10 border border-sky-400/20 hover:border-sky-400/40 text-sky-400 text-[10px] uppercase font-bold tracking-wider hover:bg-sky-500/15 transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {chocadasAtivas.map((ch) => {
              const totalDays = DURACAO_INCUBACAO[ch.tipoOvo] || 21;
              const start = new Date(ch.dataInicio + 'T12:00:00');
              const now = new Date(getCurrentDateString() + 'T12:00:00');
              const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
              const progressPercent = Math.min(100, Math.round((elapsed / totalDays) * 100));
              const daysRemaining = totalDays - elapsed;
              const isUrgent = daysRemaining <= 2 && daysRemaining > 0;
              const isIminent = daysRemaining <= 5 && daysRemaining > 2;
              const isOverdue = daysRemaining <= 0;
              const chocadeiraNome = repo.getChocadeiraById(ch.chocadeiraId)?.nome || null;

              const countdownColor = isOverdue
                ? 'text-red-400 bg-red-500/15 border-red-500/30'
                : isUrgent
                ? 'text-orange-300 bg-orange-500/15 border-orange-500/30'
                : isIminent
                ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';

              const countdownLabel = isOverdue
                ? `+${Math.abs(daysRemaining)}d` 
                : `-${daysRemaining}d`;

              const countdownTitle = isOverdue
                ? `${Math.abs(daysRemaining)} dia(s) em atraso`
                : `${daysRemaining} dia(s) restante(s)`;

              return (
                <div
                  key={ch.id}
                  onClick={() => onNavigate('chocada_detalhes', { id: ch.id })}
                  className="bg-[#fffdfb] border border-[#465336]/10 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(70,83,54,0.08)] hover:border-[#3f5f31]/25 cursor-pointer"
                >
                  {/* Cabeçalho com nome e status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-[#263225] tracking-tight truncate leading-tight">{ch.nome}</h3>
                      <p className="text-[10px] text-[#6f756a] mt-0.5 uppercase tracking-wider font-semibold">
                        {ch.tipoOvo} · {ch.quantidadeOvosAtivos} ovos
                      </p>
                      {chocadeiraNome && (
                        <p className="text-[10px] text-[#3f5f31] mt-0.5 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3f5f31]/60"></span>
                          {chocadeiraNome}
                        </p>
                      )}
                    </div>
                    <StatusChip status={ch.status} />
                  </div>

                  {/* Corpo: Anel de progresso + Contagem regressiva */}
                  <div className="flex items-center gap-3">
                    <MiniProgressRing day={elapsed} total={totalDays} status={ch.status} />

                    <div className="flex-1 space-y-2">
                      {/* Barra de progresso */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-[#6f756a]">
                          <span>Progresso da Incubação</span>
                          <span>{elapsed} / {totalDays} Dias</span>
                        </div>
                        <div className="w-full bg-[#f1eadf] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOverdue ? 'bg-red-400' :
                              isUrgent ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                              isIminent ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                              'bg-gradient-to-r from-[#3f5f31] to-emerald-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Contagem regressiva em destaque */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#6f756a] uppercase tracking-wider">
                          {isOverdue ? 'Nascimento esperado' : 'Faltam para nascer'}
                        </span>
                        <span
                          title={countdownTitle}
                          className={`text-xs font-black px-2 py-0.5 rounded-full border tracking-tight ${countdownColor}`}
                        >
                          {countdownLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé: Data de início e seta */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#465336]/8">
                    <p className="text-[10px] text-[#6f756a] font-semibold uppercase tracking-wider">
                      Iniciou em {repo.formatReadableDate(ch.dataInicio)}
                    </p>
                    <ChevronRight className="w-4 h-4 text-[#3f5f31]" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Persistent Mobile Floating Button over navigation */}
      {currentUser?.role !== 'LEITOR' && (
        <button
          onClick={() => onNavigate('chocada_nova')}
          title="Cadastrar Nova Chocada"
          className="lg:hidden fixed bottom-20 right-5 w-14 h-14 bg-[#3f5f31] text-[#fffaf2] rounded-2xl flex items-center justify-center cursor-pointer shadow-[0_14px_35px_rgba(66,55,39,0.22)] active:scale-90 hover:brightness-110 transition-all z-40"
        >
          <Plus className="w-8 h-8 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
