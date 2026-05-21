/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Smartphone, Monitor, ShieldCheck, RefreshCw, Layers } from 'lucide-react';

interface PhoneSimulatorProps {
  children: React.ReactNode;
  currentScreen: string;
  onScreenJump: (screenName: string, params?: any) => void;
  fullWidth: boolean;
  setFullWidth: (val: boolean) => void;
  onResetDB: () => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  children,
  currentScreen,
  onScreenJump,
  fullWidth,
  setFullWidth,
  onResetDB,
}) => {
  // Ordered navigation list representing the 18 mandatory screens from the spec
  const screenJumps = [
    { code: 'login', label: '1. Entrada / Login' },
    { code: 'dashboard', label: '2. Dashboard (Início)' },
    { code: 'chocadas_lista', label: '3. Lista de Chocadas' },
    { code: 'chocada_nova', label: '4. Cadastro Nova Chocada' },
    { code: 'chocada_detalhes', label: '6. Detalhes da Chocada', params: { id: 'cho-4' } },
    { code: 'chocada_editar', label: '5. Edição de Chocada', params: { id: 'cho-4' } },
    { code: 'registro_diario_novo', label: '7. Criar Registro Diário', params: { id: 'cho-4' } },
    { code: 'registros_diarios_lista', label: '8. Histórico Reg. Diários', params: { id: 'cho-4' } },
    { code: 'ovoscopia_nova', label: '9. Registrar Ovoscopia', params: { id: 'cho-4' } },
    { code: 'ovoscopias_lista', label: '10. Histórico Ovoscopias', params: { id: 'cho-4' } },
    { code: 'nascimento_novo', label: '11. Registro Nascimento', params: { id: 'cho-4' } },
    { code: 'relatorio_chocada', label: '12. Relatório de Chocada', params: { id: 'cho-4' } },
    { code: 'relatorios_gerais', label: '13. Relatórios Gerais' },
    { code: 'historico_geral', label: '14. Histórico Geral (Lotes)' },
    { code: 'alertas', label: '15. Feed de Alertas' },
    { code: 'configuracoes', label: '16. Configurações / Ajustes' },
    { code: 'chocadeiras_lista', label: '17. Lista de Chocadeiras' },
    { code: 'chocadeira_nova', label: '18. Cadastro Chocadeira' },
    { code: 'propriedade_editar', label: '19. Dados da Propriedade' },
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col">
      {/* Top Universal Header */}
      <header className="bg-slate-950/80 border-b border-sky-950/40 py-3.5 px-6 flex justify-between items-center shrink-0 z-50 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-sky-400" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-sky-300">
              Chocadeiras Glacier — Simulador de Aplicativo Mobile
            </h1>
            <p className="text-[10px] text-slate-500 font-mono">
              MVP Baseado em Jetpack Compose • Kotlin • Room DB
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onResetDB}
            title="Resetar Banco Local"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-sky-400/20 rounded-lg hover:border-sky-400/40 transition-colors uppercase text-[10px] font-mono hover:text-sky-300 cursor-pointer text-slate-400"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Resetar DB
          </button>
          
          <button
            onClick={() => setFullWidth(!fullWidth)}
            title={fullWidth ? "Ver em celular simulado" : "Ver tela inteira no navegador"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-sky-400/20 rounded-lg hover:border-sky-400/40 transition-colors uppercase text-[10px] font-mono hover:text-sky-300 cursor-pointer text-slate-400"
          >
            {fullWidth ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            {fullWidth ? "Modo Celular" : "Tela Inteira"}
          </button>
        </div>
      </header>
      
      {/* Simulation Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Aux Quick Nav Panel */}
        {!fullWidth && (
          <aside className="w-80 border-r border-sky-950/40 bg-slate-950/40 overflow-y-auto p-5 hidden lg:block select-none shrink-0 scrollbar-thin">
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400/80 mb-1">
                Atalhos do Protótipo
              </h2>
              <p className="text-xs text-slate-400 leading-snug">
                Selecione abaixo para alternar instantaneamente entre qualquer uma das 18 telas exigidas pelo escopo técnico.
              </p>
            </div>
            
            <div className="space-y-1">
              {screenJumps.map((scr) => {
                const isActive = currentScreen === scr.code;
                return (
                  <button
                    key={scr.code}
                    onClick={() => onScreenJump(scr.code, scr.params)}
                    className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-300 border border-sky-400/30 shadow-[0_0_12px_rgba(125,211,252,0.05)]'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <span>{scr.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>}
                  </button>
                );
              })}
            </div>
          </aside>
        )}
        
        {/* Celular Viewport Containment Wrapper */}
        <div className="flex-grow flex items-center justify-center p-4 bg-[#05080e] overflow-auto">
          {fullWidth ? (
            <div className="w-full max-w-xl h-full flex flex-col bg-[#0a0e1a] overflow-hidden relative">
              {children}
            </div>
          ) : (
            /* Elegant high-precision Smartphone mockup frame */
            <div 
              className="relative rounded-[40px] bg-slate-950 p-[14px] border-[5px] border-slate-900 shadow-2xl flex flex-col overflow-hidden"
              style={{
                width: '390px',
                height: '840px',
                outline: '1px solid rgba(125, 211, 252, 0.08)'
              }}
            >
              {/* Internal Bezel Notch speaker capsule */}
              <div className="absolute top-[21px] left-1/2 -translate-x-1/2 w-32 h-6 bg-black z-[1000] rounded-full flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-900 rounded-full mb-1"></div>
                <div className="absolute top-1 right-5 w-1.5 h-1.5 bg-[#061c31]/60 rounded-full"></div>
              </div>
              
              {/* Dynamic status indicators bar */}
              <div className="h-7 bg-slate-950/80 shrink-0 text-[11px] font-bold text-slate-200 flex items-center justify-between px-6 select-none z-[1000]">
                <span>12:00</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3 h-3 text-sky-400" />
                  <span className="text-[10px] text-sky-400 uppercase font-mono">SQLite Room</span>
                  <span>100%</span>
                </div>
              </div>
              
              {/* Screen Content Render */}
              <div className="flex-1 overflow-hidden relative rounded-[28px] bg-[#0a0e1a]">
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
