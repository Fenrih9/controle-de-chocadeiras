/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Thermometer, Droplets, Save, FileSpreadsheet, Plus, Moon, HelpCircle, Sparkles, ChevronLeft, Trash } from 'lucide-react';
import { repo, getCurrentDateString } from '../repository';
import { Chocada, RegistroDiario, Ovoscopia, RegistroNascimento } from '../types';
import { Button, Card, Input } from './GlacierUI';

// --- VIEW: REGISTRO DIÁRIO NOVO ---
interface LogsProps {
  id: string; // chocadaId
  onNavigate: (screenName: string, params?: any) => void;
}

export const RegistroDiarioNovoView: React.FC<LogsProps> = ({ id, onNavigate }) => {
  const [chocada, setChocada] = useState<Chocada | undefined>(undefined);
  const [temperatura, setTemperatura] = useState<number>(37.5);
  const [umidade, setUmidade] = useState<number>(55);
  const [ovosVirados, setOvosVirados] = useState<boolean>(true);
  const [ocorrencias, setOcorrencias] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const ch = repo.getChocadaById(id);
    if (ch) {
      setChocada(ch);
      setUmidade(ch.umidadeIdeal);
    }
  }, [id]);

  const handleSave = () => {
    setErrorMsg('');
    setSuccessMsg('');

    const log: RegistroDiario = {
      id: '',
      chocadaId: id,
      data: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      temperatura,
      umidade,
      ovosVirados,
      ocorrencias,
      observacoes,
      criadoEm: '',
      atualizadoEm: '',
      excluido: false
    };

    const res = repo.saveRegistroDiario(log);
    if (res.success) {
      setSuccessMsg('Acompanhamento diário gravado com sucesso.');
      setTimeout(() => {
        onNavigate('chocada_detalhes', { id });
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  if (!chocada) return <div className="p-6 text-center text-slate-400 bg-slate-950">Lote não encontrado.</div>;

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('chocada_detalhes', { id })} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 hover:text-white cursor-pointer select-none">
            Voltar
          </button>
          <span className="font-headline font-bold text-slate-200 text-sm">Registro Diário</span>
        </div>
      </header>

      {/* Main Form scrollable view */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 max-w-4xl mx-auto w-full">
        <div className="text-center md:text-left mb-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Registrar Inspeção</h2>
          <p className="text-xs text-slate-400 mt-1">Crie o relatório de pesagem, umidade e controle do lote "{chocada.nome}"</p>
        </div>

        {errorMsg && (
          <div className="py-2.5 px-4 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl font-bold">
            ✅ {successMsg}
          </div>
        )}

        <Card className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="ins-temp"
              label="Temperatura (°C)"
              type="number"
              step="0.1"
              value={temperatura}
              onChange={(e) => setTemperatura(Number(e.target.value))}
              icon={<Thermometer className="w-5 h-5" />}
            />

            <Input
              id="ins-hum"
              label="Umidade (%)"
              type="number"
              value={umidade}
              onChange={(e) => setUmidade(Number(e.target.value))}
              icon={<Droplets className="w-5 h-5" />}
            />
          </div>

          {/* Toggle: Ovos Virados switch layout */}
          <div className="py-3 px-4 bg-[#141c2e] border border-sky-500/10 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Os ovos foram virados hoje?</span>
            <button
              onClick={() => setOvosVirados(!ovosVirados)}
              type="button"
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${ovosVirados ? 'bg-sky-500' : 'bg-slate-700'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-transform duration-300 ${ovosVirados ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <Input
            id="ocorrencia"
            label="Ocorrências"
            value={ocorrencias}
            onChange={(e) => setOcorrencias(e.target.value)}
            placeholder="Ex: Queda parcial de energia de 10 min."
          />

          <div className="space-y-1 w-full">
            <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Observações
            </label>
            <textarea
              className="w-full bg-[#1a2438]/30 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium resize-none text-xs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Nível d'água restabelecido na chocadeira."
              rows={3}
            />
          </div>

          <Button onClick={handleSave}>
            <Save className="w-4 h-4" /> Salvar Registro Diário
          </Button>
        </Card>
      </div>
    </div>
  );
};


// --- VIEW: REGISTRO DE OVOSCOPIA ---
export const OvoscopiaNovaView: React.FC<LogsProps> = ({ id, onNavigate }) => {
  const [chocada, setChocada] = useState<Chocada | undefined>(undefined);
  const [ferteis, setFerteis] = useState<number>(0);
  const [inferteis, setInferteis] = useState<number>(0);
  const [descartados, setDescartados] = useState<number>(0);
  const [observacoes, setObservacoes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const ch = repo.getChocadaById(id);
    if (ch) {
      setChocada(ch);
      setFerteis(ch.quantidadeOvosAtivos); // Default fertile to currently active
    }
  }, [id]);

  const handleSave = () => {
    setErrorMsg('');
    setSuccessMsg('');

    const ov: Ovoscopia = {
      id: '',
      chocadaId: id,
      data: new Date().toISOString().split('T')[0],
      ovosFerteis: ferteis,
      ovosInferteis: inferteis,
      ovosDescartados: descartados,
      observacoes,
      criadoEm: '',
      atualizadoEm: '',
      excluido: false
    };

    const res = repo.saveOvoscopia(ov);
    if (res.success) {
      setSuccessMsg('Ovoscopia registrada com sucesso!');
      setTimeout(() => {
        onNavigate('chocada_detalhes', { id });
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  const adjustValue = (type: 'ferteis' | 'inferteis' | 'descartados', qty: number) => {
    if (type === 'ferteis') setFerteis(prev => Math.max(0, prev + qty));
    if (type === 'inferteis') setInferteis(prev => Math.max(0, prev + qty));
    if (type === 'descartados') setDescartados(prev => Math.max(0, prev + qty));
  };

  // Recalculates dynamically projected balance according to guidelines!
  // Formula: ovosAtivos = quantidadeOvosInicial - ovosDescartados - ovosInferteis
  const saldoProjetado = chocada ? Math.max(0, chocada.quantidadeOvosInicial - descartados - inferteis) : 0;

  if (!chocada) return <div className="p-6 text-center text-slate-400 bg-slate-950">Lote não encontrado.</div>;

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('chocada_detalhes', { id })} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 hover:text-white cursor-pointer select-none">
            Voltar
          </button>
          <span className="font-headline font-bold text-slate-200 text-sm">Registro de Ovoscopia</span>
        </div>
      </header>

      {/* Viewport scrolling */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 max-w-4xl mx-auto w-full">
        <div className="text-center md:text-left mb-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles className="w-6 h-6 text-purple-400 fill-purple-400/10" /> Ovoscopia
          </h2>
          <p className="text-xs text-slate-400 mt-1">Grave diagnósticos de fertilidade de ovos analisados sob foco de luz.</p>
        </div>

        {errorMsg && (
          <div className="py-2.5 px-4 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl font-bold">
            ✅ {successMsg}
          </div>
        )}

        {/* Bento input adjust cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0f1524]/60 border border-sky-500/10 rounded-2xl p-5 flex flex-col justify-between hover:border-sky-500/20 transition-all gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ovos Férteis (Embriões Vivos)</span>
            <div className="flex items-center gap-4">
              <Button onClick={() => adjustValue('ferteis', -1)} className="w-12 py-2 text-lg text-slate-300 bg-slate-900 border border-sky-500/10">-</Button>
              <div className="flex-1 text-center text-3xl font-extrabold text-sky-400">{ferteis}</div>
              <Button onClick={() => adjustValue('ferteis', 1)} className="w-12 py-2 text-lg text-slate-300 bg-slate-900 border border-sky-500/10">+</Button>
            </div>
          </div>

          <div className="bg-[#0f1524]/60 border border-sky-500/10 rounded-2xl p-5 flex flex-col justify-between hover:border-red-500/20 transition-all gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ovos Inférteis (Ovos Brancos/Claros)</span>
            <div className="flex items-center gap-4">
              <Button onClick={() => adjustValue('inferteis', -1)} className="w-12 py-2 text-lg text-slate-300 bg-slate-900 border border-sky-500/10">-</Button>
              <div className="flex-1 text-center text-3xl font-extrabold text-[#ff6b6b]">{inferteis}</div>
              <Button onClick={() => adjustValue('inferteis', 1)} className="w-12 py-2 text-lg text-slate-300 bg-slate-900 border border-sky-500/10">+</Button>
            </div>
          </div>

          <div className="bg-[#0f1524]/60 border border-sky-500/10 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/20 transition-all gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ovos Descartados (Anomalias/Morte)</span>
            <div className="flex items-center gap-4">
              <Button onClick={() => adjustValue('descartados', -1)} className="w-12 py-2 text-lg text-slate-300 bg-slate-900 border border-sky-500/10">-</Button>
              <div className="flex-1 text-center text-3xl font-extrabold text-purple-400">{descartados}</div>
              <Button onClick={() => adjustValue('descartados', 1)} className="w-12 py-2 text-lg text-slate-300 bg-slate-900 border border-sky-500/10">+</Button>
            </div>
          </div>

          <div className="col-span-full space-y-1 block">
            <label className="text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider">Observações adicionais</label>
            <textarea
              className="w-full bg-[#1a2438]/30 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium resize-none text-xs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Aspectos gerais dos ovos, trincas identificadas etc."
              rows={3}
            />
          </div>

          {/* Automatic calculation ring projection exactly like screen prints */}
          <div className="col-span-full bg-sky-500/5 hover:border-sky-500/25 border border-sky-500/15 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between text-xs">
            <div className="space-y-1">
              <span className="text-[#7dd3fc] font-semibold block uppercase tracking-wider text-[10px]">Resultado Projetado</span>
              <h4 className="text-slate-100 font-extrabold text-lg">Saldo Real de Ovos Ativos</h4>
            </div>
            <div className="text-center font-black text-4xl text-sky-300 drop-shadow-[0_0_15px_rgba(125,211,252,0.3)]">
              {saldoProjetado}
            </div>
          </div>

          <div className="col-span-full">
            <Button onClick={handleSave} className="font-bold">
              <Save className="w-4 h-4" /> Confirmar Ovoscopia
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- VIEW: REGISTRO DE NASCIMENTO ---
export const RegistroNascimentoView: React.FC<LogsProps> = ({ id, onNavigate }) => {
  const [chocada, setChocada] = useState<Chocada | undefined>(undefined);
  const [dataNascimentoReal, setDataNascimentoReal] = useState(getCurrentDateString());
  const [pintinhosNascidos, setPintinhosNascidos] = useState<number>(0);
  const [ovosNaoEclodidos, setOvosNaoEclodidos] = useState<number>(0);
  const [perdas, setPerdas] = useState<number>(0);
  const [observacoes, setObservacoes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const ch = repo.getChocadaById(id);
    if (ch) {
      setChocada(ch);
      setPintinhosNascidos(ch.quantidadeOvosAtivos); // default helper
    }
  }, [id]);

  const handleSave = () => {
    setErrorMsg('');
    setSuccessMsg('');

    const rn: RegistroNascimento = {
      id: '',
      chocadaId: id,
      dataNascimentoReal,
      pintinhosNascidos,
      ovosNaoEclodidos,
      perdas,
      observacoes,
      criadoEm: '',
      atualizadoEm: '',
      excluido: false
    };

    const res = repo.saveRegistroNascimento(rn);
    if (res.success) {
      setSuccessMsg('Resultados de eclosão salvos com sucesso.');
      setTimeout(() => {
        onNavigate('chocada_detalhes', { id });
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Rates calculations
  const totalOriginal = chocada ? chocada.quantidadeOvosInicial : 0;
  const taxaEclosao = totalOriginal > 0 ? Math.round((pintinhosNascidos / totalOriginal) * 100) : 0;
  const taxaPerdas = totalOriginal > 0 ? Math.round((perdas / totalOriginal) * 100) : 0;

  if (!chocada) return <div className="p-6 text-center text-slate-400 bg-slate-950">Lote não encontrado.</div>;

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-sky-950/40 bg-slate-950/20 sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('chocada_detalhes', { id })} className="p-1 px-2.5 rounded-lg bg-slate-900 border border-sky-400/25 text-sky-400 hover:text-white cursor-pointer select-none">
            Anular
          </button>
          <span className="font-headline font-bold text-slate-200 text-sm">Registrar Nascimento</span>
        </div>
      </header>

      {/* Scroll area */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 max-w-4xl mx-auto w-full">
        <div className="text-center md:text-left mb-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Resultado da Chocada</h2>
          <p className="text-xs text-slate-400 mt-1">Concluir ciclo registrando taxa oficial de eclosão do lote.</p>
        </div>

        {errorMsg && (
          <div className="py-2.5 px-4 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl font-bold">
            ✅ {successMsg}
          </div>
        )}

        <Card className="space-y-5">
          <Input
            id="data-born"
            label="Data real do nascimento"
            type="date"
            value={dataNascimentoReal}
            onChange={(e) => setDataNascimentoReal(e.target.value)}
          />

          <div className="space-y-3.5">
            <Input
              id="nasc-chick"
              label="Pintinhos Nascidos Saudáveis"
              type="number"
              value={pintinhosNascidos}
              onChange={(e) => setPintinhosNascidos(Number(e.target.value))}
            />

            <Input
              id="nasc-unhatch"
              label="Ovos não Eclodidos (Retidos em casca)"
              type="number"
              value={ovosNaoEclodidos}
              onChange={(e) => setOvosNaoEclodidos(Number(e.target.value))}
            />

            <Input
              id="nasc-loss"
              label="Perdas e Abortos Identificados"
              type="number"
              value={perdas}
              onChange={(e) => setPerdas(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1 block">
            <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Anotações finais</label>
            <textarea
              className="w-full bg-[#1a2438]/30 border border-sky-500/10 rounded-xl py-3 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium resize-none text-xs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Pintinhos fortes, eclosão uniforme no cronômetro do 21º dia."
              rows={3}
            />
          </div>

          {/* Automatic hatching gauge ring precisely emulated visually from screens */}
          <div className="bg-[#0f1524]/75 border border-sky-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="relative w-36 h-36 flex flex-col items-center justify-center rounded-full border-4 border-slate-800 shadow-inner">
              <span className="text-4xl font-extrabold text-sky-400 drop-shadow-[0_0_10px_rgba(125,211,252,0.3)]">{taxaEclosao}%</span>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Taxa de Eclosão</span>
            </div>
            
            <div className="mt-4 flex gap-6 text-xs text-slate-300 font-semibold uppercase">
              <div>
                <span className="text-red-400">{taxaPerdas}%</span> de Perdas
              </div>
              <div className="text-sky-300 font-bold">
                {pintinhosNascidos} / {totalOriginal} Ovos
              </div>
            </div>
          </div>

          <Button onClick={handleSave}>
            <Save className="w-4 h-4 animate-pulse" /> Finalizar e Salvar Resultado
          </Button>
        </Card>
      </div>
    </div>
  );
};
