/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Settings, Landmark, Users, HardHat, Clock, FileChartLine, Save, MapPin, Phone, User, AlertOctagon, ChevronRight, TrendingUp, Pencil } from 'lucide-react';
import { repo } from '../repository';
import { Chocadeira, Propriedade, Usuario, Role, RegistroNascimento } from '../types';
import { Button, Card, Input, Select, ConfirmDialog, StatusChip } from './GlacierUI';
import { useAuth } from '../contexts/AuthContext';

// --- VIEW: ADJUSTS LISTING ---
interface SettingsViewsProps {
  onNavigate: (screenName: string, params?: any) => void;
}

export const ConfiguracoesView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const prop = useMemo(() => repo.getPropriedade(), []);

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-[var(--color-brand)]" />
          <h1 className="font-headline font-bold text-[var(--color-ink)] text-sm leading-tight">Configurações & Ajustes</h1>
        </div>
      </header>

      {/* Settings list scrolling */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 max-w-5xl mx-auto w-full">
        <div className="card-base p-4 flex items-center gap-3.5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand-soft)] to-transparent"></div>
          <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-soft)] border border-[var(--color-brand)]/20 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6 text-[var(--color-brand)]" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-[var(--color-brand)] uppercase tracking-widest block">Propriedade Conectada</span>
            <h4 className="font-bold text-[var(--color-ink)] truncate text-sm">{prop.nome}</h4>
            <p className="text-[10px] text-[var(--color-muted)] mt-0.5 truncate leading-none">Resp: {prop.responsavel}</p>
          </div>
        </div>

        <section className="space-y-2">
          <h3 className="text-[10px] font-bold tracking-widest text-[var(--color-brand)] uppercase ml-1">Divisões de Administração</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div 
              onClick={() => onNavigate('propriedade_editar')}
              className="card-base hover:bg-[var(--color-surface-hover)] p-4 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 text-[var(--color-ink)]">
                <Landmark className="w-5 h-5 text-[var(--color-brand)]" />
                <span className="text-xs font-semibold">Editar Dados da Propriedade</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-brand)] transition-colors" />
            </div>

            <div 
              onClick={() => onNavigate('chocadeiras_lista')}
              className="card-base hover:bg-[var(--color-surface-hover)] p-4 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 text-[var(--color-ink)]">
                <HardHat className="w-5 h-5 text-[var(--color-accent)]" />
                <span className="text-xs font-semibold">Cadastros de Chocadeiras</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
            </div>

            <div 
              onClick={() => onNavigate('usuarios_lista')}
              className="card-base hover:bg-[var(--color-surface-hover)] p-4 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 text-[var(--color-ink)]">
                <Users className="w-5 h-5 text-[var(--color-accent)]" />
                <span className="text-xs font-semibold">Contas e Usuários</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
            </div>

            <div 
              onClick={() => onNavigate('historico_geral')}
              className="card-base hover:bg-[var(--color-surface-hover)] p-4 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 text-[var(--color-ink)]">
                <Clock className="w-5 h-5 text-[var(--color-success)]" />
                <span className="text-xs font-semibold">Histórico Geral de Lotes (Concluídos)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-success)] transition-colors" />
            </div>
            
            <div 
              onClick={() => onNavigate('relatorios_gerais')}
              className="card-base hover:bg-[var(--color-surface-hover)] p-4 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 text-[var(--color-ink)]">
                <FileChartLine className="w-5 h-5 text-[var(--color-brand)]" />
                <span className="text-xs font-semibold">Relatório Geral Consolidado</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-brand)] transition-colors" />
            </div>

            {currentUser?.role === 'ADMIN' && (
              <div 
                onClick={() => onNavigate('ajuste_estoque')}
                className="card-base hover:bg-[var(--color-surface-hover)] p-4 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 text-[var(--color-ink)]">
                  <TrendingUp className="w-5 h-5 text-[var(--color-danger)]" />
                  <span className="text-xs font-semibold">Ajuste de Estoque (Manual)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-danger)] transition-colors" />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- VIEW: CHOCADEIRAS LISTA ---
