/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, ChevronRight, Clock } from 'lucide-react';
import { repo } from '../repository';
import { Notificacao } from '../types';
import { severityConfig, timeAgo } from './notificacoes-utils';

interface NotificationBellProps {
  onNavigate: (screenName: string, params?: any) => void;
}

type FiltroAba = 'TODOS' | 'NAO_LIDOS';

const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [filtro, setFiltro] = useState<FiltroAba>('TODOS');
  const bellRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotificacoes = useCallback(() => {
    setNotificacoes([...repo.getNotificacoes()]);
  }, []);

  useEffect(() => {
    loadNotificacoes();
    const unsubscribe = repo.onNotificacoesChange(loadNotificacoes);
    return unsubscribe;
  }, [loadNotificacoes]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fechar ao pressionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const contagem = repo.getContagemNotificacoes();
  const temCritico = contagem.critico > 0;
  const badgeColor = temCritico ? 'bg-[var(--color-danger)]' : contagem.atencao > 0 ? 'bg-[var(--color-warning)]' : '';

  // Filtrar notificações
  const notificacoesFiltradas = notificacoes.filter(n => {
    if (filtro === 'NAO_LIDOS') return !n.lido;
    return true;
  });

  // Agrupar por severidade
  const grupos = {
    CRITICO: notificacoesFiltradas.filter(n => n.severidade === 'CRITICO'),
    ATENCAO: notificacoesFiltradas.filter(n => n.severidade === 'ATENCAO'),
    INFORMATIVO: notificacoesFiltradas.filter(n => n.severidade === 'INFORMATIVO'),
  };

  const handleMarcarTodasLidas = async () => {
    await repo.marcarTodasNotificacoesLidas();
  };

  const handleClicarNotificacao = async (notif: Notificacao) => {
    if (!notif.lido) {
      await repo.marcarNotificacaoLida(notif.id, true);
    }
    setIsOpen(false);
    if (notif.link_destino) {
      const params: any = {};
      if (notif.chocada_id) params.id = notif.chocada_id;
      onNavigate(notif.link_destino, params);
    }
  };

  const renderItem = (notif: Notificacao) => {
    const config = severityConfig[notif.severidade];
    const SeverityIcon = config.icon;

    return (
      <button
        key={notif.id}
        onClick={() => handleClicarNotificacao(notif)}
        className={`
          w-full text-left px-4 py-3.5 flex items-start gap-3 cursor-pointer
          transition-all duration-150 border-b border-[var(--color-line)] last:border-b-0
          hover:bg-[var(--color-surface-hover)] active:scale-[0.99]
          ${!notif.lido ? 'bg-[var(--color-brand-soft)]/30' : ''}
        `}
        aria-label={`${config.label}: ${notif.titulo}`}
      >
        {/* Indicador de não lido */}
        <div className="shrink-0 pt-0.5 flex flex-col items-center gap-1">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center`}
            style={{ backgroundColor: config.bgSoft }}
          >
            <SeverityIcon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          {!notif.lido && (
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
          )}
        </div>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-xs leading-tight ${!notif.lido ? 'font-extrabold' : 'font-semibold'} text-[var(--color-ink)]`}>
              {notif.titulo}
            </h4>
          </div>
          <p className="text-[11px] text-[var(--color-ink-secondary)] mt-1 leading-snug line-clamp-2">
            {notif.descricao}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="w-3 h-3 text-[var(--color-muted-light)]" />
            <span className="text-[10px] font-medium text-[var(--color-muted)]">
              {timeAgo(notif.timestamp_completo)}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
              style={{
                color: config.color,
                backgroundColor: config.bgSoft,
                borderColor: `${config.color}20`,
              }}
            >
              {config.label}
            </span>
          </div>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-[var(--color-muted-light)] shrink-0 mt-2" />
      </button>
    );
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* Ícone do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-xl border transition-all duration-200 cursor-pointer
          ${isOpen
            ? 'bg-[var(--color-brand-soft)] border-[var(--color-brand)]/30 text-[var(--color-brand)]'
            : 'bg-[var(--color-surface-hover)] border-[var(--color-line)] hover:border-[var(--color-brand)]/30 text-[var(--color-muted)] hover:text-[var(--color-brand)]'
          }
        `}
        aria-label={`Notificações${contagem.totalAcao > 0 ? `: ${contagem.totalAcao} pendentes` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="w-4 h-4" />
        {contagem.totalAcao > 0 && (
          <span
            className={`
              absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full
              flex items-center justify-center text-[10px] leading-none
              font-extrabold text-white shadow-md
              ${badgeColor}
              animate-fade-in
            `}
          >
            {contagem.totalAcao > 99 ? '99+' : contagem.totalAcao}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="dialog"
          aria-label="Painel de notificações"
          className={`
            absolute right-0 top-full mt-2 z-[60]
            w-[400px] max-w-[calc(100vw-32px)]
            bg-[var(--color-surface)] border border-[var(--color-line)]
            rounded-2xl shadow-[var(--shadow-elevated)]
            overflow-hidden
            animate-slide-up
          `}
          style={{ maxHeight: 'min(600px, calc(100vh - 120px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-line)]">
            <div>
              <h3 className="text-sm font-extrabold text-[var(--color-ink)]">Notificações</h3>
              {contagem.totalAcao > 0 && (
                <p className="text-[10px] text-[var(--color-muted)] font-medium mt-0.5">
                  {contagem.totalAcao} pendente{contagem.totalAcao !== 1 ? 's' : ''}
                  {contagem.informativo > 0 && ` · ${contagem.informativo} informativo${contagem.informativo !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>
            {contagem.totalAcao > 0 && (
              <button
                onClick={handleMarcarTodasLidas}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-brand-soft)] hover:bg-[var(--color-brand-soft-hover)] text-[var(--color-brand)] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Marcar todas</span>
              </button>
            )}
          </div>

          {/* Abas de filtro */}
          <div className="flex gap-1 px-4 pt-3 pb-1 border-b border-[var(--color-line)]">
            {(['TODOS', 'NAO_LIDOS'] as FiltroAba[]).map(aba => (
              <button
                key={aba}
                onClick={() => setFiltro(aba)}
                className={`
                  px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                  transition-all cursor-pointer
                  ${filtro === aba
                    ? 'bg-[var(--color-brand)] text-white shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
                  }
                `}
              >
                {aba === 'TODOS' ? 'Todos' : 'Não lidos'}
                {aba === 'NAO_LIDOS' && contagem.totalAcao + contagem.informativo > 0 && (
                  <span className="ml-1.5 opacity-70">({contagem.totalAcao + contagem.informativo})</span>
                )}
              </button>
            ))}
          </div>

          {/* Lista de notificações */}
          <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
            {/* Grupo: Crítico */}
            {grupos.CRITICO.length > 0 && (
              <div>
                <div className="sticky top-0 z-10 bg-[var(--color-surface)] px-4 py-2 border-b border-[var(--color-line)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: severityConfig.CRITICO.color }}>
                    🔴 Crítico ({grupos.CRITICO.length})
                  </span>
                </div>
                {grupos.CRITICO.map(renderItem)}
              </div>
            )}

            {/* Grupo: Atenção */}
            {grupos.ATENCAO.length > 0 && (
              <div>
                <div className="sticky top-0 z-10 bg-[var(--color-surface)] px-4 py-2 border-b border-[var(--color-line)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: severityConfig.ATENCAO.color }}>
                    🟠 Atenção ({grupos.ATENCAO.length})
                  </span>
                </div>
                {grupos.ATENCAO.map(renderItem)}
              </div>
            )}

            {/* Grupo: Informativo */}
            {grupos.INFORMATIVO.length > 0 && (
              <div>
                <div className="sticky top-0 z-10 bg-[var(--color-surface)] px-4 py-2 border-b border-[var(--color-line)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: severityConfig.INFORMATIVO.color }}>
                    🔵 Informativo ({grupos.INFORMATIVO.length})
                  </span>
                </div>
                {grupos.INFORMATIVO.map(renderItem)}
              </div>
            )}

            {/* Estado vazio */}
            {notificacoesFiltradas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <Bell className="w-10 h-10 text-[var(--color-muted-light)]/40 mb-3" />
                <p className="text-sm font-semibold text-[var(--color-muted)]">
                  {filtro === 'NAO_LIDOS' ? 'Nenhuma notificação pendente' : 'Nenhuma notificação'}
                </p>
                <p className="text-[11px] text-[var(--color-muted-light)] mt-1">
                  {filtro === 'NAO_LIDOS' ? 'Tudo em dia!' : 'As notificações aparecerão aqui.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--color-line)] px-4 py-3 bg-[var(--color-surface)]">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('alertas');
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--color-surface-hover)] hover:bg-[var(--color-brand-soft)] text-[var(--color-muted)] hover:text-[var(--color-brand)] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-[var(--color-line)] hover:border-[var(--color-brand)]/20"
            >
              <Clock className="w-3.5 h-3.5" />
              Ver histórico completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
