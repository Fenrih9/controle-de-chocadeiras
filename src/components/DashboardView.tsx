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
    <div className="absolute inset-0 bg-[var(--color-bg)] flex flex-col justify-between p-6 overflow-y-auto">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-10 left-[-30%] w-80 h-80 rounded-full bg-[var(--color-brand)]/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-[-30%] w-80 h-80 rounded-full bg-[var(--color-accent)]/5 blur-[100px] pointer-events-none"></div>

      <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full space-y-8 py-10 relative z-10">
        {/* Animated Icon App Logo */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-[var(--color-brand)] rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
            <Egg className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] font-headline mt-6 tracking-tight">
            Gestão de Chocadeiras
          </h1>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-widest mt-1.5 font-bold text-center">
            Laranjeiras
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-6 shadow-lg space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-xs py-2 px-3 rounded-lg text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-[var(--color-muted)] ml-1 block font-bold uppercase tracking-wider">Usuário</label>
              <input
                type="text"
                value={username}
                disabled={loading}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-ink)] placeholder-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium disabled:opacity-50 text-sm"
                placeholder="Ex: admin"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[var(--color-muted)] ml-1 block font-bold uppercase tracking-wider">Senha</label>
              <input
                type="password"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-ink)] placeholder-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium disabled:opacity-50 text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Entrando...' : 'Entrar'} <LogIn className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="text-center pb-4 shrink-0 relative z-10">
        <p className="text-[10px] text-[var(--color-muted)] font-semibold">
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
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* Top Banner Header */}
      <header className="flex justify-between items-center w-full px-5 lg:px-8 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--color-brand)]/20">
            <img
              alt="Perfil"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=200"
            />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-bold">Produtor Rural</span>
            <h1 className="font-headline font-bold text-[var(--color-ink)] text-sm leading-tight">Olá, {currentUser?.username || 'criador'}</h1>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('alertas')}
          className="p-2 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-brand)]/30 rounded-xl relative hover:scale-105 transition-all text-[var(--color-brand)] shadow-sm"
        >
          <Bell className="w-5 h-5" />
          {alertas.length > 0 && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-danger)] rounded-full animate-ping"></div>
          )}
        </button>
      </header>

      {/* Main scrolling viewport content */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-24">
        <section className="relative overflow-hidden rounded-2xl bg-[var(--color-brand)] border border-[var(--color-line)] min-h-[320px] lg:min-h-[360px] shadow-lg">
          <div className="absolute inset-0">
            <img
              alt="Ovos em incubação"
              className="h-full w-full object-cover opacity-30"
              src="https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&q=80&w=1600"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand)] via-[var(--color-brand)]/90 to-[var(--color-brand)]/70"></div>
          </div>

          <div className="relative z-10 max-w-xl px-6 py-8 lg:px-10 lg:py-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Controle de Incubação</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-semibold leading-tight text-white">
              Ciclos mais simples. Resultados mais claros.
            </h2>
            <p className="mt-4 text-sm md:text-base leading-relaxed text-white/80 max-w-md">
              Acompanhe chocadas, alertas e previsões em uma tela mais limpa, pronta para rotina de granja no celular ou desktop.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {currentUser?.role !== 'LEITOR' && (
                <button
                  onClick={() => onNavigate('chocada_nova')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[var(--color-brand)] px-5 py-3 text-sm font-bold shadow-md transition hover:bg-white/90"
                >
                  <Plus className="w-4 h-4" /> Nova Chocada
                </button>
              )}
              <button
                onClick={() => onNavigate('chocadas_lista')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Ver Ciclos <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, title: 'Dados seguros', text: 'Histórico sincronizado', color: 'bg-[var(--color-success)]' },
            { icon: RotateCcw, title: 'Rotina simples', text: 'Ações rápidas por ciclo', color: 'bg-[var(--color-accent)]' },
            { icon: Sprout, title: 'Produção clara', text: 'Indicadores fáceis de ler', color: 'bg-[var(--color-brand)]' },
          ].map((item) => (
            <div key={item.title} className="bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}
              >
                <item.icon className="w-4 h-4 text-white shrink-0" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[var(--color-ink)]">{item.title}</h3>
                <p className="text-[11px] text-[var(--color-muted)]">{item.text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Grid Metrics Bento style matching screens precisely */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Chocadas Ativas */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-brand)]/30 transition-all duration-300 flex flex-col justify-between min-h-[145px] group">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center text-[var(--color-brand)] transition-colors group-hover:bg-[var(--color-brand)]/15">
                <Egg className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold text-[var(--color-brand)] bg-[var(--color-brand-soft)] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Em Curso
              </span>
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">Chocadas Ativas</span>
              <h3 className="text-3xl font-extrabold text-[var(--color-ink)] tracking-tight mt-0.5">{chocadasAtivas.length}</h3>
            </div>
          </div>

          {/* Card 2: Ovos Ativos */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-accent)]/30 transition-all duration-300 flex flex-col justify-between min-h-[145px] group">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] transition-colors group-hover:bg-[var(--color-accent)]/15">
                <Inbox className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold text-[var(--color-accent)] bg-[var(--color-accent-soft)] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Incubando
              </span>
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">Ovos Ativos</span>
              <h3 className="text-3xl font-extrabold text-[var(--color-ink)] tracking-tight mt-0.5">{totalOvos}</h3>
            </div>
          </div>

          {/* Card 3: Pintinhos Disponíveis */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-success)]/30 transition-all duration-300 flex flex-col justify-between min-h-[145px] group">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)] transition-colors group-hover:bg-[var(--color-success)]/15">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-[8px] font-extrabold text-[var(--color-success)] bg-[var(--color-success-soft)] px-1.5 py-0.5 rounded-md">
                  {estoquePintinhos.nascidos} Nasc.
                </span>
                <span className="text-[8px] font-extrabold text-[var(--color-muted)] bg-[var(--color-muted)]/10 px-1.5 py-0.5 rounded-md">
                  {estoquePintinhos.vendidos} Vend.
                </span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">Pintinhos Disp.</span>
              <h3 className="text-3xl font-extrabold text-[var(--color-success)] tracking-tight mt-0.5">{estoquePintinhos.disponivel}</h3>
            </div>
          </div>

          {/* Card 4: Próxima Previsão */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-warning)]/30 transition-all duration-300 flex flex-col justify-between min-h-[145px] group">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-warning)]/10 flex items-center justify-center text-[var(--color-warning)] transition-colors group-hover:bg-[var(--color-warning)]/15">
                <Calendar className="w-5 h-5" />
              </div>
              {proximaData && (
                <span className="text-[9px] font-extrabold text-[var(--color-warning)] bg-[var(--color-warning-soft)] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Agenda
                </span>
              )}
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">Próxima Previsão</span>
              <h3 className="text-sm font-bold text-[var(--color-ink)] tracking-tight mt-2 truncate line-clamp-2">
                {proximoNascimento}
              </h3>
            </div>
          </div>

          {/* Card 5: Taxa Média de Eclosão */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-info)]/30 transition-all duration-300 flex flex-col justify-between min-h-[145px] group col-span-2 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-info)]/10 flex items-center justify-center text-[var(--color-info)] transition-colors group-hover:bg-[var(--color-info)]/15">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold text-[var(--color-info)] bg-[var(--color-info-soft)] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Eficácia
              </span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">T. Média Eclosão</span>
                <span className="text-xs font-bold text-[var(--color-info)]">{taxaMediaEclosao}%</span>
              </div>
              <div className="w-full bg-[var(--color-surface-soft)] h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--color-info)] to-[var(--color-accent)] rounded-full transition-all duration-500"
                  style={{ width: `${taxaMediaEclosao}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Critical Notifications Alerts block */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-widest text-[var(--color-danger)] flex items-center gap-1.5 uppercase">
              <AlertTriangle className="w-4 h-4 text-[var(--color-danger)]" /> Alertas Críticos
            </h2>
            <button 
              onClick={() => onNavigate('alertas')}
              className="text-[10px] font-bold text-[var(--color-muted)] hover:text-[var(--color-brand)] uppercase tracking-widest cursor-pointer"
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
                    ? 'bg-[var(--color-danger-soft)] border-[var(--color-danger)]/15 text-[var(--color-danger)]' 
                    : 'bg-[var(--color-warning-soft)] border-[var(--color-warning)]/15 text-[var(--color-warning)]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${al.tipo === 'error' ? 'bg-[var(--color-danger)]/10' : 'bg-[var(--color-warning)]/10'}`}>
                  {al.tipo === 'error' ? <Thermometer className="w-5 h-5 text-[var(--color-danger)]" /> : <Droplets className="w-5 h-5 text-[var(--color-warning)]" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight text-[var(--color-ink)]">{al.titulo}</h4>
                  <p className="text-[var(--color-muted)] text-xs mt-1 leading-snug">{al.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Active Batches block */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-widest text-[var(--color-brand)] uppercase">Chocadas Recentes</h2>
            {currentUser?.role !== 'LEITOR' && (
              <button 
                onClick={() => onNavigate('chocada_nova')}
                className="p-1 px-2.5 rounded-lg bg-[var(--color-brand-soft)] border border-[var(--color-brand)]/20 hover:border-[var(--color-brand)]/40 text-[var(--color-brand)] text-[10px] uppercase font-bold tracking-wider hover:bg-[var(--color-brand-soft-hover)] transition-all cursor-pointer flex items-center gap-1"
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
                ? 'text-[var(--color-danger)] bg-[var(--color-danger-soft)] border-[var(--color-danger)]/20'
                : isUrgent
                ? 'text-[var(--color-warning)] bg-[var(--color-warning-soft)] border-[var(--color-warning)]/25'
                : isIminent
                ? 'text-[var(--color-warning)] bg-[var(--color-warning-soft)] border-[var(--color-warning)]/25'
                : 'text-[var(--color-brand)] bg-[var(--color-brand-soft)] border-[var(--color-brand)]/20';

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
                  className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-brand)]/25 cursor-pointer shadow-sm"
                >
                  {/* Cabeçalho com nome e status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-[var(--color-ink)] tracking-tight truncate leading-tight">{ch.nome}</h3>
                      <p className="text-[10px] text-[var(--color-muted)] mt-0.5 uppercase tracking-wider font-semibold">
                        {ch.tipoOvo} · {ch.quantidadeOvosAtivos} ovos
                      </p>
                      {chocadeiraNome && (
                        <p className="text-[10px] text-[var(--color-brand)] mt-0.5 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]/60"></span>
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
                        <div className="flex justify-between text-[10px] font-bold text-[var(--color-muted)]">
                          <span>Progresso da Incubação</span>
                          <span>{elapsed} / {totalDays} Dias</span>
                        </div>
                        <div className="w-full bg-[var(--color-surface-soft)] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOverdue ? 'bg-[var(--color-danger)]' :
                              isUrgent ? 'bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-danger)]' :
                              isIminent ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-warning)]' :
                              'bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Contagem regressiva em destaque */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
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
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--color-line)]">
                    <p className="text-[10px] text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                      Iniciou em {repo.formatReadableDate(ch.dataInicio)}
                    </p>
                    <ChevronRight className="w-4 h-4 text-[var(--color-brand)]" />
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
          className="lg:hidden fixed bottom-20 right-5 w-14 h-14 bg-[var(--color-brand)] text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg active:scale-90 hover:brightness-110 transition-all z-40"
        >
          <Plus className="w-8 h-8 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
