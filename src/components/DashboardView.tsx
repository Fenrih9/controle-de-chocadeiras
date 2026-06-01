/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Egg, LogIn, Bell, Thermometer, Droplets, TrendingUp, Inbox, Calendar, AlertTriangle, ChevronRight, Plus } from 'lucide-react';
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
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = repo.getUsuarioByUsername(username);
    
    if (user && user.senhaMock === password && user.ativo) {
      setErrorMsg('');
      login(user);
      onLoginSuccess();
    } else {
      setErrorMsg('Usuário ou senha incorretos, ou conta inativa.');
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0a0e1a] flex flex-col justify-between p-6 overflow-y-auto">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-10 left-[-30%] w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-[-30%] w-80 h-80 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none"></div>

      <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full space-y-10 py-10">
        {/* Animated Icon App Logo */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-400/20 shadow-[0_0_20px_rgba(125,211,252,0.15)] animate-bounce">
            <Egg className="w-10 h-10 text-sky-400 fill-sky-400/10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 font-headline mt-6 tracking-tight">
            Gestão de Chocadeiras
          </h1>
          <p className="text-xs text-sky-400/80 uppercase tracking-widest mt-1.5 font-semibold text-center">
            Controle profissional para sua produção rural
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 px-3 rounded-lg text-center font-medium animate-pulse">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-slate-400 ml-1 block font-semibold uppercase tracking-wider">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1a2438]/40 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium"
              placeholder="Ex: admin"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 ml-1 font-semibold uppercase tracking-wider">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a2438]/40 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="pt-2">
            <Button type="submit">
              Entrar <LogIn className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>
      </div>

      <div className="text-center pb-4 shrink-0">
        <p className="text-[10px] text-slate-500 font-mono">
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
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Top Banner Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-sky-400/20">
            <img
              alt="Perfil"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=200"
            />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#7dd3fc] font-bold">Produtor Rural</span>
            <h1 className="font-headline font-bold text-slate-100 text-sm leading-tight">Olá, Criador</h1>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('alertas')}
          className="p-2 bg-slate-900 border border-sky-400/20 hover:border-sky-400/40 rounded-xl relative hover:scale-105 transition-all text-sky-400"
        >
          <Bell className="w-5 h-5" />
          {alertas.length > 0 && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff6b6b] rounded-full animate-ping"></div>
          )}
        </button>
      </header>

      {/* Main scrolling viewport content */}
      <div className="flex-grow overflow-y-auto px-5 py-6 space-y-6 scrollbar-thin pb-20">
        {/* Grid Metrics Bento style matching screens precisely */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <Card glow borderAccent="primary">
            <Egg className="w-5 h-5 text-sky-400 mb-2 fill-sky-400/10" />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Chocadas Ativas</span>
            <h3 className="text-2xl font-black text-slate-100 tracking-tight mt-0.5">{chocadasAtivas.length}</h3>
          </Card>

          <Card glow borderAccent="tertiary">
            <Inbox className="w-5 h-5 text-purple-400 mb-2 fill-purple-400/10" />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Ovos Ativos</span>
            <h3 className="text-2xl font-black text-slate-100 tracking-tight mt-0.5">{totalOvos}</h3>
          </Card>

          <Card glow borderAccent="default">
            <Calendar className="w-5 h-5 text-slate-400 mb-2" />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Próxima Previsão</span>
            <h3 className="text-sm font-bold text-slate-100 tracking-tight mt-1 truncate">
              {proximoNascimento}
            </h3>
          </Card>

          <Card glow borderAccent="warning">
            <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">T. Média de Eclosão</span>
            <h3 className="text-2xl font-black text-emerald-400 tracking-tight mt-0.5">{taxaMediaEclosao}%</h3>
          </Card>
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
                className={`p-4 rounded-xl backdrop-blur-md border cursor-pointer hover:brightness-110 active:scale-95 transition-all text-xs flex gap-3.5 ${
                  al.tipo === 'error' 
                    ? 'bg-red-500/10 border-red-500/25 text-red-200' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${al.tipo === 'error' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                  {al.tipo === 'error' ? <Thermometer className="w-5 h-5 text-red-400" /> : <Droplets className="w-5 h-5 text-amber-400" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">{al.titulo}</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-snug">{al.msg}</p>
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
            {chocadasAtivas.slice(0, 3).map((ch) => {
              const totalDays = DURACAO_INCUBACAO[ch.tipoOvo] || 21;
              const start = new Date(ch.dataInicio + 'T12:00:00');
              const now = new Date(getCurrentDateString() + 'T12:00:00');
              const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
              const progressPercent = Math.min(100, Math.round((elapsed / totalDays) * 100));

              return (
                <div
                  key={ch.id}
                  onClick={() => onNavigate('chocada_detalhes', { id: ch.id })}
                  className="bg-slate-950/60 hover:bg-slate-900/60 border border-sky-500/10 rounded-2xl p-4 flex gap-4 transition-all duration-300 hover:border-sky-400/30 cursor-pointer text-slate-200"
                >
                  <MiniProgressRing day={elapsed} total={totalDays} status={ch.status} />
                  
                  <div className="flex-1 space-y-2 text-slate-100 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="truncate">
                        <h3 className="font-bold text-sm tracking-tight truncate">{ch.nome}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                          Iniciou em {repo.formatReadableDate(ch.dataInicio)}
                        </p>
                      </div>
                      <StatusChip status={ch.status} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Progresso da Incubação</span>
                        <span>{elapsed} / {totalDays} Dias</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-sky-400 to-purple-400 rounded-full shadow-[0_0_8px_#7dd3fc]"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button className="self-center p-1.5 bg-slate-900/50 hover:bg-slate-800 rounded-lg shrink-0 text-sky-400">
                    <ChevronRight className="w-5 h-5 animate-pulse" />
                  </button>
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
          className="lg:hidden fixed bottom-20 right-5 w-14 h-14 bg-sky-500 text-slate-900 rounded-2xl flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(125,211,252,0.4)] active:scale-90 hover:brightness-110 transition-all z-40"
        >
          <Plus className="w-8 h-8 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