const MemoizedChocadeiraCard = React.memo<{ chocada: Chocadeira; onNavigate: (screenName: string, params?: any) => void; onDelete: (id: string) => void }>(({ chocada, onNavigate, onDelete }) => (
  <div
    className="card-base p-4 flex gap-4 transition-all duration-300 relative items-center hover:shadow-[var(--shadow-card-hover)]"
  >
    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] shrink-0">
      <HardHat className="w-6 h-6" />
    </div>

    <div className="flex-grow min-w-0">
      <h4 className="font-bold text-[var(--color-ink)] text-sm truncate">{chocada.nome}</h4>
      <p className="text-[10px] text-[var(--color-muted)] uppercase mt-0.5 tracking-wider font-semibold truncate">
        Mod: {chocada.modelo} • Cap: {chocada.capacidadeMaximaOvos} ovos
      </p>
      <div className="flex items-center gap-2 mt-1.5 text-[10px] font-semibold text-[var(--color-muted)] uppercase leading-none">
        <span>Loc: {chocada.localizacao}</span>
        <span>•</span>
        <span className={chocada.status === 'Ativa' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
          {chocada.status}
        </span>
      </div>
    </div>

    <button
      onClick={() => onNavigate('chocadeira_nova', { id: chocada.id })}
      className="p-2.5 bg-[var(--color-surface-hover)] hover:bg-[var(--color-brand-soft)] text-[var(--color-muted)] hover:text-[var(--color-brand)] rounded-lg transition-colors cursor-pointer"
      title="Editar chocadeira"
    >
      <Pencil className="w-4 h-4" />
    </button>

    <button
      onClick={() => onDelete(chocada.id)}
      className="p-2.5 bg-[var(--color-surface-hover)] hover:bg-[var(--color-danger-soft)] text-[var(--color-muted)] hover:text-[var(--color-danger)] rounded-lg transition-colors cursor-pointer"
      title="Excluir chocadeira"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
));

export const ChocadeirasListaView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const [chocadeiras, setChocadeiras] = useState<Chocadeira[]>([]);
  const [delTarget, setDelTarget] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadChocadeiras = () => {
    setChocadeiras(repo.getChocadeiras());
  };

  useEffect(() => {
    loadChocadeiras();
  }, []);

  const handleConfirmDelete = async () => {
    if (delTarget) {
      setErrorMsg('');
      const res = await repo.deleteChocadeira(delTarget);
      if (res.success) {
        loadChocadeiras();
      } else {
        setErrorMsg(res.message);
      }
      setDelTarget(null);
    }
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('configuracoes')} className="p-1 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand)]/30 cursor-pointer select-none transition-all shadow-sm">
          Voltar
        </button>
        <span className="font-headline font-bold text-[var(--color-ink)] text-sm">Chocadeiras</span>
        <button 
          onClick={() => onNavigate('chocadeira_nova')}
          className="p-1.5 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-brand)]/30 rounded-xl text-[var(--color-brand)] hover:shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-3 scrollbar-thin pb-20 max-w-5xl mx-auto w-full">
        {errorMsg && (
          <div className="p-3 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 rounded-xl text-xs text-[var(--color-danger)] font-bold leading-normal">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {chocadeiras.map((ch) => (
            <MemoizedChocadeiraCard
              key={ch.id}
              chocada={ch}
              onNavigate={onNavigate}
              onDelete={setDelTarget}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={delTarget !== null}
        title="Excluir Chocadeira"
        message="Deseja realmente remover esta chocadeira das listas ativas? A exclusão será bloqueada se houver lotes, nascimentos ou lançamentos vinculados."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDelTarget(null)}
      />
    </div>
  );
};


interface ChocadeiraFormProps extends SettingsViewsProps {
  idToEdit?: string;
}

// --- VIEW: CADASTRO CHOCADEIRA ---
export const ChocadeiraNovaView: React.FC<ChocadeiraFormProps> = ({ onNavigate, idToEdit }) => {
  const [nome, setNome] = useState('');
  const [modelo, setModelo] = useState('');
  const [capacidade, setCapacidade] = useState<number>(100);
  const [localizacao, setLocalizacao] = useState('');
  const [status, setStatus] = useState('Ativa');
  const [observacoes, setObservacoes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!idToEdit) return;
    const existing = repo.getChocadeiraById(idToEdit);
    if (!existing) {
      setError('Chocadeira não encontrada.');
      return;
    }
    setNome(existing.nome);
    setModelo(existing.modelo);
    setCapacidade(existing.capacidadeMaximaOvos);
    setLocalizacao(existing.localizacao);
    setStatus(existing.status);
    setObservacoes(existing.observacoes);
  }, [idToEdit]);

  const handleSave = () => {
    if (!nome.trim() || !modelo.trim()) {
      setError('Nome e Modelo são obrigatórios.');
      return;
    }

    const existing = idToEdit ? repo.getChocadeiraById(idToEdit) : undefined;
    if (idToEdit && !existing) {
      setError('Chocadeira não encontrada para edição.');
      return;
    }
    const payload: Chocadeira = {
      id: existing?.id || '',
      nome,
      modelo,
      capacidadeMaximaOvos: capacidade,
      localizacao,
      status,
      observacoes,
      criadoEm: existing?.criadoEm || '',
      atualizadoEm: existing?.atualizadoEm || '',
      excluido: existing?.excluido ?? false
    };

    repo.saveChocadeira(payload);
    onNavigate('chocadeiras_lista');
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('chocadeiras_lista')} className="p-1 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand)]/30 cursor-pointer select-none transition-all shadow-sm">
          Cancelar
        </button>
        <span className="font-headline font-bold text-[var(--color-ink)] text-sm">
          {idToEdit ? 'Editar Chocadeira' : 'Nova Chocadeira'}
        </span>
      </header>

      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 max-w-4xl mx-auto w-full">
        <Card className="space-y-5">
          {error && <div className="text-[var(--color-danger)] text-xs font-bold">⚠️ {error}</div>}

          <Input
            id="choc-nome"
            label="Nome da Chocadeira"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Estufa Alpha Digital"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="choc-mod"
              label="Modelo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Ex: Glacier Hatch X"
            />

            <Input
              id="choc-cap"
              label="Capacidade Máxima"
              type="number"
              value={capacidade}
              onChange={(e) => setCapacidade(Number(e.target.value))}
              placeholder="Ex: 100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="choc-loc"
              label="Localização Física"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Ex: Galpão Central"
            />

            <Select
              id="choc-status"
              label="Status Atual"
              value={status}
              onChange={(e) => setStatus(e.target.value)}ange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'Ativa', label: 'Ativa / Em Uso' },
                { value: 'Inativa', label: 'Inativa' },
                { value: 'Manutenção', label: 'Em Manutenção' }
              ]}
            />
          </div>

          <div className="space-y-1 block">
            <label className="text-xs font-semibold text-[var(--color-muted)] block uppercase tracking-wider">Anotações técnicas</label>
            <textarea
              className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-ink)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium resize-none text-xs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Anotações sobre resistências térmicas, calibragem etc."
              rows={3}
            />
          </div>

          <Button onClick={handleSave}>
            <Save className="w-4 h-4" /> {idToEdit ? 'Salvar Alterações' : 'Registrar Chocadeira'}
          </Button>
        </Card>
      </div>
    </div>
  );
};


