/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Download, FileText, Printer, CheckCircle, Egg, Shield, TrendingUp, Calendar } from 'lucide-react';
import { repo } from '../repository';
import { Chocada } from '../types';
import { Button, Card } from './GlacierUI';

interface ReportViewProps {
  id: string; // Chocada ID
  onNavigate: (screenName: string, params?: any) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ id, onNavigate }) => {
  const [chocada, setChocada] = useState<Chocada | undefined>(undefined);
  const [nascimento, setNascimento] = useState<any | null>(null);
  const [ovoscopias, setOvoscopias] = useState<any[]>([]);
  const [diarios, setDiarios] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const ch = repo.getChocadaById(id);
    if (ch) {
      setChocada(ch);
      setNascimento(repo.getRegistrosNascimento(id)[0] || null);
      setOvoscopias(repo.getOvoscopias(id));
      setDiarios(repo.getRegistrosDiarios(id));
    }
  }, [id]);

  const handleSimulatePDF = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert('Relatório PDF do lote gerado com sucesso! Iniciando download simulado...');
    }, 1500);
  };

  if (!chocada) {
    return (
      <div className="p-6 text-center text-[#6f756a] bg-[#f7f2e9] min-h-screen">
        Lote não encontrado.
        <Button onClick={() => onNavigate('chocadas_lista')} className="mt-4">Voltar</Button>
      </div>
    );
  }

  // Aggregate numbers
  let fertiles = 0;
  let infertiles = 0;
  let discarded = 0;
  ovoscopias.forEach(o => {
    fertiles += o.ovosFerteis;
    infertiles += o.ovosInferteis;
    discarded += o.ovosDescartados;
  });

  const hatchCount = nascimento ? nascimento.pintinhosNascidos : 0;
  const unhatchedCount = nascimento ? nascimento.ovosNaoEclodidos : 0;
  const lossCount = nascimento ? nascimento.perdas : 0;

  const totalEggs = chocada.quantidadeOvosInicial;
  const hatchRate = totalEggs > 0 ? Math.round((hatchCount / totalEggs) * 100) : 0;
  const lossRate = totalEggs > 0 ? Math.round((lossCount / totalEggs) * 100) : 0;

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#f7f2e9]">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 border-b border-[#465336]/15 bg-[#fffaf2]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('chocada_detalhes', { id })} className="p-1 px-2.5 rounded-lg bg-[#fffaf2] border border-[#465336]/15 text-[#6f756a] hover:text-[#263225] hover:border-[#3f5f31]/30 cursor-pointer select-none transition-all shadow-sm flex items-center">
            <ChevronLeft className="w-4 h-4 inline mr-1" /> Detalhes
          </button>
          <span className="font-headline font-bold text-[#263225] text-xs">Relatório Técnico</span>
        </div>
      </header>

      {/* Report Container Document layout */}
      <div className="flex-grow overflow-y-auto px-5 lg:px-8 py-6 space-y-6 scrollbar-thin pb-20 select-text max-w-5xl mx-auto w-full">
        <div className="border border-[#465336]/12 shadow-sm rounded-2xl bg-[#fffdfb] p-5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3f5f31] to-[#c9854a]" />
          
          {/* Header metadata */}
          <div className="flex justify-between items-start gap-4 text-xs font-mono border-b border-[#465336]/10 pb-4">
            <div>
              <h1 className="text-sm font-bold text-[#263225] uppercase tracking-tight">{repo.getPropriedade().nome || 'Propriedade Sem Nome'}</h1>
              <p className="text-[#6f756a] mt-1 uppercase text-[9px] font-bold">Relatório Oficial de Produção</p>
            </div>
            <div className="text-right text-[#6f756a]">
              <p>LOTE ID: {chocada.id.toUpperCase()}</p>
              <p className="text-[10px] mt-0.5">Gerado em: {new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>

          {/* Section: General info */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-[#3f5f31] uppercase tracking-widest">1. Descritivo Técnico</h2>
            <div className="grid grid-cols-2 gap-3.5 text-xs text-[#263225] font-semibold leading-normal">
              <div>
                <span className="text-[#6f756a] block uppercase text-[8px] font-bold">Nome do Lote</span>
                <span className="text-[#263225] font-medium">{chocada.nome}</span>
              </div>
              <div>
                <span className="text-[#6f756a] block uppercase text-[8px] font-bold">Chocadeira / Incubadora</span>
                <span className="text-[#263225] font-medium">{repo.getChocadeiraById(chocada.chocadeiraId)?.nome || chocada.chocadeiraId}</span>
              </div>
              <div>
                <span className="text-[#6f756a] block uppercase text-[8px] font-bold">Data de Início</span>
                <span className="text-[#263225] font-medium">{repo.formatReadableDate(chocada.dataInicio)}</span>
              </div>
              <div>
                <span className="text-[#6f756a] block uppercase text-[8px] font-bold">Previsão Calculada</span>
                <span className="text-[#263225] font-medium">{repo.formatReadableDate(chocada.dataPrevistaNascimento)}</span>
              </div>
            </div>
          </div>

          {/* Section: Biological numbers */}
          <div className="space-y-3 border-t border-[#465336]/10 pt-4">
            <h2 className="text-xs font-bold text-[#3f5f31] uppercase tracking-widest">2. Balanço Biológico</h2>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-[#f1eadf]/30 p-3 rounded-lg border border-[#465336]/10">
                <span className="text-[#6f756a] uppercase text-[8px] font-extrabold block">Inicial</span>
                <span className="text-sm font-bold text-[#263225]">{totalEggs}</span>
              </div>
              <div className="bg-[#f1eadf]/30 p-3 rounded-lg border border-[#465336]/10">
                <span className="text-[#6f756a] uppercase text-[8px] font-extrabold block">Férteis</span>
                <span className="text-sm font-bold text-[#3f5f31]">{fertiles === 0 ? chocada.quantidadeOvosAtivos : fertiles}</span>
              </div>
              <div className="bg-[#f1eadf]/30 p-3 rounded-lg border border-[#465336]/10">
                <span className="text-[#6f756a] uppercase text-[8px] font-extrabold block">Descartados</span>
                <span className="text-sm font-bold text-[#c9854a]">{discarded === 0 ? totalEggs - chocada.quantidadeOvosAtivos : discarded}</span>
              </div>
            </div>
          </div>

          {/* Section: Diagnostics and final performance rates */}
          <div className="space-y-3 border-t border-[#465336]/10 pt-4">
            <h2 className="text-xs font-bold text-[#3f5f31] uppercase tracking-widest">3. Eclosão & Rendimento</h2>
            <div className="grid grid-cols-2 gap-3.5 text-xs text-[#263225] font-semibold leading-normal">
              <div>
                <span className="text-[#6f756a] block uppercase text-[8px] font-bold">Pintinhos Nascidos</span>
                <span className="text-emerald-600 font-bold">{hatchCount === 0 ? '---' : `${hatchCount} Pintinhos`}</span>
              </div>
              <div>
                <span className="text-[#6f756a] block uppercase text-[8px] font-bold">Taxa Eclosão Relativa</span>
                <span className="text-emerald-600 font-extrabold">{hatchCount === 0 ? 'Aguardando Nascimento' : `${hatchRate}%`}</span>
              </div>
              <div>
                <span className="text-[#6f756a] block uppercase text-[8px] font-bold">Perdas Registradas</span>
                <span className="text-[#b85745] font-bold">{lossCount === 0 ? '---' : `${lossCount} Ovos`}</span>
              </div>
              <div>
                <span className="text-[#6f756a] block uppercase text-[8px] font-bold">Taxa Estimada de Perdas</span>
                <span className="text-[#b85745] font-extrabold">{lossCount === 0 ? '0%' : `${lossRate}%`}</span>
              </div>
            </div>
          </div>

          {/* Section: Inspeccao logs list */}
          <div className="space-y-3 border-t border-[#465336]/10 pt-4">
            <h2 className="text-xs font-bold text-[#3f5f31] uppercase tracking-widest">4. Histórico Verificações</h2>
            {diarios.length === 0 ? (
              <p className="text-xs text-[#6f756a] italic">Sem registros diários lançados.</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {diarios.map((log, index) => (
                  <div key={index} className="flex justify-between items-center text-[10px] text-[#6f756a] py-1.5 border-b border-[#465336]/10 font-semibold">
                    <span>{repo.formatReadableDate(log.data)}</span>
                    <span className="text-[#263225]">{log.temperatura}°C | {log.umidade}% UR</span>
                    <span className="text-[9px] text-[#3f5f31]">
                      {log.ovosVirados ? 'VIRADOS' : 'PENDENTE'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generate Report command button trigger */}
        <Button onClick={handleSimulatePDF} variant="primary" isLoading={isDownloading}>
          <Printer className="w-5 h-5" /> Exportar para PDF Oficial
        </Button>
      </div>
    </div>
  );
};
