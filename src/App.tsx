/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home, Egg, Settings, Landmark, LogOut } from 'lucide-react';
import { repo } from './repository';
import { useAuth } from './contexts/AuthContext';


// Layout Views
import { LoginView, DashboardView } from './components/DashboardView';
import { ChocadasListaView, ChocadaDetalhesView, ChocadaNovaView } from './components/ChocadasViews';
import { RegistroDiarioNovoView, OvoscopiaNovaView, RegistroNascimentoView } from './components/LogsViews';
import {
  ConfiguracoesView,
  ChocadeirasListaView,
  ChocadeiraNovaView,
  PropriedadeEditarView,
  AlertasFeedView,
  RelatoriosGeraisView,
  UsuariosListaView,
  UsuarioNovoView
} from './components/SettingsViews';
import { ReportView } from './components/ReportView';

export default function App() {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [screenParams, setScreenParams] = useState<any>(null);
  const [fullWidth, setFullWidth] = useState<boolean>(false);
  const [dbResetCounter, setDbResetCounter] = useState(0);
  const [dbLoading, setDbLoading] = useState(true);

  const onNavigate = (screenName: string, params: any = null) => {
    setCurrentScreen(screenName);
    setScreenParams(params);
  };

  const handleResetDatabase = () => {
    // Operações em LocalStorage abandonadas pelo uso do Supabase
    setDbResetCounter(prev => prev + 1);
    setCurrentScreen('dashboard');
    alert('Cache de dados resetado. Os dados oficiais no Supabase permanecem seguros.');
  };

  // Listen to db reset updates & Initialize Supabase Cache
  useEffect(() => {
    setDbLoading(true);
    repo.loadFromSupabase().then(() => {
      setDbLoading(false);
    });
  }, [dbResetCounter]);

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-400/20 shadow-[0_0_20px_rgba(125,211,252,0.15)] animate-bounce">
          <Egg className="w-10 h-10 text-sky-400 fill-sky-400/10" />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold text-slate-100 font-headline tracking-tight">Sincronizando Nuvem</h2>
          <p className="text-xs text-sky-400/80 uppercase tracking-widest mt-2 font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></span>
            Acessando Supabase
          </p>
        </div>
      </div>
    );
  }

  // Screen mapping function
  const renderScreenContent = () => {
    if (!isAuthenticated) {
      return <LoginView onLoginSuccess={() => { }} />;
    }

    switch (currentScreen) {
      case 'login':
        return <LoginView onLoginSuccess={() => { }} />;
      case 'dashboard':
        return <DashboardView onNavigate={onNavigate} />;
      case 'chocadas_lista':
        return <ChocadasListaView onNavigate={onNavigate} />;
      case 'chocada_detalhes':
        return <ChocadaDetalhesView onNavigate={onNavigate} id={screenParams?.id || ''} />;
      case 'chocada_nova':
        return currentUser?.role === 'LEITOR' ? <DashboardView onNavigate={onNavigate} /> : <ChocadaNovaView onNavigate={onNavigate} />;
      case 'chocada_editar':
        return currentUser?.role === 'LEITOR' ? <DashboardView onNavigate={onNavigate} /> : <ChocadaNovaView onNavigate={onNavigate} idToEdit={screenParams?.id} />;
      case 'registro_diario_novo':
        return currentUser?.role === 'LEITOR' ? <DashboardView onNavigate={onNavigate} /> : <RegistroDiarioNovoView onNavigate={onNavigate} id={screenParams?.id || ''} />;
      case 'ovoscopia_nova':
        return currentUser?.role === 'LEITOR' ? <DashboardView onNavigate={onNavigate} /> : <OvoscopiaNovaView onNavigate={onNavigate} id={screenParams?.id || ''} />;
      case 'nascimento_novo':
        return currentUser?.role === 'LEITOR' ? <DashboardView onNavigate={onNavigate} /> : <RegistroNascimentoView onNavigate={onNavigate} id={screenParams?.id || ''} />;
      case 'relatorio_chocada':
        return <ReportView onNavigate={onNavigate} id={screenParams?.id || ''} />;
      case 'relatorios_gerais':
      case 'historico_geral':
        return <RelatoriosGeraisView onNavigate={onNavigate} />;
      case 'alertas':
        return <AlertasFeedView onNavigate={onNavigate} />;
      case 'configuracoes':
        return <ConfiguracoesView onNavigate={onNavigate} />;
      case 'chocadeiras_lista':
        return <ChocadeirasListaView onNavigate={onNavigate} />;
      case 'chocadeira_nova':
        return <ChocadeiraNovaView onNavigate={onNavigate} idToEdit={screenParams?.id} />;
      case 'propriedade_editar':
        return <PropriedadeEditarView onNavigate={onNavigate} />;
      case 'usuarios_lista':
        return <UsuariosListaView onNavigate={onNavigate} />;
      case 'usuario_novo':
        return <UsuarioNovoView onNavigate={onNavigate} />;
      default:
        return <DashboardView onNavigate={onNavigate} />;
    }
  };

  // Set the bottom tabs to correspond with the screen name to highlight
  const getSelectedTab = () => {
    if (['dashboard'].includes(currentScreen)) return 'dashboard';
    if (['chocadas_lista', 'chocada_detalhes', 'chocada_nova', 'chocada_editar', 'registro_diario_novo', 'ovoscopia_nova', 'nascimento_novo', 'relatorio_chocada'].includes(currentScreen)) return 'chocadas_lista';
    if (['alertas'].includes(currentScreen)) return 'alertas';
    if (['relatorios_gerais', 'historico_geral'].includes(currentScreen)) return 'relatorios_gerais';
    if (['configuracoes', 'chocadeiras_lista', 'chocadeira_nova', 'propriedade_editar'].includes(currentScreen)) return 'configuracoes';
    return '';
  };

  const selectedTab = getSelectedTab();

  // Se não estiver logado, exibe apenas a tela de login cheia
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-slate-100 flex flex-col justify-between relative overflow-hidden">
        {renderScreenContent()}
      </div>
    );
  }

  // Se estiver logado, exibe o painel administrativo responsivo
  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col lg:flex-row overflow-hidden font-sans">

      {/* 1. SIDEBAR DE DESKTOP (Visível apenas em telas grandes lg:) */}
      <aside className="hidden lg:flex lg:w-64 bg-slate-950 border-r border-sky-950/40 flex-col justify-between shrink-0 select-none">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-sky-950/30 flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20 shadow-[0_0_15px_rgba(125,211,252,0.15)]">
              <Egg className="w-5 h-5 text-sky-400 fill-sky-400/10" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-100 tracking-tight leading-none">Laranjeiras</h1>
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Chocadeiras</span>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="p-4 space-y-1.5 flex-1">
            <span className="px-3 text-[10px] font-bold text-sky-400/60 uppercase tracking-widest block mb-2">Painel Geral</span>

            <button
              onClick={() => onNavigate('dashboard')}
              className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'dashboard'
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/20 shadow-[0_0_10px_rgba(125,211,252,0.05)]'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-transparent'
                }`}
            >
              <Home className="w-4 h-4" />
              <span>Início / Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('chocadas_lista')}
              className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'chocadas_lista'
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/20 shadow-[0_0_10px_rgba(125,211,252,0.05)]'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-transparent'
                }`}
            >
              <Egg className="w-4 h-4" />
              <span>Ciclos de Chocadas</span>
            </button>

            <button
              onClick={() => onNavigate('alertas')}
              className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'alertas'
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/20 shadow-[0_0_10px_rgba(125,211,252,0.05)]'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-transparent'
                }`}
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                <span>🔔</span>
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full"></div>
              </div>
              <span>Feed de Alertas</span>
            </button>

            <button
              onClick={() => onNavigate('relatorios_gerais')}
              className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'relatorios_gerais'
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/20 shadow-[0_0_10px_rgba(125,211,252,0.05)]'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-transparent'
                }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">📈</div>
              <span>Relatórios Gerais</span>
            </button>

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('configuracoes')}
                className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'configuracoes'
                    ? 'bg-sky-500/10 text-sky-300 border-sky-500/20 shadow-[0_0_10px_rgba(125,211,252,0.05)]'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-transparent'
                  }`}
              >
                <Settings className="w-4 h-4" />
                <span>Ajustes & Configurações</span>
              </button>
            )}

            {currentUser?.role !== 'LEITOR' && (
              <div className="pt-4 border-t border-sky-950/20 mt-4">
                <span className="px-3 text-[10px] font-bold text-sky-400/60 uppercase tracking-widest block mb-2">Cadastros</span>

                <button
                  onClick={() => onNavigate('chocadeiras_lista')}
                  className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-3 border ${currentScreen === 'chocadeiras_lista' || currentScreen === 'chocadeira_nova'
                      ? 'text-sky-300 bg-white/5 border-sky-500/10'
                      : 'text-slate-400 hover:text-slate-250 border-transparent'
                    }`}
                >
                  <div className="w-3.5 h-3.5 flex items-center justify-center">🛠️</div>
                  <span>Chocadeiras</span>
                </button>

                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => onNavigate('propriedade_editar')}
                    className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-3 border ${currentScreen === 'propriedade_editar'
                        ? 'text-sky-300 bg-white/5 border-sky-500/10'
                        : 'text-slate-400 hover:text-slate-250 border-transparent'
                      }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Propriedade</span>
                  </button>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-sky-950/30 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-sky-400/20">
              <img
                alt="Perfil"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=200"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-100 truncate leading-none">{currentUser?.username || 'Usuário'}</h4>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">{currentUser?.role || 'Acesso Limitado'}</span>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              setCurrentScreen('dashboard');
            }}
            className="w-full py-2 bg-slate-900 border border-sky-500/10 hover:border-[#ff6b6b]/30 rounded-xl hover:text-[#ff6b6b] transition-all uppercase text-[9px] font-mono cursor-pointer text-slate-400 text-center flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3 h-3" /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* 2. AREA PRINCIPAL DO SISTEMA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Cabeçalho para telas móveis (lg:hidden) */}
        <header className="lg:hidden bg-slate-950 border-b border-sky-950/40 py-3.5 px-5 flex justify-between items-center shrink-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-sky-500/10 rounded-lg flex items-center justify-center border border-sky-400/20">
              <Egg className="w-4 h-4 text-sky-400 fill-sky-400/10" />
            </div>
            <span className="text-xs font-extrabold text-slate-100 tracking-wider uppercase">Glacier Chocadeiras</span>
          </div>

          <button
            onClick={() => {
              logout();
              setCurrentScreen('dashboard');
            }}
            className="px-2 py-1 bg-slate-900 border border-sky-400/10 rounded text-[9px] font-mono text-slate-400 hover:text-[#ff6b6b]"
          >
            Sair
          </button>
        </header>

        {/* Viewport Renderizado */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#0a0e1a] relative overflow-hidden">
          {renderScreenContent()}
        </main>

        {/* 3. BARRA DE NAVEGAÇÃO INFERIOR PARA MOBILE (lg:hidden) */}
        {isAuthenticated && currentScreen !== 'login' && (
          <nav className="lg:hidden h-16 bg-slate-950/90 border-t border-sky-950/50 backdrop-blur-md flex justify-around items-center px-2 select-none z-30 shrink-0">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${selectedTab === 'dashboard' ? 'text-sky-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-350'
                }`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="text-[9px] uppercase tracking-wider">Início</span>
            </button>

            <button
              onClick={() => onNavigate('chocadas_lista')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${selectedTab === 'chocadas_lista' ? 'text-sky-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-350'
                }`}
            >
              <Egg className="w-5 h-5 mb-1" />
              <span className="text-[9px] uppercase tracking-wider">Chocadas</span>
            </button>

            <button
              onClick={() => onNavigate('alertas')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer relative ${selectedTab === 'alertas' ? 'text-sky-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-350'
                }`}
            >
              <div className="w-5 h-5 mb-1 flex items-center justify-center relative">
                <span className="text-sm font-semibold leading-none">🔔</span>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff6b6b] rounded-full"></div>
              </div>
              <span className="text-[9px] uppercase tracking-wider">Alertas</span>
            </button>

            <button
              onClick={() => onNavigate('relatorios_gerais')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${selectedTab === 'relatorios_gerais' ? 'text-sky-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-350'
                }`}
            >
              <div className="w-5 h-5 mb-1 flex items-center justify-center">📈</div>
              <span className="text-[9px] uppercase tracking-wider">Relatórios</span>
            </button>

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('configuracoes')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${selectedTab === 'configuracoes' ? 'text-sky-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-350'
                  }`}
              >
                <Settings className="w-5 h-5 mb-1" />
                <span className="text-[9px] uppercase tracking-wider">Ajustes</span>
              </button>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