// --- VIEW: CADASTRO OU EDIÇÃO PROPRIEDADE ---
export const PropriedadeEditarView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const [nome, setNome] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const current = repo.getPropriedade();
    if (current) {
      setNome(current.nome);
      setResponsavel(current.responsavel);
      setTelefone(current.telefone);
      setCidade(current.cidade);
      setEstado(current.estado);
      setObservacoes(current.observacoes);
    }
  }, []);

  const handleSave = () => {
    const current = repo.getPropriedade();
    const updated: Propriedade = {
      ...current,
      nome,
      responsavel,
      telefone,
      cidade,
      estado,
      observacoes
    };
    repo.savePropriedade(updated);
    setSuccess(true);
    setTimeout(() => {
      onNavigate('configuracoes');
    }, 1200);
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('configuracoes')} className="p-1 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand)]/30 cursor-pointer select-none transition-all shadow-sm text-xs font-semibold">
          Voltar
        </button>
        <span className="font-headline font-bold text-[var(--color-ink)] text-sm">Dados da Propriedade</span>
      </header>

      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 max-w-4xl mx-auto w-full">
        {success && (
          <div className="p-3 bg-[var(--color-success-soft)] border border-[var(--color-success)]/25 text-[var(--color-success)] text-xs rounded-xl font-bold">
            ✅ Dados salvos com sucesso!
          </div>
        )}

        <Card className="space-y-5">
          <Input
            id="prop-nome"
            label="Nome da Propriedade"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Granja Recanto Verde"
            icon={<Landmark className="w-5 h-5 text-[var(--color-brand)]" />}
          />

          <Input
            id="prop-resp"
            label="Produtor Responsável"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            placeholder="Ex: João Silva"
            icon={<User className="w-5 h-5 text-[var(--color-brand)]" />}
          />

          <Input
            id="prop-tel"
            label="Telefone / Contato"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Ex: (11) 99999-9999"
            icon={<Phone className="w-5 h-5 text-[var(--color-brand)]" />}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="prop-cid"
              label="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Amparo"
              icon={<MapPin className="w-5 h-5 text-[var(--color-brand)]" />}
            />

            <Input
              id="prop-est"
              label="Estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              placeholder="Ex: SP"
            />
          </div>

          <div className="space-y-1 block">
            <label className="text-xs font-semibold text-[var(--color-muted)] block uppercase tracking-wider">Breve descrição</label>
            <textarea
              className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-ink)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium resize-none text-xs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Histórico da propriedade rural..."
              rows={3}
            />
          </div>

          <Button onClick={handleSave}>
            <Save className="w-4 h-4" /> Salvar Alterações
          </Button>
        </Card>
      </div>
    </div>
  );
};


