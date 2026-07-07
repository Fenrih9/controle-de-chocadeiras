/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Home, Egg, Settings, Landmark, LogOut, Bell, ChartNoAxesCombined, Wrench, Moon, Sun } from 'lucide-react';
import { repo } from './repository';
import { useAuth } from './contexts/AuthContext';
import { AnimatedPage } from './components/GlacierUI';


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
  UsuariosListaView,
  UsuarioNovoView,
  AjusteEstoqueView
} from './components/SettingsViews';
import { ReportsView } from './components/ReportsView';
import { ReportView } from './components/ReportView';
import { FinanceiroView } from './components/FinanceiroViews';

export default function App() {
  const { currentUser, logout, isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [screenParams, setScreenParams] = useState<any>(null);
  const [fullWidth, setFullWidth] = useState<boolean>(false);
  const [dbResetCounter, setDbResetCounter] = useState(0);
  const [dbLoading, setDbLoading] = useState(true);
  
  // 🌗 Dark Mode
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('chocadeiras-theme', next);
  };

  useEffect(() => {
    // Disable transitions on first load to avoid flash
    document.documentElement.classList.add('no-transition');
    const saved = localStorage.getItem('chocadeiras-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial as 'light' | 'dark');
    document.documentElement.setAttribute('data-theme', initial);
    // Re-enable transitions after a small delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-transition');
      });
    });
  }, []);

  const [dataVersion, setDataVersion] = useState(0);

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

  // Sincroniza dados com o Supabase apenas se o usuário estiver logado
  useEffect(() => {
    if (isAuthenticated) {
      if (repo.hasLocalData()) {
        // Se já possui dados locais salvos no cache, não bloqueia a tela de carregamento (Stale-While-Revalidate)
        setDbLoading(false);
        repo.loadFromSupabase()
          .then(() => {
            // Força atualização de re-renderização com dados atualizados do banco
            setDataVersion(prev => prev + 1);
          })
          .catch((err) => {
            console.error('Erro na revalidação de dados em segundo plano:', err);
          });
      } else {
        // Primeira carga absoluta: exibe tela de carregamento
        setDbLoading(true);
        repo.loadFromSupabase()
          .then(() => {
            setDbLoading(false);
            setDataVersion(prev => prev + 1);
          })
          .catch((err) => {
            console.error('Erro ao sincronizar nuvem:', err);
            setDbLoading(false);
          });
      }
    } else {
      setDbLoading(false);
    }
  }, [isAuthenticated, dbResetCounter]);

  if (isLoading || (isAuthenticated && dbLoading)) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-[var(--color-brand)] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <Egg className="w-10 h-10 text-white" />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold text-[var(--color-ink)] font-headline tracking-tight">
            {isLoading ? "Iniciando Laranjeiras..." : "Sincronizando Nuvem..."}
          </h2>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-widest mt-2 font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full animate-ping"></span>
            Carregando informações
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
        return <ReportsView onNavigate={onNavigate} />;
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
      case 'ajuste_estoque':
        return currentUser?.role === 'ADMIN' ? <AjusteEstoqueView onNavigate={onNavigate} /> : <DashboardView onNavigate={onNavigate} />;
      case 'usuarios_lista':
        return <UsuariosListaView onNavigate={onNavigate} />;
      case 'usuario_novo':
        return <UsuarioNovoView onNavigate={onNavigate} />;
      case 'financeiro':
        return <FinanceiroView onNavigate={onNavigate} />;
      default:
        return <DashboardView onNavigate={onNavigate} />;
    }
  };

  // Set the bottom tabs to correspond with the screen name to highlight
  const getSelectedTab = () => {
    if (['dashboard'].includes(currentScreen)) return 'dashboard';
    if (['financeiro'].includes(currentScreen)) return 'financeiro';
    if (['chocadas_lista', 'chocada_detalhes', 'chocada_nova', 'chocada_editar', 'registro_diario_novo', 'ovoscopia_nova', 'nascimento_novo', 'relatorio_chocada'].includes(currentScreen)) return 'chocadas_lista';
    if (['alertas'].includes(currentScreen)) return 'alertas';
    if (['relatorios_gerais', 'historico_geral'].includes(currentScreen)) return 'relatorios_gerais';
    if (['configuracoes', 'chocadeiras_lista', 'chocadeira_nova', 'propriedade_editar', 'ajuste_estoque'].includes(currentScreen)) return 'configuracoes';
    return '';
  };

  const selectedTab = getSelectedTab();

  // Se não estiver logado, exibe apenas a tela de login cheia
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col justify-between relative overflow-hidden">
        {renderScreenContent()}
      </div>
    );
  }

  // Se estiver logado, exibe o painel administrativo responsivo
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col lg:flex-row overflow-hidden font-sans">

      {/* 1. SIDEBAR DE DESKTOP (Visível apenas em telas grandes lg:) */}
      <aside className="hidden lg:flex lg:w-72 bg-[var(--color-surface)] border-r border-[var(--color-line)] flex-col justify-between shrink-0 select-none">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-[var(--color-line)] flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-brand)] rounded-xl flex items-center justify-center shadow-md">
              <Egg className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-[var(--color-brand)] tracking-tight leading-none">Laranjeiras</h1>
              <span className="text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-widest">Chocadeiras</span>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="p-4 space-y-1.5 flex-1">
            <span className="px-3 text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest block mb-2">Painel Geral</span>

            <button
              onClick={() => onNavigate('dashboard')}
              className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center gap-3 ${selectedTab === 'dashboard'
                  ? 'bg-[var(--color-brand)] text-white shadow-md'
                  : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]'
                }`}
            >
              <Home className="w-4 h-4" />
              <span>Início / Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('chocadas_lista')}
              className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center gap-3 ${selectedTab === 'chocadas_lista'
                  ? 'bg-[var(--color-brand)] text-white shadow-md'
                  : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]'
                }`}
            >
              <Egg className="w-4 h-4" />
              <span>Ciclos de Chocadas</span>
            </button>

            <button
              onClick={() => onNavigate('alertas')}
              className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center gap-3 ${selectedTab === 'alertas'
                  ? 'bg-[var(--color-brand)] text-white shadow-md'
                  : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]'
                }`}
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                <Bell className="w-4 h-4" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[var(--color-danger)] rounded-full"></div>
              </div>
              <span>Feed de Alertas</span>
            </button>

            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERADOR') && (
              <button
                onClick={() => onNavigate('financeiro')}
                className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center gap-3 ${selectedTab === 'financeiro'
                    ? 'bg-[var(--color-brand)] text-white shadow-md'
                    : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]'
                  }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Financeiro</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('relatorios_gerais')}
              className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center gap-3 ${selectedTab === 'relatorios_gerais'
                  ? 'bg-[var(--color-brand)] text-white shadow-md'
                  : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]'
                }`}
            >
              <ChartNoAxesCombined className="w-4 h-4" />
              <span>Relatórios Gerais</span>
            </button>

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('configuracoes')}
                className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center gap-3 ${selectedTab === 'configuracoes'
                    ? 'bg-[var(--color-brand)] text-white shadow-md'
                    : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]'
                  }`}
              >
                <Settings className="w-4 h-4" />
                <span>Ajustes & Configurações</span>
              </button>
            )}

            {currentUser?.role !== 'LEITOR' && (
              <div className="pt-4 border-t border-[var(--color-line)] mt-4">
                <span className="px-3 text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest block mb-2">Cadastros</span>

                <button
                  onClick={() => onNavigate('chocadeiras_lista')}
                  className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-3 border ${currentScreen === 'chocadeiras_lista' || currentScreen === 'chocadeira_nova'
                      ? 'text-[var(--color-brand)] bg-[var(--color-brand-soft)] border-[var(--color-brand)]/10'
                      : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] border-transparent'
                    }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Chocadeiras</span>
                </button>

                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => onNavigate('propriedade_editar')}
                    className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-3 border ${currentScreen === 'propriedade_editar'
                        ? 'text-[var(--color-brand)] bg-[var(--color-brand-soft)] border-[var(--color-brand)]/10'
                        : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] border-transparent'
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
        <div className="p-4 border-t border-[var(--color-line)] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--color-line)]">
              <img
                alt="Perfil"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=200"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-[var(--color-ink)] truncate leading-none">{currentUser?.username || 'Usuário'}</h4>
              <span className="text-[9px] text-[var(--color-muted)] font-bold uppercase tracking-wider block mt-0.5">{currentUser?.role || 'Acesso Limitado'}</span>
            </div>
            {/* 🌗 Toggle Tema */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              className="p-2 bg-[var(--color-surface-hover)] border border-[var(--color-line)] hover:border-[var(--color-brand)]/30 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-brand)] transition-all cursor-pointer shrink-0"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={() => {
              logout();
              setCurrentScreen('dashboard');
            }}
            className="w-full py-2 bg-[var(--color-surface-hover)] border border-[var(--color-line)] hover:border-[var(--color-danger)]/30 rounded-xl hover:text-[var(--color-danger)] transition-all uppercase text-[9px] font-mono cursor-pointer text-[var(--color-ink-secondary)] text-center flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3 h-3" /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* 2. AREA PRINCIPAL DO SISTEMA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Cabeçalho para telas móveis (lg:hidden) */}
        <header className="lg:hidden bg-[var(--color-surface)] border-b border-[var(--color-line)] py-3.5 px-5 flex justify-between items-center shrink-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--color-brand)] rounded-lg flex items-center justify-center shadow-md">
              <Egg className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-extrabold text-[var(--color-brand)] tracking-wider uppercase">Laranjeiras</span>
          </div>

          <div className="flex items-center gap-2">
            {/* 🌗 Toggle Tema Mobile */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              className="p-1.5 bg-[var(--color-surface-hover)] border border-[var(--color-line)] hover:border-[var(--color-brand)]/30 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-brand)] transition-all cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                logout();
                setCurrentScreen('dashboard');
              }}
              className="px-2 py-1 bg-[var(--color-surface-hover)] border border-[var(--color-line)] rounded text-[9px] font-mono text-[var(--color-ink-secondary)] hover:text-[var(--color-danger)]"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Viewport Renderizado com animações */}
        <main className="flex-1 flex flex-col min-h-0 bg-[var(--color-bg)] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <AnimatedPage screenKey={currentScreen}>
              {renderScreenContent()}
            </AnimatedPage>
          </AnimatePresence>
        </main>

        {/* 3. BARRA DE NAVEGAÇÃO INFERIOR PARA MOBILE (lg:hidden) */}
        {isAuthenticated && currentScreen !== 'login' && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 min-h-16 bg-[var(--color-surface)]/95 border-t border-[var(--color-line)] backdrop-blur-md grid grid-flow-col auto-cols-fr items-stretch px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] select-none z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.10)]">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-200 cursor-pointer ${selectedTab === 'dashboard' ? 'text-[var(--color-brand)] font-bold bg-[var(--color-brand-soft)]' : 'text-[var(--color-muted)] hover:text-[var(--color-brand)]'
                }`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Início</span>
            </button>

            <button
              onClick={() => onNavigate('chocadas_lista')}
              className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-200 cursor-pointer ${selectedTab === 'chocadas_lista' ? 'text-[var(--color-brand)] font-bold bg-[var(--color-brand-soft)]' : 'text-[var(--color-muted)] hover:text-[var(--color-brand)]'
                }`}
            >
              <Egg className="w-5 h-5 mb-1" />
              <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Chocadas</span>
            </button>

            <button
              onClick={() => onNavigate('alertas')}
              className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-200 cursor-pointer relative ${selectedTab === 'alertas' ? 'text-[var(--color-brand)] font-bold bg-[var(--color-brand-soft)]' : 'text-[var(--color-muted)] hover:text-[var(--color-brand)]'
                }`}
            >
              <div className="w-5 h-5 mb-1 flex items-center justify-center relative">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-danger)] rounded-full"></div>
              </div>
              <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Alertas</span>
            </button>

            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERADOR') && (
              <button
                onClick={() => onNavigate('financeiro')}
                className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-200 cursor-pointer ${selectedTab === 'financeiro' ? 'text-[var(--color-brand)] font-bold bg-[var(--color-brand-soft)]' : 'text-[var(--color-muted)] hover:text-[var(--color-brand)]'
                  }`}
              >
                <Landmark className="w-5 h-5 mb-1" />
                <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Financeiro</span>
              </button>
            )}

            {currentUser?.role === 'LEITOR' && (
              <button
                onClick={() => onNavigate('relatorios_gerais')}
                className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-200 cursor-pointer ${selectedTab === 'relatorios_gerais' ? 'text-[var(--color-brand)] font-bold bg-[var(--color-brand-soft)]' : 'text-[var(--color-muted)] hover:text-[var(--color-brand)]'
                  }`}
              >
                <ChartNoAxesCombined className="w-5 h-5 mb-1" />
                <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Relatórios</span>
              </button>
            )}

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('configuracoes')}
                className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-200 cursor-pointer ${selectedTab === 'configuracoes' ? 'text-[var(--color-brand)] font-bold bg-[var(--color-brand-soft)]' : 'text-[var(--color-muted)] hover:text-[var(--color-brand)]'
                  }`}
              >
                <Settings className="w-5 h-5 mb-1" />
                <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Ajustes</span>
              </button>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
