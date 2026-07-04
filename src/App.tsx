/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home, Egg, Settings, Landmark, LogOut, Bell, ChartNoAxesCombined, Wrench } from 'lucide-react';
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
  UsuarioNovoView,
  AjusteEstoqueView
} from './components/SettingsViews';
import { ReportView } from './components/ReportView';
import { FinanceiroView } from './components/FinanceiroViews';

export default function App() {
  const { currentUser, logout, isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [screenParams, setScreenParams] = useState<any>(null);
  const [fullWidth, setFullWidth] = useState<boolean>(false);
  const [dbResetCounter, setDbResetCounter] = useState(0);
  const [dbLoading, setDbLoading] = useState(true);

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
      <div className="min-h-screen bg-[#f7f2e9] flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-[#3f5f31]/10 rounded-full flex items-center justify-center border border-[#3f5f31]/20 shadow-sm animate-pulse">
          <Egg className="w-10 h-10 text-[#3f5f31] fill-[#3f5f31]/10" />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold text-[#263225] font-headline tracking-tight">
            {isLoading ? "Iniciando Laranjeiras..." : "Sincronizando Nuvem..."}
          </h2>
          <p className="text-xs text-[#5f6659] uppercase tracking-widest mt-2 font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#3f5f31] rounded-full animate-ping"></span>
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
      <div className="min-h-screen bg-[#f7f2e9] text-slate-900 flex flex-col justify-between relative overflow-hidden">
        {renderScreenContent()}
      </div>
    );
  }

  // Se estiver logado, exibe o painel administrativo responsivo
  return (
    <div className="min-h-screen bg-[#f7f2e9] text-slate-900 flex flex-col lg:flex-row overflow-hidden font-sans">

      {/* 1. SIDEBAR DE DESKTOP (Visível apenas em telas grandes lg:) */}
      <aside className="hidden lg:flex lg:w-72 bg-[#fffaf2] border-r border-[#465336]/15 flex-col justify-between shrink-0 select-none">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-[#465336]/10 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3f5f31] rounded-xl flex items-center justify-center shadow-sm">
              <Egg className="w-5 h-5 text-[#fffaf2]" />
            </div>
            <div>
              <h1 className="text-sm font-black text-[#263225] tracking-tight leading-none">Laranjeiras</h1>
              <span className="text-[10px] text-[#6f756a] font-bold uppercase tracking-widest">Chocadeiras</span>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="p-4 space-y-1.5 flex-1">
            <span className="px-3 text-[10px] font-bold text-[#6f756a] uppercase tracking-widest block mb-2">Painel Geral</span>

            <button
              onClick={() => onNavigate('dashboard')}
              className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'dashboard'
                  ? 'bg-[#3f5f31] text-[#fffaf2] border-[#3f5f31] shadow-sm'
                  : 'text-[#5f6659] hover:bg-[#f1eadf] hover:text-[#263225] border-transparent'
                }`}
            >
              <Home className="w-4 h-4" />
              <span>Início / Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('chocadas_lista')}
              className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'chocadas_lista'
                  ? 'bg-[#3f5f31] text-[#fffaf2] border-[#3f5f31] shadow-sm'
                  : 'text-[#5f6659] hover:bg-[#f1eadf] hover:text-[#263225] border-transparent'
                }`}
            >
              <Egg className="w-4 h-4" />
              <span>Ciclos de Chocadas</span>
            </button>

            <button
              onClick={() => onNavigate('alertas')}
              className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'alertas'
                  ? 'bg-[#3f5f31] text-[#fffaf2] border-[#3f5f31] shadow-sm'
                  : 'text-[#5f6659] hover:bg-[#f1eadf] hover:text-[#263225] border-transparent'
                }`}
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                <Bell className="w-4 h-4" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#b85745] rounded-full"></div>
              </div>
              <span>Feed de Alertas</span>
            </button>

            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERADOR') && (
              <button
                onClick={() => onNavigate('financeiro')}
                className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'financeiro'
                    ? 'bg-[#3f5f31] text-[#fffaf2] border-[#3f5f31] shadow-sm'
                    : 'text-[#5f6659] hover:bg-[#f1eadf] hover:text-[#263225] border-transparent'
                  }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Financeiro</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('relatorios_gerais')}
              className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'relatorios_gerais'
                  ? 'bg-[#3f5f31] text-[#fffaf2] border-[#3f5f31] shadow-sm'
                  : 'text-[#5f6659] hover:bg-[#f1eadf] hover:text-[#263225] border-transparent'
                }`}
            >
              <ChartNoAxesCombined className="w-4 h-4" />
              <span>Relatórios Gerais</span>
            </button>

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('configuracoes')}
                className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 border ${selectedTab === 'configuracoes'
                    ? 'bg-[#3f5f31] text-[#fffaf2] border-[#3f5f31] shadow-sm'
                    : 'text-[#5f6659] hover:bg-[#f1eadf] hover:text-[#263225] border-transparent'
                  }`}
              >
                <Settings className="w-4 h-4" />
                <span>Ajustes & Configurações</span>
              </button>
            )}

            {currentUser?.role !== 'LEITOR' && (
              <div className="pt-4 border-t border-[#465336]/10 mt-4">
                <span className="px-3 text-[10px] font-bold text-[#6f756a] uppercase tracking-widest block mb-2">Cadastros</span>

                <button
                  onClick={() => onNavigate('chocadeiras_lista')}
                  className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-3 border ${currentScreen === 'chocadeiras_lista' || currentScreen === 'chocadeira_nova'
                      ? 'text-[#3f5f31] bg-[#3f5f31]/10 border-[#3f5f31]/10'
                      : 'text-[#5f6659] hover:text-[#263225] border-transparent'
                    }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Chocadeiras</span>
                </button>

                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => onNavigate('propriedade_editar')}
                    className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-3 border ${currentScreen === 'propriedade_editar'
                        ? 'text-[#3f5f31] bg-[#3f5f31]/10 border-[#3f5f31]/10'
                        : 'text-[#5f6659] hover:text-[#263225] border-transparent'
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
        <div className="p-4 border-t border-[#465336]/10 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#465336]/15">
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
            className="w-full py-2 bg-[#f1eadf] border border-[#465336]/10 hover:border-[#b85745]/30 rounded-xl hover:text-[#b85745] transition-all uppercase text-[9px] font-mono cursor-pointer text-[#5f6659] text-center flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3 h-3" /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* 2. AREA PRINCIPAL DO SISTEMA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Cabeçalho para telas móveis (lg:hidden) */}
        <header className="lg:hidden bg-[#fffaf2] border-b border-[#465336]/15 py-3.5 px-5 flex justify-between items-center shrink-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#3f5f31] rounded-lg flex items-center justify-center">
              <Egg className="w-4 h-4 text-[#fffaf2]" />
            </div>
            <span className="text-xs font-extrabold text-[#263225] tracking-wider uppercase">Laranjeiras</span>
          </div>

          <button
            onClick={() => {
              logout();
              setCurrentScreen('dashboard');
            }}
            className="px-2 py-1 bg-[#f1eadf] border border-[#465336]/10 rounded text-[9px] font-mono text-[#5f6659] hover:text-[#b85745]"
          >
            Sair
          </button>
        </header>

        {/* Viewport Renderizado */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#f7f2e9] relative overflow-hidden">
          {renderScreenContent()}
        </main>

        {/* 3. BARRA DE NAVEGAÇÃO INFERIOR PARA MOBILE (lg:hidden) */}
        {isAuthenticated && currentScreen !== 'login' && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 min-h-16 bg-[#fffaf2]/95 border-t border-[#465336]/15 backdrop-blur-md grid grid-flow-col auto-cols-fr items-stretch px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] select-none z-50 shadow-[0_-10px_30px_rgba(38,50,37,0.12)]">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all cursor-pointer ${selectedTab === 'dashboard' ? 'text-[#3f5f31] font-bold bg-[#3f5f31]/8' : 'text-[#7b8075] hover:text-[#263225]'
                }`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Início</span>
            </button>

            <button
              onClick={() => onNavigate('chocadas_lista')}
              className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all cursor-pointer ${selectedTab === 'chocadas_lista' ? 'text-[#3f5f31] font-bold bg-[#3f5f31]/8' : 'text-[#7b8075] hover:text-[#263225]'
                }`}
            >
              <Egg className="w-5 h-5 mb-1" />
              <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Chocadas</span>
            </button>

            <button
              onClick={() => onNavigate('alertas')}
              className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all cursor-pointer relative ${selectedTab === 'alertas' ? 'text-[#3f5f31] font-bold bg-[#3f5f31]/8' : 'text-[#7b8075] hover:text-[#263225]'
                }`}
            >
              <div className="w-5 h-5 mb-1 flex items-center justify-center relative">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#b85745] rounded-full"></div>
              </div>
              <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Alertas</span>
            </button>

            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERADOR') && (
              <button
                onClick={() => onNavigate('financeiro')}
                className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all cursor-pointer ${selectedTab === 'financeiro' ? 'text-[#3f5f31] font-bold bg-[#3f5f31]/8' : 'text-[#7b8075] hover:text-[#263225]'
                  }`}
              >
                <Landmark className="w-5 h-5 mb-1" />
                <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Financeiro</span>
              </button>
            )}

            {currentUser?.role === 'LEITOR' && (
              <button
                onClick={() => onNavigate('relatorios_gerais')}
                className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all cursor-pointer ${selectedTab === 'relatorios_gerais' ? 'text-[#3f5f31] font-bold bg-[#3f5f31]/8' : 'text-[#7b8075] hover:text-[#263225]'
                  }`}
              >
                <ChartNoAxesCombined className="w-5 h-5 mb-1" />
                <span className="max-w-full truncate text-[8px] min-[380px]:text-[9px] uppercase tracking-wider">Relatórios</span>
              </button>
            )}

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('configuracoes')}
                className={`min-w-0 flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all cursor-pointer ${selectedTab === 'configuracoes' ? 'text-[#3f5f31] font-bold bg-[#3f5f31]/8' : 'text-[#7b8075] hover:text-[#263225]'
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