// --- VIEW: ALERTA HISTORY FEED ---
const MemoizedAlertaCard = React.memo<{ alerta: any; onNavigate: (screenName: string, params?: any) => void }>(({ alerta, onNavigate }) => (
  <div
    key={alerta.id}
    onClick={() => alerta.chocadaId && onNavigate('chocada_detalhes', { id: alerta.chocadaId })}
    className={`p-4 rounded-xl border cursor-pointer hover:shadow-[var(--shadow-card-hover)] active:scale-[0.98] transition-all flex gap-3.5 ${
      alerta.tipo === 'error'
        ? 'bg-[var(--color-danger-soft)] border-[var(--color-danger)]/20 text-[var(--color-danger)]'
        : alerta.tipo === 'warning'
        ? 'bg-[var(--color-warning-soft)] border-[var(--color-warning)]/20 text-[var(--color-warning)]'
        : 'bg-[var(--color-info-soft)] border-[var(--color-info)]/20 text-[var(--color-info)]'
    }`}
  >
    <div className={`shrink-0 flex items-center justify-center p-2 rounded-lg ${
      alerta.tipo === 'error' ? 'bg-[var(--color-danger-soft)]' :
      alerta.tipo === 'warning' ? 'bg-[var(--color-warning-soft)]' :
      'bg-[var(--color-info-soft)]'
    }`}>
      <AlertOctagon className={`w-5 h-5 ${
        alerta.tipo === 'error' ? 'text-[var(--color-danger)]' :
        alerta.tipo === 'warning' ? 'text-[var(--color-warning)]' :
        'text-[var(--color-info)]'
      }`} />
    </div>
    <div>
      <h4 className="font-extrabold text-sm leading-tight text-[var(--color-ink)]">{alerta.titulo}</h4>
      <p className="text-xs text-[var(--color-ink-secondary)] mt-1 leading-snug">{alerta.msg}</p>
    </div>
  </div>
));

