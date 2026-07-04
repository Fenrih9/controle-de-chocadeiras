/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Landmark, Users, HardHat, Clock, FileChartLine, Save, MapPin, Phone, User, AlertOctagon, ChevronRight, TrendingUp, Calendar, Filter, CheckCircle, Egg, Activity, FileText, BarChart2, Award, ArrowRight, Pencil } from 'lucide-react';
import { repo } from '../repository';
import { Chocadeira, Propriedade, Usuario, Role } from '../types';
import { Button, Card, Input, Select, ConfirmDialog } from './GlacierUI';

// --- VIEW: ADJUSTS LISTING ---
interface SettingsViewsProps {
  onNavigate: (screenName: string, params?: any) => void;
}

export const ConfiguracoesView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const prop = repo.getPropriedade();

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-sky-400" />
          <h1 className="font-headline font-bold text-slate-100 text-sm leading-tight">Configurações & Ajustes</h1>
        </div>
      </header>

      {/* Settings list scrolling */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 max-w-5xl mx-auto w-full">
        <div className="p-4 bg-[#141c2e] border border-sky-500/10 rounded-2xl flex items-center gap-3.5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent"></div>
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6 text-sky-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block">Propriedade Conectada</span>
            <h4 className="font-bold text-slate-100 truncate text-sm">{prop.nome}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-none">Resp: {prop.responsavel}</p>
          </div>
        </div>

        <section className="space-y-2">
          <h3 className="text-[10px] font-bold tracking-widest text-[#7dd3fc] uppercase ml-1">Divisões de Administração</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div 
              onClick={() => onNavigate('propriedade_editar')}
              className="bg-slate-950/60 hover:bg-slate-900 border border-sky-500/10 rounded-xl p-4 flex items-center justify-between cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <Landmark className="w-5 h-5 text-sky-400" />
                <span className="text-xs font-semibold">Editar Dados da Propriedade</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-300 transition-colors" />
            </div>

            <div 
              onClick={() => onNavigate('chocadeiras_lista')}
              className="bg-slate-950/60 hover:bg-slate-900 border border-sky-500/10 rounded-xl p-4 flex items-center justify-between cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <HardHat className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-semibold">Cadastros de Chocadeiras</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition-colors" />
            </div>

            <div 
              onClick={() => onNavigate('usuarios_lista')}
              className="bg-slate-950/60 hover:bg-slate-900 border border-sky-500/10 rounded-xl p-4 flex items-center justify-between cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <Users className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-semibold">Contas e Usuários</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 transition-colors" />
            </div>

            <div 
              onClick={() => onNavigate('historico_geral')}
              className="bg-slate-950/60 hover:bg-slate-900 border border-sky-500/10 rounded-xl p-4 flex items-center justify-between cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold">Histórico Geral de Lotes (Concluídos)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-300 transition-colors" />
            </div>
            
            <div 
              onClick={() => onNavigate('relatorios_gerais')}
              className="bg-slate-950/60 hover:bg-slate-900 border border-sky-500/10 rounded-xl p-4 flex items-center justify-between cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <FileChartLine className="w-5 h-5 text-sky-300" />
                <span className="text-xs font-semibold">Relatório Geral Consolidated</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-300 transition-colors" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};


// --- VIEW: CHOCADEIRAS LISTA ---
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
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('configuracoes')} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 cursor-pointer select-none">
          Voltar
        </button>
        <span className="font-headline font-bold text-slate-200 text-sm">Chocadeiras</span>
        <button 
          onClick={() => onNavigate('chocadeira_nova')}
          className="p-1.5 bg-slate-900 border border-sky-400/20 rounded-xl text-sky-400"
        >
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-4 scrollbar-thin pb-20 max-w-5xl mx-auto w-full">
        {errorMsg && (
          <div className="p-3 bg-red-400/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold leading-normal">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {chocadeiras.map((ch) => (
            <div 
              key={ch.id} 
              className="bg-slate-950/60 border border-sky-500/10 rounded-2xl p-4 flex gap-4 transition-all duration-300 relative items-center"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <HardHat className="w-6 h-6" />
              </div>
              
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-slate-100 text-sm truncate">{ch.nome}</h4>
                <p className="text-[10px] text-slate-400 uppercase mt-0.5 tracking-wider font-semibold truncate">
                  Mod: {ch.modelo} • Cap: {ch.capacidadeMaximaOvos} ovos
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-semibold text-slate-500 uppercase leading-none">
                  <span>Loc: {ch.localizacao}</span>
                  <span>•</span>
                  <span className={ch.status === 'Ativa' ? 'text-emerald-400' : 'text-red-400'}>
                    {ch.status}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => onNavigate('chocadeira_nova', { id: ch.id })}
                className="p-2.5 bg-slate-900/50 hover:bg-sky-500/10 text-slate-500 hover:text-sky-300 rounded-lg transition-colors cursor-pointer"
                title="Editar chocadeira"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button 
                onClick={() => setDelTarget(ch.id)}
                className="p-2.5 bg-slate-900/50 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                title="Excluir chocadeira"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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
      setError('Chocadeira nÃ£o encontrada.');
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
      setError('Chocadeira nÃ£o encontrada para ediÃ§Ã£o.');
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
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('chocadeiras_lista')} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 cursor-pointer select-none">
          Cancelar
        </button>
        <span className="font-headline font-bold text-slate-200 text-sm">
          {idToEdit ? 'Editar Chocadeira' : 'Nova Chocadeira'}
        </span>
      </header>

      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 max-w-4xl mx-auto w-full">
        <Card className="space-y-5">
          {error && <div className="text-red-400 text-xs font-bold font-mono">⚠️ {error}</div>}

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
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'Ativa', label: 'Ativa / Em Uso' },
                { value: 'Inativa', label: 'Inativa' },
                { value: 'Manutenção', label: 'Em Manutenção' }
              ]}
            />
          </div>

          <div className="space-y-1 block">
            <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Anotações técnicas</label>
            <textarea
              className="w-full bg-[#1a2438]/30 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium resize-none text-xs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Anotações sobre resistências térmicas, calibragem etc."
              rows={3}
            />
          </div>

          <Button onClick={handleSave}>
            <Save className="w-4 h-4" /> {idToEdit ? 'Salvar AlteraÃ§Ãµes' : 'Registrar Chocadeira'}
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
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('configuracoes')} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 cursor-pointer select-none">
          Voltar
        </button>
        <span className="font-headline font-bold text-slate-200 text-sm">Dados da Propriedade</span>
      </header>

      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 max-w-4xl mx-auto w-full">
        {success && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl font-bold font-mono">
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
            icon={<Landmark className="w-5 h-5 text-sky-400" />}
          />

          <Input
            id="prop-resp"
            label="Produtor Responsável"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            placeholder="Ex: João Silva"
            icon={<User className="w-5 h-5 text-sky-400" />}
          />

          <Input
            id="prop-tel"
            label="Telefone / Contato"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Ex: (11) 99999-9999"
            icon={<Phone className="w-5 h-5 text-sky-400" />}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="prop-cid"
              label="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Amparo"
              icon={<MapPin className="w-5 h-5 text-sky-450" />}
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
            <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Breve descrição</label>
            <textarea
              className="w-full bg-[#1a2438]/30 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium resize-none text-xs"
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
export const AlertasFeedView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const alertas = repo.getAlertas();

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[#ff6b6b]/25 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <h1 className="font-headline font-black text-slate-100 text-sm tracking-widest flex items-center gap-1.5 uppercase">
          <AlertOctagon className="w-5 h-5 text-red-500" /> Histórico Alertas Críticos
        </h1>
      </header>

      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-4 scrollbar-thin pb-20 max-w-5xl mx-auto w-full">
        {alertas.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            Nenhum alerta ativo no momento. Clima e sensores operando 100%.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alertas.map((al) => (
              <div 
                key={al.id}
                onClick={() => al.chocadaId && onNavigate('chocada_detalhes', { id: al.chocadaId })}
                className={`p-4 rounded-xl border backdrop-blur-md cursor-pointer hover:brightness-110 active:scale-95 transition-all outline-none flex gap-3.5 relative overflow-hidden group ${
                  al.tipo === 'error'
                    ? 'bg-red-500/10 border-red-500/25 text-red-100'
                    : al.tipo === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-100'
                    : 'bg-sky-500/10 border-sky-500/20 text-sky-100' // info
                }`}
              >
                <div className="shrink-0 flex items-center justify-center p-2 rounded-lg bg-slate-900/40">
                  <AlertOctagon className={`w-5 h-5 ${
                    al.tipo === 'error' ? 'text-red-400' : 
                    al.tipo === 'warning' ? 'text-amber-400' : 
                    'text-sky-400' // info
                  }`} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-tight">{al.titulo}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{al.msg}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// --- VIEW: REPORTS GENERAL PRODUCTION ---
export const RelatoriosGeraisView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const [chocadas, setChocadas] = useState<any[]>([]);
  const [chocadeiras, setChocadeiras] = useState<Chocadeira[]>([]);
  
  // Filtros de Relatórios
  const [filtroPeriodo, setFiltroPeriodo] = useState<'tudo' | 'ano' | 'mes'>('tudo');
  const [anoSelecionado, setAnoSelecionado] = useState<string>('2026');
  const [mesSelecionado, setMesSelecionado] = useState<number>(4); // Maio
  const [chocadeiraSelecionada, setChocadeiraSelecionada] = useState<string>('todas');
  const [tipoOvoSelecionado, setTipoOvoSelecionado] = useState<string>('todos');

  useEffect(() => {
    setChocadas(repo.getChocadas());
    setChocadeiras(repo.getChocadeiras());
  }, []);

  // Anos disponíveis nos lotes cadastrados
  const anosDisponiveis = Array.from(
    new Set(
      chocadas
        .map(c => c.dataInicio ? c.dataInicio.substring(0, 4) : null)
        .filter((y): y is string => !!y)
    )
  ).sort().reverse();
  
  const anosExibicao = anosDisponiveis.length > 0 ? anosDisponiveis : ['2026'];

  const tiposOvosDisponiveis = ['Galinha', 'Codorna', 'Pato', 'Peru'];

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Filtragem dos lotes
  const chocadasFiltradas = chocadas.filter(c => {
    // Filtro por Chocadeira
    if (chocadeiraSelecionada !== 'todas' && c.chocadeiraId !== chocadeiraSelecionada) {
      return false;
    }
    // Filtro por Espécie
    if (tipoOvoSelecionado !== 'todos' && c.tipoOvo !== tipoOvoSelecionado) {
      return false;
    }
    // Filtro por Período
    if (filtroPeriodo === 'ano') {
      const ano = c.dataInicio ? c.dataInicio.substring(0, 4) : '';
      if (ano !== anoSelecionado) return false;
    } else if (filtroPeriodo === 'mes') {
      const ano = c.dataInicio ? c.dataInicio.substring(0, 4) : '';
      const mes = c.dataInicio ? parseInt(c.dataInicio.substring(5, 7), 10) - 1 : -1;
      if (ano !== anoSelecionado || mes !== mesSelecionado) return false;
    }
    return true;
  });

  // Métricas agregadas baseadas nas chocadas filtradas
  let totalIncubados = 0;
  let totalNascidos = 0;
  let totalOvosFerteis = 0;
  let totalInferteis = 0;
  let totalDescartados = 0;

  chocadasFiltradas.forEach(c => {
    totalIncubados += c.quantidadeOvosInicial;

    // Nascidos
    const nascimentos = repo.getRegistrosNascimento(c.id);
    const nac = nascimentos.length > 0 ? nascimentos[0] : null;
    if (nac) {
      totalNascidos += nac.pintinhosNascidos;
    }

    // Ovoscopias para fertilidade
    const ovoscos = repo.getOvoscopias(c.id);
    let inferteisLote = 0;
    let descartadosLote = 0;
    ovoscos.forEach(o => {
      inferteisLote += o.ovosInferteis;
      descartadosLote += o.ovosDescartados;
    });

    totalInferteis += inferteisLote;
    totalDescartados += descartadosLote;
    totalOvosFerteis += (c.quantidadeOvosInicial - inferteisLote);
  });

  // Ajuste matemático de integridade caso não haja ovoscopia lançada
  if (totalOvosFerteis < totalNascidos) {
    totalOvosFerteis = totalIncubados;
  }

  // Cálculo das taxas
  const taxaFertilidade = totalIncubados > 0 ? Math.round((totalOvosFerteis / totalIncubados) * 100) : 0;
  const taxaEclosaoGeral = totalIncubados > 0 ? Math.round((totalNascidos / totalIncubados) * 100) : 0;
  const eclodibilidadeReal = totalOvosFerteis > 0 ? Math.round((totalNascidos / totalOvosFerteis) * 100) : 0;

  // Lógica de agrupamento temporal do gráfico SVG
  interface DataPonto {
    label: string;
    incubados: number;
    nascidos: number;
  }
  let dadosGrafico: DataPonto[] = [];

  if (filtroPeriodo === 'mes') {
    // Agrupamento semanal (4 semanas do mês selecionado)
    const semanas = [
      { label: 'Semana 1', inicio: 1, fim: 7 },
      { label: 'Semana 2', inicio: 8, fim: 14 },
      { label: 'Semana 3', inicio: 15, fim: 21 },
      { label: 'Semana 4', inicio: 22, fim: 31 },
    ];

    dadosGrafico = semanas.map(sem => {
      let incubadosSem = 0;
      let nascidosSem = 0;

      chocadasFiltradas.forEach(c => {
        if (!c.dataInicio) return;
        const dia = parseInt(c.dataInicio.substring(8, 10), 10);
        if (dia >= sem.inicio && dia <= sem.fim) {
          incubadosSem += c.quantidadeOvosInicial;
          const nac = repo.getRegistrosNascimento(c.id)[0];
          if (nac) nascidosSem += nac.pintinhosNascidos;
        }
      });

      return {
        label: sem.label,
        incubados: incubadosSem,
        nascidos: nascidosSem
      };
    });
  } else {
    // Agrupamento mensal (12 meses do ano selecionado, ou consolidado geral)
    const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    dadosGrafico = mesesAbreviados.map((nome, index) => {
      let incubadosMes = 0;
      let nascidosMes = 0;

      chocadasFiltradas.forEach(c => {
        if (!c.dataInicio) return;
        const ano = c.dataInicio.substring(0, 4);
        const mes = parseInt(c.dataInicio.substring(5, 7), 10) - 1;
        
        const bateAno = filtroPeriodo === 'tudo' || ano === anoSelecionado;
        if (mes === index && bateAno) {
          incubadosMes += c.quantidadeOvosInicial;
          const nac = repo.getRegistrosNascimento(c.id)[0];
          if (nac) nascidosMes += nac.pintinhosNascidos;
        }
      });

      return {
        label: nome,
        incubados: incubadosMes,
        nascidos: nascidosMes
      };
    });
  }

  // Fator de escala do gráfico SVG
  const maiorValorGrafico = Math.max(...dadosGrafico.map(d => Math.max(d.incubados, d.nascidos)), 0);
  const maxValEscalado = maiorValorGrafico > 0 ? maiorValorGrafico : 10;

  // Estatísticas por Espécie
  const dadosEspecie = tiposOvosDisponiveis.map(esp => {
    const lotesEsp = chocadasFiltradas.filter(c => c.tipoOvo === esp);
    let incubados = 0;
    let nascidos = 0;
    lotesEsp.forEach(c => {
      incubados += c.quantidadeOvosInicial;
      const nac = repo.getRegistrosNascimento(c.id)[0];
      if (nac) nascidos += nac.pintinhosNascidos;
    });

    const taxa = incubados > 0 ? Math.round((nascidos / incubados) * 100) : 0;
    return { especie: esp, incubados, nascidos, taxa };
  });

  // Renderizador circular mini progress (SVG)
  const renderMiniCircularProgress = (percent: number, colorClass: string) => {
    const radius = 15;
    const strokeWidth = 3;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(100, percent) / 100) * circumference;

    return (
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90 select-none" viewBox="0 0 36 36">
          <circle
            className="text-slate-800"
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
          <circle
            className={`${colorClass} transition-all duration-500`}
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[9px] font-black text-slate-200">
          {percent}%
        </span>
      </div>
    );
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('dashboard')} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 cursor-pointer select-none text-xs font-semibold hover:text-white transition-colors">
          Voltar
        </button>
        <span className="font-headline font-bold text-slate-200 text-sm">Relatório Geral Consolidado</span>
      </header>

      {/* Main Container */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-24 max-w-6xl mx-auto w-full">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-sky-950/20">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              Eficiência Geral de Eclosão
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Mapeamento de produtividade e análise comparativa de manejo</p>
          </div>
          
          <div className="text-[10px] text-slate-500 font-mono bg-slate-950/40 px-3 py-1.5 rounded-lg border border-sky-950/20 max-w-xs self-start md:self-auto">
            <span>Sincronizado: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* --- FILTROS DE RELATÓRIO --- */}
        <div className="p-4 bg-slate-950/80 border border-sky-500/10 rounded-2xl space-y-3">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filtros de Relatório
          </span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Seletor de Período */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Período</label>
              <select 
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value as any)}
                className="w-full bg-[#101626] border border-sky-950/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/30 cursor-pointer font-medium"
              >
                <option value="tudo">Todos os Períodos (Histórico)</option>
                <option value="ano">Consolidado Anual</option>
                <option value="mes">Mensal Detalhado</option>
              </select>
            </div>

            {/* Seletores Ano / Mês */}
            {filtroPeriodo !== 'tudo' && (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {filtroPeriodo === 'ano' ? 'Selecione o Ano' : 'Selecione Ano e Mês'}
                </label>
                <div className="flex gap-2">
                  <select
                    value={anoSelecionado}
                    onChange={(e) => setAnoSelecionado(e.target.value)}
                    className="flex-1 bg-[#101626] border border-sky-950/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                  >
                    {anosExibicao.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>

                  {filtroPeriodo === 'mes' && (
                    <select
                      value={mesSelecionado}
                      onChange={(e) => setMesSelecionado(parseInt(e.target.value, 10))}
                      className="flex-1 bg-[#101626] border border-sky-950/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                    >
                      {nomesMeses.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Seletor de Chocadeira */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Chocadeira</label>
              <select
                value={chocadeiraSelecionada}
                onChange={(e) => setChocadeiraSelecionada(e.target.value)}
                className="w-full bg-[#101626] border border-sky-950/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/30 cursor-pointer font-medium"
              >
                <option value="todas">Todas as Chocadeiras</option>
                {chocadeiras.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.nome}</option>
                ))}
              </select>
            </div>

            {/* Seletor de Espécie */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Espécie / Tipo de Ovo</label>
              <select
                value={tipoOvoSelecionado}
                onChange={(e) => setTipoOvoSelecionado(e.target.value)}
                className="w-full bg-[#101626] border border-sky-950/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/30 cursor-pointer font-medium"
              >
                <option value="todos">Todos os Ovos</option>
                {tiposOvosDisponiveis.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* --- CARDS DE MÉTRICAS (KPIs) --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Ovos Incubados */}
          <div className="bg-[#0f1524]/60 border border-sky-500/10 rounded-2xl p-4 flex flex-col justify-between min-h-[90px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2.5 opacity-10 text-sky-400">
              <Egg className="w-10 h-10" />
            </div>
            <span className="text-slate-400 text-[9px] uppercase font-bold tracking-widest block">Ovos Incubados</span>
            <div className="mt-2.5">
              <h3 className="text-2xl font-black text-[#7dd3fc] tracking-tight">{totalIncubados}</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Total no Período</p>
            </div>
          </div>

          {/* Fertilidade */}
          <div className="bg-[#0f1524]/60 border border-sky-500/10 rounded-2xl p-4 flex flex-col justify-between min-h-[90px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2.5 opacity-10 text-purple-400">
              <Activity className="w-10 h-10" />
            </div>
            <span className="text-slate-400 text-[9px] uppercase font-bold tracking-widest block">Taxa Fertilidade</span>
            <div className="mt-2.5">
              <h3 className="text-2xl font-black text-purple-400 tracking-tight">{taxaFertilidade}%</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{totalOvosFerteis} ovos férteis</p>
            </div>
          </div>

          {/* Eclosão Geral (Absoluta) */}
          <div className="bg-[#0f1524]/60 border border-sky-500/10 rounded-2xl p-4 flex flex-col justify-between min-h-[90px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2.5 opacity-10 text-emerald-400">
              <CheckCircle className="w-10 h-10" />
            </div>
            <span className="text-slate-400 text-[9px] uppercase font-bold tracking-widest block">Eclosão Absoluta</span>
            <div className="mt-2.5">
              <h3 className="text-2xl font-black text-emerald-400 tracking-tight">{taxaEclosaoGeral}%</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{totalNascidos} pintinhos nascidos</p>
            </div>
          </div>

          {/* Eclodibilidade Real (Eficiência) */}
          <div className="bg-[#0f1524]/60 border border-sky-500/10 rounded-2xl p-4 flex flex-col justify-between min-h-[90px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2.5 opacity-10 text-amber-500">
              <Award className="w-10 h-10" />
            </div>
            <span className="text-slate-400 text-[9px] uppercase font-bold tracking-widest block">Eclodibilidade Real</span>
            <div className="mt-2.5">
              <h3 className="text-2xl font-black text-amber-400 tracking-tight">{eclodibilidadeReal}%</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Eficiência de Incubação</p>
            </div>
          </div>
        </div>

        {/* --- GRÁFICOS E ANÁLISES --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Gráfico Temporal (SVG) */}
          <div className="lg:col-span-2 bg-[#0f1524]/60 border border-sky-500/10 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-bold tracking-widest text-[#7dd3fc] uppercase flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-sky-400" />
                Evolução Temporal no Período
              </h3>
              <div className="flex gap-3 text-[9px] font-bold uppercase">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-sky-400"></span> Incubados</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> Nascidos</span>
              </div>
            </div>

            {/* SVG Plot */}
            <div className="w-full bg-slate-950/40 p-4 rounded-xl border border-sky-950/20">
              {dadosGrafico.length === 0 || maiorValorGrafico === 0 ? (
                <div className="h-44 flex items-center justify-center text-slate-500 text-xs italic">
                  Sem dados para plotar o gráfico no período.
                </div>
              ) : (
                <div className="w-full">
                  <svg className="w-full h-auto" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                    {/* Linhas de Grade de Fundo */}
                    <line x1="40" y1="20" x2="580" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                    <line x1="40" y1="90" x2="580" y2="90" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                    <line x1="40" y1="160" x2="580" y2="160" stroke="#334155" strokeWidth="1" />

                    {/* Rótulos do Eixo Y */}
                    <text x="32" y="24" className="text-[8px] fill-slate-500 font-semibold font-mono" textAnchor="end">{maxValEscalado}</text>
                    <text x="32" y="94" className="text-[8px] fill-slate-500 font-semibold font-mono" textAnchor="end">{Math.round(maxValEscalado / 2)}</text>
                    <text x="32" y="164" className="text-[8px] fill-slate-500 font-semibold font-mono" textAnchor="end">0</text>

                    {/* Barras e Rótulos do Eixo X */}
                    {dadosGrafico.map((d, i) => {
                      // Cálculo de posicionamento X
                      const espacoDisponivel = 540; // 580 - 40
                      const larguraPeriodo = espacoDisponivel / dadosGrafico.length;
                      const centroPeriodo = 40 + (larguraPeriodo * i) + (larguraPeriodo / 2);
                      
                      // Largura das barras conforme número de pontos
                      const larguraBarra = dadosGrafico.length > 6 ? 10 : 22;
                      const offsetBarra = larguraBarra / 2 + 1;

                      // Altura das barras (Máx 140px: 160 - 20)
                      const alturaIncubados = (d.incubados / maxValEscalado) * 140;
                      const alturaNascidos = (d.nascidos / maxValEscalado) * 140;

                      return (
                        <g key={i}>
                          {/* Barra de Ovos Incubados */}
                          <rect
                            x={centroPeriodo - offsetBarra}
                            y={160 - alturaIncubados}
                            width={larguraBarra}
                            height={alturaIncubados}
                            fill="#0ea5e9"
                            rx="2"
                            className="transition-all duration-500 hover:fill-sky-300"
                          />
                          {/* Rótulo de Valor de Incubados acima da barra */}
                          {d.incubados > 0 && (
                            <text
                              x={centroPeriodo - offsetBarra + (larguraBarra / 2)}
                              y={160 - alturaIncubados - 4}
                              className="text-[7px] fill-sky-400 font-bold font-mono"
                              textAnchor="middle"
                            >
                              {d.incubados}
                            </text>
                          )}

                          {/* Barra de Pintinhos Nascidos */}
                          <rect
                            x={centroPeriodo + 1}
                            y={160 - alturaNascidos}
                            width={larguraBarra}
                            height={alturaNascidos}
                            fill="#10b981"
                            rx="2"
                            className="transition-all duration-500 hover:fill-emerald-300"
                          />
                          {/* Rótulo de Valor de Nascidos acima da barra */}
                          {d.nascidos > 0 && (
                            <text
                              x={centroPeriodo + 1 + (larguraBarra / 2)}
                              y={160 - alturaNascidos - 4}
                              className="text-[7px] fill-emerald-400 font-bold font-mono"
                              textAnchor="middle"
                            >
                              {d.nascidos}
                            </text>
                          )}

                          {/* Rótulo do Eixo X */}
                          <text
                            x={centroPeriodo}
                            y="178"
                            className="text-[8px] fill-slate-400 font-semibold text-center font-mono"
                            textAnchor="middle"
                          >
                            {d.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Distribuição por Espécie */}
          <div className="bg-[#0f1524]/60 border border-sky-500/10 rounded-2xl p-5 flex flex-col justify-between">
            <h3 className="text-[11px] font-bold tracking-widest text-[#7dd3fc] uppercase flex items-center gap-1.5 mb-3.5">
              <Award className="w-4 h-4 text-sky-400" />
              Rendimento por Espécie
            </h3>

            <div className="space-y-3 flex-1 flex flex-col justify-around">
              {dadosEspecie.map(e => {
                let strokeColor = 'text-sky-500';
                if (e.taxa > 80) strokeColor = 'text-emerald-400';
                else if (e.taxa > 60) strokeColor = 'text-amber-400';
                else if (e.taxa > 0) strokeColor = 'text-red-400';

                return (
                  <div key={e.especie} className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-xl border border-sky-950/20">
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-200 block">{e.especie}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">
                        {e.incubados > 0 ? `${e.nascidos} nascidos de ${e.incubados} ovos` : 'Sem incubação'}
                      </span>
                    </div>
                    {e.incubados > 0 ? (
                      renderMiniCircularProgress(e.taxa, strokeColor)
                    ) : (
                      <span className="text-[9px] font-mono text-slate-600 font-bold uppercase">Sem Lotes</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- PERFORMANCE DETALHADA POR CHOCADEIRA --- */}
        <section className="bg-slate-950/60 border border-sky-500/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-[11px] font-bold tracking-widest text-[#7dd3fc] uppercase">Eficiência das Chocadeiras / Estufas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chocadeiras.length === 0 ? (
              <span className="text-slate-500 text-xs italic">Nenhuma chocadeira cadastrada no sistema.</span>
            ) : (
              chocadeiras.map(ch => {
                // Filtrar lotes finalizados vinculados a esta chocadeira no período selecionado
                const lotesCh = chocadasFiltradas.filter(c => c.chocadeiraId === ch.id);
                let ovosCh = 0;
                let nascidosCh = 0;
                
                lotesCh.forEach(l => {
                  ovosCh += l.quantidadeOvosInicial;
                  const nac = repo.getRegistrosNascimento(l.id)[0];
                  if (nac) nascidosCh += nac.pintinhosNascidos;
                });

                const ef = ovosCh > 0 ? Math.round((nascidosCh / ovosCh) * 100) : 0;
                
                // Cor do gradiente baseada na eclosão
                let colorClass = "from-red-500 to-rose-400";
                let textClass = "text-red-400";
                if (ef >= 80) {
                  colorClass = "from-emerald-500 to-teal-400";
                  textClass = "text-emerald-400";
                } else if (ef >= 60) {
                  colorClass = "from-amber-500 to-orange-400";
                  textClass = "text-amber-400";
                }

                return (
                  <div key={ch.id} className="p-3.5 bg-[#0f1524]/60 border border-sky-950/40 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-200 font-bold block">{ch.nome}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{ch.modelo || 'Modelo não cadastrado'}</span>
                      </div>
                      <div className="text-right">
                        {ovosCh > 0 ? (
                          <>
                            <span className={`font-extrabold ${textClass}`}>{ef}% eclosão</span>
                            <span className="text-[9px] text-slate-400 block font-semibold">{nascidosCh}/{ovosCh} ovos</span>
                          </>
                        ) : (
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Sem dados no período</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-sky-950/20">
                      <div 
                        className={`bg-gradient-to-r ${colorClass} h-full rounded-full transition-all duration-700`}
                        style={{ width: `${ovosCh > 0 ? ef : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* --- LISTAGEM DE LOTES DO PERÍODO --- */}
        <section className="bg-slate-950/60 border border-sky-500/10 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[11px] font-bold tracking-widest text-[#7dd3fc] uppercase flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Lotes Integrados no Filtro
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {chocadasFiltradas.length} {chocadasFiltradas.length === 1 ? 'Lote' : 'Lotes'}
            </span>
          </div>

          {chocadasFiltradas.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-6 text-center">Nenhum lote atende aos filtros atuais.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-sky-950/40">
              <table className="w-full text-xs text-left text-slate-350">
                <thead className="text-[10px] text-slate-400 bg-[#0f1524] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3">Lote</th>
                    <th className="px-4 py-3">Chocadeira</th>
                    <th className="px-4 py-3">Tipo Ovo</th>
                    <th className="px-4 py-3 text-center">Inicial</th>
                    <th className="px-4 py-3 text-center">Férteis</th>
                    <th className="px-4 py-3 text-center">Nascidos</th>
                    <th className="px-4 py-3 text-center">Eclosão</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 bg-slate-950/20 font-medium">
                  {chocadasFiltradas.map(c => {
                    const chocadeira = chocadeiras.find(ch => ch.id === c.chocadeiraId);
                    const nascimentos = repo.getRegistrosNascimento(c.id);
                    const nac = nascimentos.length > 0 ? nascimentos[0] : null;
                    const nascidos = nac ? nac.pintinhosNascidos : 0;
                    
                    const ovoscos = repo.getOvoscopias(c.id);
                    let inferteis = 0;
                    ovoscos.forEach(o => inferteis += o.ovosInferteis);
                    const ferteis = c.quantidadeOvosInicial - inferteis;

                    const ef = c.quantidadeOvosInicial > 0 ? Math.round((nascidos / c.quantidadeOvosInicial) * 100) : 0;

                    return (
                      <tr key={c.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="text-slate-100 font-bold block">{c.nome}</span>
                          <span className="text-[10px] text-slate-500">{repo.formatReadableDate(c.dataInicio)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-350">{chocadeira?.nome || 'Sem vinculação'}</td>
                        <td className="px-4 py-3.5 text-slate-350">{c.tipoOvo}</td>
                        <td className="px-4 py-3.5 text-center text-slate-200">{c.quantidadeOvosInicial}</td>
                        <td className="px-4 py-3.5 text-center text-sky-400 font-bold">{ferteis}</td>
                        <td className="px-4 py-3.5 text-center text-emerald-400 font-bold">{c.finalizada ? nascidos : '---'}</td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-slate-100">
                          {c.finalizada ? `${ef}%` : <span className="text-slate-600 text-[10px] uppercase font-bold">Incubando</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                            c.status === 'FINALIZADA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            c.status === 'EM_ANDAMENTO' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                            c.status === 'PROXIMA' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            c.status === 'ATRASADA' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => onNavigate('relatorio_chocada', { id: c.id })}
                            className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/20 text-sky-400 hover:text-white cursor-pointer select-none text-[10px] font-bold flex items-center gap-1 mx-auto transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" /> Analisar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

// ==========================================
// USUÁRIOS E CONTAS
// ==========================================
export const UsuariosListaView: React.FC<SettingsViewsProps> = ({ onNavigate }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    setUsuarios(repo.getUsuarios().filter(u => u.ativo));
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover este usuário?')) {
      const res = await repo.deleteUsuario(id);
      if (res.success) {
        setUsuarios(repo.getUsuarios().filter(u => u.ativo));
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('configuracoes')} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 cursor-pointer select-none">
          Voltar
        </button>
        <span className="font-headline font-bold text-slate-200 text-sm">Usuários</span>
        <button 
          onClick={() => onNavigate('usuario_novo')}
          className="p-1.5 bg-slate-900 border border-sky-400/20 rounded-xl text-sky-400"
        >
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-grow overflow-y-auto p-5 lg:p-8 space-y-4">
        {usuarios.length === 0 && (
          <p className="text-slate-500 text-center text-sm py-10">Nenhum usuário ativo.</p>
        )}
        {usuarios.map(u => (
          <div key={u.id} className="bg-slate-900 border border-sky-950/40 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-200 text-sm">{u.username}</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  u.role === 'OPERADOR' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {u.role}
                </span>
                <span className="text-[10px] text-slate-500">
                  Criado em: {repo.formatReadableDate(u.criadoEm)}
                </span>
              </div>
            </div>
            
            {u.username !== 'admin' && (
              <button 
                onClick={() => handleDelete(u.id)}
                className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <button onClick={() => onNavigate('usuarios_lista')} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 cursor-pointer select-none">
          Cancelar
        </button>
        <span className="font-headline font-bold text-slate-200 text-sm">Criar Usuário</span>
      </header>

      <div className="flex-grow overflow-y-auto px-5 py-6 space-y-5 max-w-sm mx-auto w-full">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-medium text-center">
            {errorMsg}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider ml-1">Nome de Usuário</label>
          <input
            type="text"
            className="w-full bg-[#1a2438]/50 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            placeholder="Ex: maria"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider ml-1">Senha Provisória</label>
          <input
            type="text"
            className="w-full bg-[#1a2438]/50 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            value={senhaMock}
            onChange={(e) => setSenhaMock(e.target.value)}
            placeholder="Ex: maria123"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider ml-1">Perfil (Papel)</label>
          <select
            className="w-full bg-[#1a2438]/50 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="ADMIN">Administrador (Acesso Total)</option>
            <option value="OPERADOR">Operador (Cadastros Básicos)</option>
            <option value="LEITOR">Leitor (Apenas Visualização)</option>
          </select>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave}>Salvar Usuário</Button>
        </div>
      </div>
    </div>
  );
};
