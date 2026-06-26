/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Filter, 
  Calendar, 
  Info, 
  Egg, 
  Layers, 
  AlertCircle,
  X,
  PlusCircle,
  Edit3
} from 'lucide-react';
import { repo, getCurrentDateString } from '../repository';
import { LancamentoFinanceiro, Chocadeira, Usuario } from '../types';
import { Button, Card, Input } from './GlacierUI';
import { useAuth } from '../contexts/AuthContext';

interface FinanceiroViewProps {
  onNavigate: (screenName: string, params?: any) => void;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  
  // Estados para dados
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [chocadeiras, setChocadeiras] = useState<Chocadeira[]>([]);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroChocadeira, setFiltroChocadeira] = useState<string>('TODAS');
  const [filtroForma, setFiltroForma] = useState<string>('TODAS');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  // Modais e formulários
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Campos do formulário
  const [formTipo, setFormTipo] = useState<'RECEITA' | 'DESPESA'>('RECEITA');
  const [formFormaPagamento, setFormFormaPagamento] = useState<'BANCO' | 'DINHEIRO'>('BANCO');
  const [formValor, setFormValor] = useState<string>('');
  const [formData, setFormData] = useState<string>(getCurrentDateString());
  const [formCategoria, setFormCategoria] = useState<string>('Venda de Pintinhos');
  const [formDescricao, setFormDescricao] = useState<string>('');
  
  // Campos específicos para venda de pintinhos
  const [formChocadeiraId, setFormChocadeiraId] = useState<string>('');
  const [formQtdPintinhos, setFormQtdPintinhos] = useState<string>('');
  const [estoqueDisponivel, setEstoqueDisponivel] = useState<{ nascidos: number; vendidos: number; disponivel: number } | null>(null);

  // Erros no formulário
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Atualizar dados ao carregar ou realizar alterações
  const carregarDados = () => {
    setLancamentos(repo.getLancamentos());
    setChocadeiras(repo.getChocadeiras());
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Monitorar seleção de chocadeira no formulário para atualizar estoque dinamicamente
  useEffect(() => {
    if (formTipo === 'RECEITA' && formCategoria === 'Venda de Pintinhos' && formChocadeiraId) {
      const est = repo.getEstoquePintinhosPorChocadeira(formChocadeiraId, isEditMode && selectedId ? selectedId : undefined);
      setEstoqueDisponivel(est);
    } else {
      setEstoqueDisponivel(null);
    }
  }, [formChocadeiraId, formCategoria, formTipo, isEditMode, selectedId]);

  // Se o tipo mudar, ajustar categoria padrão
  useEffect(() => {
    if (formTipo === 'RECEITA') {
      setFormCategoria('Venda de Pintinhos');
    } else {
      setFormCategoria('Compra de Ração');
    }
  }, [formTipo]);

  // Filtros aplicados
  const lancamentosFiltrados = lancamentos.filter(l => {
    if (filtroTipo !== 'TODOS' && l.tipo !== filtroTipo) return false;
    
    if (filtroCategoria !== 'TODAS' && l.categoria !== filtroCategoria) return false;
    
    if (filtroChocadeira !== 'TODAS' && l.chocadeiraId !== filtroChocadeira) return false;

    if (filtroForma !== 'TODAS') {
      const isDinheiro = l.formaPagamento === 'DINHEIRO';
      if (filtroForma === 'DINHEIRO' && !isDinheiro) return false;
      if (filtroForma === 'BANCO' && isDinheiro) return false;
    }
    
    if (dataInicio && l.data < dataInicio) return false;
    
    if (dataFim && l.data > dataFim) return false;
    
    return true;
  });

  // Métricas financeiras baseadas nos lançamentos filtrados (ou gerais)
  const saldoBanco = lancamentos.reduce((sum, l) => {
    if (l.formaPagamento === 'DINHEIRO') return sum;
    return l.tipo === 'RECEITA' ? sum + l.valor : sum - l.valor;
  }, 0);

  const saldoDinheiro = lancamentos.reduce((sum, l) => {
    if (l.formaPagamento !== 'DINHEIRO') return sum;
    return l.tipo === 'RECEITA' ? sum + l.valor : sum - l.valor;
  }, 0);

  const totalReceitas = lancamentos.reduce((sum, l) => l.tipo === 'RECEITA' ? sum + l.valor : sum, 0);
  const totalDespesas = lancamentos.reduce((sum, l) => l.tipo === 'DESPESA' ? sum + l.valor : sum, 0);
  const saldoCaixa = totalReceitas - totalDespesas;

  // Total de pintinhos em estoque
  const estoquePintinhosTotal = chocadeiras.reduce((sum, ch) => {
    const est = repo.getEstoquePintinhosPorChocadeira(ch.id);
    return sum + est.disponivel;
  }, 0);

  // Categorias disponíveis por tipo
  const categoriasReceita = ['Venda de Pintinhos', 'Venda de Ovos', 'Subsídio/Vendas Gerais', 'Outros'];
  const categoriasDespesa = ['Compra de Ração', 'Medicamentos/Sanitários', 'Manutenção de Chocadeiras', 'Energia Elétrica', 'Outros'];

  // Abrir modal para novo lançamento
  const handleOpenNovo = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setFormTipo('RECEITA');
    setFormFormaPagamento('BANCO');
    setFormValor('');
    setFormData(getCurrentDateString());
    setFormCategoria('Venda de Pintinhos');
    setFormDescricao('');
    setFormChocadeiraId(chocadeiras[0]?.id || '');
    setFormQtdPintinhos('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  // Abrir modal para edição (Somente Admin)
  const handleOpenEdicao = (l: LancamentoFinanceiro) => {
    if (currentUser?.role !== 'ADMIN') return;
    
    setIsEditMode(true);
    setSelectedId(l.id);
    setFormTipo(l.tipo);
    setFormFormaPagamento(l.formaPagamento || 'BANCO');
    setFormValor(l.valor.toString());
    setFormData(l.data);
    setFormCategoria(l.categoria);
    setFormDescricao(l.descricao);
    setFormChocadeiraId(l.chocadeiraId || '');
    setFormQtdPintinhos(l.quantidadePintinhos?.toString() || '');
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  // Salvar lançamento
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const valorNum = parseFloat(formValor);
    if (isNaN(valorNum) || valorNum <= 0) {
      setErrorMsg('Por favor, insira um valor válido maior que zero.');
      return;
    }

    const payload: LancamentoFinanceiro = {
      id: selectedId || '',
      tipo: formTipo,
      formaPagamento: formFormaPagamento,
      valor: valorNum,
      descricao: formDescricao,
      data: formData,
      categoria: formCategoria,
      excluido: false,
      criadoEm: '',
      atualizadoEm: ''
    };

    // Validar venda de pintinhos
    if (formTipo === 'RECEITA' && formCategoria === 'Venda de Pintinhos') {
      if (!formChocadeiraId) {
        setErrorMsg('Selecione uma chocadeira de origem.');
        return;
      }
      const qtdNum = parseInt(formQtdPintinhos);
      if (isNaN(qtdNum) || qtdNum <= 0) {
        setErrorMsg('A quantidade de pintinhos deve ser um número inteiro positivo.');
        return;
      }
      payload.chocadeiraId = formChocadeiraId;
      payload.quantidadePintinhos = qtdNum;
      
      // Buscar a chocada mais recente finalizada ou associada à chocadeira para registrar opcionalmente o ID
      const chocadasChocadeira = repo.getChocadas().filter(c => c.chocadeiraId === formChocadeiraId && c.finalizada);
      if (chocadasChocadeira.length > 0) {
        payload.chocadaId = chocadasChocadeira[0].id; // Associa ao lote finalizado mais recente
      }
    }

    const res = await repo.saveLancamento(payload);
    if (res.success) {
      setSuccessMsg(res.message);
      carregarDados();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Excluir lançamento
  const handleDelete = async (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    
    if (confirm('Deseja realmente excluir este lançamento financeiro?')) {
      const res = await repo.deleteLancamento(id);
      if (res.success) {
        carregarDados();
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[#f7f2e9] text-[#263225]">
      
      {/* Cabeçalho principal */}
      <header className="flex flex-col min-[460px]:flex-row min-[460px]:justify-between min-[460px]:items-center gap-3 w-full px-4 sm:px-5 lg:px-8 py-4 border-b border-[#465336]/15 bg-[#fffaf2]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#6f756a] font-bold">Painel Geral</span>
          <h1 className="font-headline font-bold text-[#263225] text-lg leading-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#3f5f31]" /> Movimentação Financeira
          </h1>
        </div>

        {currentUser?.role !== 'LEITOR' && (
          <button
            onClick={handleOpenNovo}
            className="inline-flex w-full min-[460px]:w-auto items-center justify-center gap-2 rounded-xl bg-[#3f5f31] px-4 py-2.5 text-xs font-bold text-[#fffaf2] shadow-sm transition hover:bg-[#314b27] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        )}
      </header>

      {/* Grid de Métricas / Cards no topo */}
      <div className="flex-grow overflow-y-auto px-4 sm:px-5 lg:px-8 py-6 space-y-6 pb-32 lg:pb-24">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card glow borderAccent="primary" className="flex flex-col justify-center gap-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#3f5f31]/10 rounded-xl text-[#3f5f31] shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="w-full">
                <span className="text-[#6f756a] text-[9px] font-bold uppercase tracking-wider block">Saldo Geral</span>
                <h3 className={`text-xl font-black tracking-tight leading-none ${saldoCaixa >= 0 ? 'text-[#3f5f31]' : 'text-[#b85745]'}`}>
                  R$ {saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-[#465336]/10 text-[9px] font-bold uppercase tracking-wider">
              <span className="text-sky-700 flex items-center gap-1" title="Saldo em Conta Bancária">🏦 {saldoBanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-emerald-700 flex items-center gap-1" title="Saldo em Dinheiro">💵 {saldoDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </Card>

          <Card glow borderAccent="primary" className="flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 rounded-xl text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[#6f756a] text-[10px] font-bold uppercase tracking-wider block">Total Receitas</span>
              <h3 className="text-xl font-black text-emerald-700 tracking-tight mt-0.5">
                R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </Card>

          <Card glow borderAccent="error" className="flex items-center gap-4">
            <div className="p-3.5 bg-[#b85745]/10 rounded-xl text-[#b85745]">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[#6f756a] text-[10px] font-bold uppercase tracking-wider block">Total Despesas</span>
              <h3 className="text-xl font-black text-[#b85745] tracking-tight mt-0.5">
                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </Card>

          <Card glow borderAccent="tertiary" className="flex items-center gap-4">
            <div className="p-3.5 bg-[#8a744f]/10 rounded-xl text-[#8a744f]">
              <Egg className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[#6f756a] text-[10px] font-bold uppercase tracking-wider block">Estoque Geral de Pintinhos</span>
              <h3 className="text-xl font-black text-[#8a744f] tracking-tight mt-0.5">
                {estoquePintinhosTotal} pintinhos
              </h3>
            </div>
          </Card>
        </div>

        {/* Bloco de Filtros */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#465336]/10 pb-2">
            <Filter className="w-4 h-4 text-[#6f756a]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#6f756a]">Filtros de Movimentação</h3>
          </div>
          
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#6f756a] uppercase block mb-1">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full bg-[#fffdf8] border border-[#465336]/15 rounded-lg py-2 px-3 text-xs text-[#263225]"
              >
                <option value="TODOS">Todos os tipos</option>
                <option value="RECEITA">Receitas</option>
                <option value="DESPESA">Despesas</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#6f756a] uppercase block mb-1">Forma</label>
              <select
                value={filtroForma}
                onChange={(e) => setFiltroForma(e.target.value)}
                className="w-full bg-[#fffdf8] border border-[#465336]/15 rounded-lg py-2 px-3 text-xs text-[#263225]"
              >
                <option value="TODAS">Todas</option>
                <option value="BANCO">Conta/Pix</option>
                <option value="DINHEIRO">Dinheiro Vivo</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#6f756a] uppercase block mb-1">Categoria</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full bg-[#fffdf8] border border-[#465336]/15 rounded-lg py-2 px-3 text-xs text-[#263225]"
              >
                <option value="TODAS">Todas as categorias</option>
                <option value="Venda de Pintinhos">Venda de Pintinhos</option>
                <option value="Venda de Ovos">Venda de Ovos</option>
                <option value="Compra de Ração">Compra de Ração</option>
                <option value="Medicamentos/Sanitários">Medicamentos</option>
                <option value="Manutenção de Chocadeiras">Manutenção</option>
                <option value="Energia Elétrica">Energia Elétrica</option>
                <option value="Outros">Outras categorias</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#6f756a] uppercase block mb-1">Chocadeira</label>
              <select
                value={filtroChocadeira}
                onChange={(e) => setFiltroChocadeira(e.target.value)}
                className="w-full bg-[#fffdf8] border border-[#465336]/15 rounded-lg py-2 px-3 text-xs text-[#263225]"
              >
                <option value="TODAS">Todas as chocadeiras</option>
                {chocadeiras.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#6f756a] uppercase block mb-1">Data Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-[#fffdf8] border border-[#465336]/15 rounded-lg py-1.5 px-3 text-xs text-[#263225]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#6f756a] uppercase block mb-1">Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full bg-[#fffdf8] border border-[#465336]/15 rounded-lg py-1.5 px-3 text-xs text-[#263225]"
              />
            </div>
          </div>
        </Card>

        {/* Tabela de Lançamentos */}
        <Card className="overflow-hidden p-0">
          <div className="p-4 border-b border-[#465336]/10 flex flex-col min-[460px]:flex-row min-[460px]:justify-between min-[460px]:items-center gap-2 bg-[#fffaf2]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#263225]">Histórico de Transações</h3>
            <span className="text-[10px] font-mono text-[#6f756a] bg-[#f1eadf] px-2.5 py-1 rounded-full font-bold">
              {lancamentosFiltrados.length} lançamentos encontrados
            </span>
          </div>

          <div className="overflow-x-auto">
            {lancamentosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-[#6f756a] space-y-2">
                <Info className="w-8 h-8 text-[#6f756a]/40 mx-auto" />
                <p className="text-xs font-medium">Nenhuma movimentação financeira encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fffaf2]/50 border-b border-[#465336]/10 text-[#6f756a]">
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Data</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Tipo</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Forma</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Categoria</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Origem / Chocadeira</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Descrição</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Qtd.</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Valor</th>
                    {currentUser?.role === 'ADMIN' && (
                      <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-center">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#465336]/10">
                  {lancamentosFiltrados.map((l) => {
                    const chocadeira = chocadeiras.find(c => c.id === l.chocadeiraId);
                    
                    return (
                      <tr key={l.id} className="hover:bg-[#f1eadf]/30 transition-all">
                        <td className="p-4 font-semibold">{repo.formatReadableDate(l.data)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${
                            l.tipo === 'RECEITA' 
                              ? 'bg-emerald-500/10 text-emerald-700' 
                              : 'bg-[#b85745]/10 text-[#b85745]'
                          }`}>
                            {l.tipo === 'RECEITA' ? 'RECEITA' : 'DESPESA'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[10px] uppercase text-[#5f6659] flex items-center gap-1.5 mt-1">
                          {l.formaPagamento === 'DINHEIRO' ? '💵 Espécie' : '🏦 Conta'}
                        </td>
                        <td className="p-4 font-medium">{l.categoria}</td>
                        <td className="p-4 text-[#6f756a]">
                          {chocadeira ? (
                            <span className="inline-flex items-center gap-1">
                              <Egg className="w-3 h-3 text-[#3f5f31]" />
                              {chocadeira.nome}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-[#5f6659] max-w-[200px] truncate" title={l.descricao}>
                          {l.descricao || <span className="italic text-gray-400">Sem descrição</span>}
                        </td>
                        <td className="p-4 font-mono font-bold text-center">
                          {l.quantidadePintinhos ? `${l.quantidadePintinhos} ud` : '-'}
                        </td>
                        <td className={`p-4 font-bold font-mono text-right ${l.tipo === 'RECEITA' ? 'text-emerald-700' : 'text-[#b85745]'}`}>
                          {l.tipo === 'RECEITA' ? '+' : '-'} R$ {l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="p-4 text-center">
                            <div className="inline-flex gap-1.5 justify-center">
                              <button
                                onClick={() => handleOpenEdicao(l)}
                                className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                                title="Editar Lançamento"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(l.id)}
                                className="p-1.5 text-[#b85745] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir Lançamento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>

      </div>

      {/* Modal CRUD Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#fffaf2] border border-[#465336]/15 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#263225]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[#6f756a] hover:text-[#263225] hover:bg-[#f1eadf] rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold font-headline uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-[#465336]/10 pb-3">
              {isEditMode ? <Edit3 className="w-4.5 h-4.5 text-[#3f5f31]" /> : <PlusCircle className="w-4.5 h-4.5 text-[#3f5f31]" />}
              {isEditMode ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Avisos */}
              {errorMsg && (
                <div className="bg-[#b85745]/10 border border-[#b85745]/20 text-[#b85745] text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-[#3f5f31]/10 border border-[#3f5f31]/20 text-[#3f5f31] text-xs py-2.5 px-3.5 rounded-xl text-center font-bold">
                  {successMsg}
                </div>
              )}

              {/* Tipo e Forma */}
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
                {/* Tipo de Lançamento */}
                <div>
                  <label className="text-[10px] font-bold text-[#6f756a] uppercase block mb-1.5">Tipo</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormTipo('RECEITA')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                        formTipo === 'RECEITA'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 shadow-sm'
                          : 'border-[#465336]/15 hover:bg-[#f1eadf] text-[#5f6659]'
                      }`}
                    >
                      Receita (Crédito)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormTipo('DESPESA')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                        formTipo === 'DESPESA'
                          ? 'bg-[#b85745]/10 border-[#b85745]/25 text-[#b85745] shadow-sm'
                          : 'border-[#465336]/15 hover:bg-[#f1eadf] text-[#5f6659]'
                      }`}
                    >
                      Despesa (Débito)
                    </button>
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="text-[10px] font-bold text-[#6f756a] uppercase block mb-1.5">Forma de Pagto</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormFormaPagamento('BANCO')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formFormaPagamento === 'BANCO'
                          ? 'bg-sky-500/10 border-sky-500/30 text-sky-700 shadow-sm'
                          : 'border-[#465336]/15 hover:bg-[#f1eadf] text-[#5f6659]'
                      }`}
                    >
                      <span>🏦</span> Conta Bancária
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormFormaPagamento('DINHEIRO')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formFormaPagamento === 'DINHEIRO'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 shadow-sm'
                          : 'border-[#465336]/15 hover:bg-[#f1eadf] text-[#5f6659]'
                      }`}
                    >
                      <span>💵</span> Dinheiro
                    </button>
                  </div>
                </div>
              </div>

              {/* Data e Valor */}
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                <Input
                  label="Data"
                  type="date"
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                  required
                />
                
                <Input
                  label="Valor (R$)"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={formValor}
                  onChange={(e) => setFormValor(e.target.value)}
                  required
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="text-[10px] font-bold text-[#6f756a] uppercase block mb-1.5">Categoria</label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  className="w-full bg-[#fffdf8] border border-[#465336]/15 rounded-xl py-3 px-4 text-[#263225] focus:outline-none focus:ring-2 focus:ring-[#3f5f31]/20 focus:border-[#3f5f31] transition-all font-medium cursor-pointer text-xs"
                >
                  {formTipo === 'RECEITA' 
                    ? categoriasReceita.map(c => <option key={c} value={c}>{c}</option>)
                    : categoriasDespesa.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>

              {/* Formulário condicional de Venda de Pintinhos */}
              {formTipo === 'RECEITA' && formCategoria === 'Venda de Pintinhos' && (
                <div className="p-4 bg-[#f1eadf]/40 border border-[#465336]/12 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-[#3f5f31] text-[10px] font-bold uppercase tracking-wider">
                    <Egg className="w-3.5 h-3.5" /> Controle de Estoque
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-[#6f756a] uppercase block mb-1">Chocadeira de Origem</label>
                      <select
                        value={formChocadeiraId}
                        onChange={(e) => setFormChocadeiraId(e.target.value)}
                        className="w-full bg-[#fffdf8] border border-[#465336]/15 rounded-lg py-2 px-3 text-xs text-[#263225]"
                        required
                      >
                        <option value="" disabled>Selecione a chocadeira...</option>
                        {chocadeiras.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Mostrar informações de estoque */}
                    {formChocadeiraId && estoqueDisponivel && (
                      <div className="bg-[#fffaf2] border border-[#465336]/10 rounded-lg p-2.5 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#6f756a]">Pintinhos Nascidos:</span>
                          <span className="font-bold text-[#263225]">{estoqueDisponivel.nascidos} ud</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6f756a]">Vendas Registradas:</span>
                          <span className="font-bold text-[#263225]">{estoqueDisponivel.vendidos} ud</span>
                        </div>
                        <div className="flex justify-between border-t border-[#465336]/10 pt-1.5 font-bold text-emerald-800">
                          <span>Disponível p/ Venda:</span>
                          <span>{estoqueDisponivel.disponivel} ud</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] font-bold text-[#6f756a] uppercase block mb-1">Quantidade Vendida</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ex: 10"
                        value={formQtdPintinhos}
                        onChange={(e) => setFormQtdPintinhos(e.target.value)}
                        className="w-full bg-[#fffdf8] border border-[#465336]/15 rounded-lg py-2 px-3 text-xs text-[#263225]"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div>
                <label className="text-[10px] font-bold text-[#6f756a] uppercase block mb-1">Descrição / Observações</label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Compra de ração inicial de crescimento para pintinhos"
                  className="w-full bg-[#fffdf8] border border-[#465336]/15 rounded-xl py-3 px-4 text-[#263225] placeholder:text-[#9a9488] focus:outline-none focus:ring-2 focus:ring-[#3f5f31]/20 focus:border-[#3f5f31] transition-all font-medium text-xs h-18 resize-none"
                />
              </div>

              {/* Botões do Formulário */}
              <div className="flex flex-col min-[420px]:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-2.5 text-xs bg-[#3f5f31] hover:bg-[#314b27]"
                >
                  {isEditMode ? 'Atualizar' : 'Registrar'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