export const AlertasFeedView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const alertas = useMemo(() => repo.getAlertas(), []);

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <h1 className="font-headline font-bold text-[var(--color-ink)] text-sm tracking-widest flex items-center gap-1.5 uppercase">
          <AlertOctagon className="w-5 h-5 text-[var(--color-danger)]" /> Histórico Alertas Críticos
        </h1>
      </header>

      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-4 scrollbar-thin pb-20 max-w-5xl mx-auto w-full">
        {alertas.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-muted)]">
            <AlertOctagon className="w-12 h-12 mx-auto mb-3 text-[var(--color-muted-light)]/40" />
            <p className="text-sm font-medium">Nenhum alerta ativo no momento.</p>
            <p className="text-xs text-[var(--color-muted-light)] mt-1">Sensores operando normalmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alertas.map((al) => (
              <MemoizedAlertaCard
                key={al.id}
                alerta={al}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// (RelatoriosGeraisView foi movido para ./ReportsView.tsx)

// ==========================================
// USUÁRIOS E CONTAS
// ==========================================
const MemoizedUsuarioCard = React.memo<{ usuario: Usuario; onDelete: (id: string) => void }>(({ usuario, onDelete }) => (
  <div className="card-base p-4 flex items-center justify-between">
    <div className="min-w-0">
      <p className="font-bold text-[var(--color-ink)] text-sm truncate">{usuario.username}</p>
      <div className="flex gap-2 mt-1.5 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
          usuario.role === 'ADMIN' ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/20' :
          usuario.role === 'OPERADOR' ? 'bg-[var(--color-info-soft)] text-[var(--color-info)] border-[var(--color-info)]/20' :
          'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/20'
        }`}>
          {usuario.role}
        </span>
        <span className="text-[10px] text-[var(--color-muted)]">
          Criado em: {repo.formatReadableDate(usuario.criadoEm)}
        </span>
      </div>
    </div>

    {usuario.username !== 'admin' && (
      <button
        onClick={() => onDelete(usuario.id)}
        className="w-8 h-8 rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)] flex items-center justify-center hover:bg-[var(--color-danger)] hover:text-white transition-colors border border-[var(--color-danger)]/20 cursor-pointer shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
));

export const UsuariosListaView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    setUsuarios(repo.getUsuarios().filter(u => u.ativo));
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Deseja realmente remover este usuário?')) {
      const res = await repo.deleteUsuario(id);
      if (res.success) {
        setUsuarios(repo.getUsuarios().filter(u => u.ativo));
      } else {
        alert(res.message);
      }
    }
  }, []);

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('configuracoes')} className="p-1 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand)]/30 cursor-pointer select-none transition-all shadow-sm text-xs font-semibold">
          Voltar
        </button>
        <span className="font-headline font-bold text-[var(--color-ink)] text-sm">Usuários</span>
        <button 
          onClick={() => onNavigate('usuario_novo')}
          className="p-1.5 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-brand)]/30 rounded-xl text-[var(--color-brand)] hover:shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-3 scrollbar-thin pb-20 max-w-5xl mx-auto w-full">
        {usuarios.length === 0 && (
          <div className="text-center py-16 text-[var(--color-muted)]">
            <Users className="w-12 h-12 mx-auto mb-3 text-[var(--color-muted-light)]/40" />
            <p className="text-sm font-medium">Nenhum usuário ativo.</p>
          </div>
        )}
        {usuarios.map(u => (
          <MemoizedUsuarioCard
            key={u.id}
            usuario={u}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export const UsuarioNovoView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [senhaMock, setSenhaMock] = useState('');
  const [role, setRole] = useState<Role>('OPERADOR');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    setErrorMsg('');
    const res = await repo.saveUsuario({
      id: '',
      username,
      senhaMock,
      role,
      ativo: true,
      criadoEm: ''
    });

    if (res.success) {
      onNavigate('usuarios_lista');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('usuarios_lista')} className="p-1 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand)]/30 cursor-pointer select-none transition-all shadow-sm text-xs font-semibold">
          Cancelar
        </button>
        <span className="font-headline font-bold text-[var(--color-ink)] text-sm">Criar Usuário</span>
      </header>

      <div className="flex-grow overflow-y-auto px-5 py-6 space-y-5 max-w-sm mx-auto w-full">
        {errorMsg && (
          <div className="p-3 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-xs rounded-xl font-medium text-center">
            {errorMsg}
          </div>
        )}

        <Card className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider ml-1">Nome de Usuário</label>
            <input
              type="text"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-ink)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="Ex: maria"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider ml-1">Senha Provisória</label>
            <input
              type="text"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-ink)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium"
              value={senhaMock}
              onChange={(e) => setSenhaMock(e.target.value)}
              placeholder="Ex: maria123"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider ml-1">Perfil (Papel)</label>
            <select
              className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium cursor-pointer"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="ADMIN">Administrador (Acesso Total)</option>
              <option value="OPERADOR">Operador (Cadastros Básicos)</option>
              <option value="LEITOR">Leitor (Apenas Visualização)</option>
            </select>
          </div>

          <Button onClick={handleSave}>Salvar Usuário</Button>
        </Card>
      </div>
    </div>
  );
};

export const AjusteEstoqueView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const chocadeiras = useMemo(() => repo.getChocadeiras(), []);
  const [selectedChocadeiraId, setSelectedChocadeiraId] = useState(chocadeiras[0]?.id || '');
  const [novoSaldoNascidos, setNovoSaldoNascidos] = useState(0);
  const [vendidosAtual, setVendidosAtual] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (selectedChocadeiraId) {
      const est = repo.getEstoquePintinhosPorChocadeira(selectedChocadeiraId);
      setNovoSaldoNascidos(est.nascidos);
      setVendidosAtual(est.vendidos);
    }
  }, [selectedChocadeiraId]);

  const handleSaveAdjustment = async () => {
    if (!selectedChocadeiraId) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // 1. Pegar a última chocada finalizada desta chocadeira
      const chocadasFinalizadas = repo.getChocadas().filter(
        c => c.chocadeiraId === selectedChocadeiraId && c.finalizada && !c.excluido
      );

      if (chocadasFinalizadas.length === 0) {
        setErrorMsg('Esta chocadeira não possui nenhuma eclosão finalizada para ajustar o saldo.');
        setLoading(false);
        return;
      }

      // Ordena para pegar a eclosão mais recente
      chocadasFinalizadas.sort((a, b) => b.dataInicio.localeCompare(a.dataInicio));
      const chocadaAlvo = chocadasFinalizadas[0];

      // Busca o registro de nascimento existente
      const nascimentosExistentes = repo.getRegistrosNascimento(chocadaAlvo.id);
      const principal = nascimentosExistentes[0];

      // Recalcular ovosNaoEclodidos com base no novo valor de pintinhos
      // para que a soma não exceda quantidadeOvosInicial
      const ovosInicial = chocadaAlvo.quantidadeOvosInicial;
      const novosNascidos = Math.min(novoSaldoNascidos, ovosInicial);
      const restante = ovosInicial - novosNascidos;

      const rn: RegistroNascimento = {
        id: principal?.id || '',
        chocadaId: chocadaAlvo.id,
        dataNascimentoReal: principal?.dataNascimentoReal || new Date().toISOString().split('T')[0],
        pintinhosNascidos: novosNascidos,
        ovosNaoEclodidos: restante,
        perdas: 0,
        observacoes: (principal?.observacoes || '') + `\n[Ajuste manual: ${novosNascidos} pintinhos em ${new Date().toISOString().split('T')[0]}]`,
        criadoEm: principal?.criadoEm || '',
        atualizadoEm: '',
        excluido: false
      };

      const res = await repo.saveRegistroNascimento(rn);
      if (res.success) {
        setSuccessMsg('Estoque ajustado com sucesso!');
        setLoading(false);
        // Atualiza os valores exibidos na tela
        const estAtualizado = repo.getEstoquePintinhosPorChocadeira(selectedChocadeiraId);
        setNovoSaldoNascidos(estAtualizado.nascidos);
        setVendidosAtual(estAtualizado.vendidos);
        setTimeout(() => {
          onNavigate('dashboard');
        }, 1500);
      } else {
        setErrorMsg(res.message);
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(`Erro inesperado: ${err.message || err}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('configuracoes')} className="p-1 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand)]/30 cursor-pointer select-none transition-all shadow-sm text-xs font-semibold">
          Cancelar
        </button>
        <span className="font-headline font-bold text-[var(--color-ink)] text-sm">Ajustar Estoque Manual</span>
      </header>

      <div className="flex-grow overflow-y-auto px-5 py-6 space-y-5 max-w-sm mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-ink)]">Ajustar Pintinhos Disponíveis</h2>
          <p className="text-xs text-[var(--color-ink-secondary)] mt-1">
            Modifique a contagem de pintinhos nascidos da última eclosão para corrigir o saldo disponível.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-xs rounded-xl font-medium text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-[var(--color-success-soft)] border border-[var(--color-success)]/20 text-[var(--color-success)] text-xs rounded-xl font-medium text-center">
            {successMsg}
          </div>
        )}

        <Card className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider ml-1">Selecionar Chocadeira</label>
            <select
              className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium cursor-pointer"
              value={selectedChocadeiraId}
              onChange={(e) => setSelectedChocadeiraId(e.target.value)}
            >
              {chocadeiras.map(c => (
                <option key={c.id} value={c.id}>{c.nome} ({c.modelo})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider ml-1">Total Pintinhos Nascidos (Ajustar)</label>
            <input
              type="number"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-ink)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium"
              value={novoSaldoNascidos}
              min={0}
              onChange={(e) => setNovoSaldoNascidos(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          <div className="p-4 bg-[var(--color-bg-warm)] rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>Pintinhos Vendidos:</span>
              <span className="font-bold text-[var(--color-ink)]">{vendidosAtual}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-line)] pt-2 font-semibold">
              <span>Saldo Disponível Resultante:</span>
              <span className="font-bold text-[var(--color-success)]">{Math.max(0, novoSaldoNascidos - vendidosAtual)} Pintinhos</span>
            </div>
          </div>

          <Button onClick={handleSaveAdjustment} isLoading={loading} disabled={loading}>
            Confirmar Ajuste de Estoque
          </Button>
        </Card>
      </div>
    </div>
  );
};
