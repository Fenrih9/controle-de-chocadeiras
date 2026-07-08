/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Edit3,
  Calculator,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft
} from 'lucide-react';
import { repo, getCurrentDateString } from '../repository';
import { LancamentoFinanceiro, Chocadeira, Usuario } from '../types';
import { Button, Card, Input } from './GlacierUI';
import { useAuth } from '../contexts/AuthContext';

// ============================================
// Função pura de cálculo (seção 3.1 do prompt)
// ============================================
type ModoValor = 'total' | 'unitario';

interface ResultadoCalculo {
  valorTotal: number | null;
  valorUnitario: number | null;
}

function calcularValores({ modo, valorDigitado, quantidade }: {
  modo: ModoValor;
  valorDigitado: number | null;
  quantidade: number | null;
}): ResultadoCalculo {
  if (!quantidade || quantidade <= 0) {
    return {
      valorTotal: modo === 'total' ? valorDigitado : null,
      valorUnitario: modo === 'unitario' ? valorDigitado : null,
    };
  }

  if (modo === 'total') {
    return {
      valorTotal: valorDigitado,
      valorUnitario: valorDigitado != null && valorDigitado > 0
        ? Math.round((valorDigitado / quantidade) * 100) / 100
        : null,
    };
  }

  // modo === 'unitario'
  return {
    valorTotal: valorDigitado != null && valorDigitado > 0
      ? Math.round((valorDigitado * quantidade) * 100) / 100
      : null,
    valorUnitario: valorDigitado,
  };
}

// ============================================
// Interface
// ============================================
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
  
  // Modo de valor (NOVO - seção 3.1 do prompt)
  const [modoValor, setModoValor] = useState<ModoValor>('total');

  // Erros no formulário
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // ============================================
  // Transferência entre contas (dinheiro ⇆ banco)
  // ============================================
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDirection, setTransferDirection] = useState<'paraConta' | 'paraDinheiro'>('paraConta');
  const [transferValor, setTransferValor] = useState<string>('');
  const [transferData, setTransferData] = useState<string>(getCurrentDateString());
  const [transferDescricao, setTransferDescricao] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);

  // ============================================
  // Verificar se a categoria tem controle de estoque
  // ============================================
  const temControleEstoque = formTipo === 'RECEITA' && formCategoria === 'Venda de Pintinhos';

  // ============================================
  // Cálculos derivados (pure function + memo)
  // ============================================
  const valorDigitadoNum = formValor ? parseFloat(formValor) : null;
  const qtdNum = formQtdPintinhos ? parseInt(formQtdPintinhos) : null;

  const resultadoCalculo = useMemo(() => {
    if (!temControleEstoque) {
      return {
        valorTotal: valorDigitadoNum,
        valorUnitario: null,
      };
    }
    return calcularValores({
      modo: modoValor,
      valorDigitado: valorDigitadoNum,
      quantidade: qtdNum && qtdNum > 0 ? qtdNum : null,
    });
  }, [modoValor, valorDigitadoNum, qtdNum, temControleEstoque]);

  // Valor efetivo que será salvo no banco (sempre o total)
  const valorEfetivo = resultadoCalculo.valorTotal;

  // ============================================
  // Dados para o card de prévia
  // ============================================
  const previewData = useMemo(() => {
    const tipoLabel = formTipo === 'RECEITA' ? 'Receita (Crédito)' : 'Despesa (Débito)';
    const categoriaLabel = formCategoria || '—';
    
    if (!temControleEstoque) {
      return {
        tipoLabel,
        categoriaLabel,
        quantidade: null,
        valorUnitario: null,
        valorTotal: valorDigitadoNum,
        estoqueAntes: null,
        estoqueDepois: null,
        excedeEstoque: false,
      };
    }

    const estoqueAntes = estoqueDisponivel?.disponivel ?? null;
    const estoqueDepois = estoqueAntes != null && qtdNum && qtdNum > 0
      ? estoqueAntes - qtdNum
      : null;
    const excedeEstoque = estoqueDepois != null && estoqueDepois < 0;

    return {
      tipoLabel,
      categoriaLabel,
      quantidade: qtdNum && qtdNum > 0 ? qtdNum : null,
      valorUnitario: resultadoCalculo.valorUnitario,
      valorTotal: resultadoCalculo.valorTotal,
      estoqueAntes,
      estoqueDepois,
      excedeEstoque,
    };
  }, [formTipo, formCategoria, temControleEstoque, valorDigitadoNum, qtdNum, resultadoCalculo, estoqueDisponivel]);



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

  // Se o tipo mudar, ajustar categoria padrão e resetar modoValor
  useEffect(() => {
    if (formTipo === 'RECEITA') {
      setFormCategoria('Venda de Pintinhos');
    } else {
      setFormCategoria('Compra de Ração');
    }
    setModoValor('total');
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

  // Métricas financeiras
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

  const estoquePintinhosTotal = chocadeiras.reduce((sum, ch) => {
    const est = repo.getEstoquePintinhosPorChocadeira(ch.id);
    return sum + est.disponivel;
  }, 0);

  // Categorias disponíveis por tipo
  const categoriasReceita = ['Venda de Pintinhos', 'Venda de Ovos', 'Subsídio/Vendas Gerais', 'Transferência entre contas', 'Outros'];
  const categoriasDespesa = ['Compra de Ração', 'Medicamentos/Sanitários', 'Manutenção de Chocadeiras', 'Energia Elétrica', 'Transferência entre contas', 'Outros'];

  // ============================================
  // Abrir modal de transferência entre contas
  // ============================================
  const handleOpenTransferModal = () => {
    setTransferDirection('paraConta');
    setTransferValor('');
    setTransferData(getCurrentDateString());
    setTransferDescricao('');
    setTransferError('');
    setTransferSuccess('');
    setTransferLoading(false);
    setIsTransferModalOpen(true);
  };

  // ============================================
  // Executar transferência entre contas
  // ============================================
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    const valor = parseFloat(transferValor);
    if (!valor || isNaN(valor) || valor <= 0) {
      setTransferError('Por favor, insira um valor válido maior que zero.');
      return;
    }

    if (!transferData) {
      setTransferError('A data da transferência é obrigatória.');
      return;
    }

    // Validar saldo disponível na origem
    if (transferDirection === 'paraConta' && valor > saldoDinheiro) {
      setTransferError(`Saldo em dinheiro insuficiente. Disponível: R$ ${saldoDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      return;
    }
    if (transferDirection === 'paraDinheiro' && valor > saldoBanco) {
      setTransferError(`Saldo em conta insuficiente. Disponível: R$ ${saldoBanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      return;
    }

    setTransferLoading(true);

    // Criar descrição padronizada
    const desc = transferDescricao.trim()
      ? `Transferência: ${transferDescricao.trim()}`
      : `Transferência entre contas`;

    const timestamp = Date.now();

    // Lançamento 1: DESPESA na origem (dinheiro ou banco)
    const saida: LancamentoFinanceiro = {
      id: `transf-saida-${timestamp}`,
      tipo: 'DESPESA',
      formaPagamento: transferDirection === 'paraConta' ? 'DINHEIRO' : 'BANCO',
      valor,
      descricao: `${desc} (saída)`,
      data: transferData,
      categoria: 'Transferência entre contas',
      excluido: false,
      criadoEm: '',
      atualizadoEm: '',
    };

    // Lançamento 2: RECEITA no destino (banco ou dinheiro)
    const entrada: LancamentoFinanceiro = {
      id: `transf-entrada-${timestamp}`,
      tipo: 'RECEITA',
      formaPagamento: transferDirection === 'paraConta' ? 'BANCO' : 'DINHEIRO',
      valor,
      descricao: `${desc} (entrada)`,
      data: transferData,
      categoria: 'Transferência entre contas',
      excluido: false,
      criadoEm: '',
      atualizadoEm: '',
    };

    const resSaida = await repo.saveLancamento(saida);
    if (!resSaida.success) {
      setTransferError(`Erro ao registrar saída: ${resSaida.message}`);
      setTransferLoading(false);
      return;
    }

    const resEntrada = await repo.saveLancamento(entrada);
    if (!resEntrada.success) {
      setTransferError(`Erro ao registrar entrada: ${resEntrada.message}`);
      setTransferLoading(false);
      return;
    }

    setTransferSuccess(`Transferência de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} realizada com sucesso!`);
    carregarDados();
    setTransferLoading(false);

    setTimeout(() => {
      setIsTransferModalOpen(false);
    }, 1500);
  };

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
    setModoValor('total');
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
    setModoValor('total');
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  // Salvar lançamento
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Usar o valor efetivo (sempre total) para validação
    const valorFinal = valorEfetivo;
    if (valorFinal == null || isNaN(valorFinal) || valorFinal <= 0) {
      setErrorMsg('Por favor, insira um valor válido maior que zero.');
      return;
    }

    const payload: LancamentoFinanceiro = {
      id: selectedId || '',
      tipo: formTipo,
      formaPagamento: formFormaPagamento,
      valor: valorFinal,
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
      const qtd = parseInt(formQtdPintinhos);
      if (isNaN(qtd) || qtd <= 0) {
        setErrorMsg('A quantidade de pintinhos deve ser um número inteiro positivo.');
        return;
      }
      
      // Validação de estoque (NOVO - bloquear se exceder)
      if (estoqueDisponivel && qtd > estoqueDisponivel.disponivel) {
        setErrorMsg(`Quantidade (${qtd} ud) excede o estoque disponível (${estoqueDisponivel.disponivel} ud). Reduza a quantidade ou ajuste o estoque.`);
        return;
      }
      
      payload.chocadeiraId = formChocadeiraId;
      payload.quantidadePintinhos = qtd;
      
      const chocadasChocadeira = repo.getChocadas().filter(c => c.chocadeiraId === formChocadeiraId && c.finalizada);
      if (chocadasChocadeira.length > 0) {
        payload.chocadaId = chocadasChocadeira[0].id;
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

  // ============================================
  // Helpers de formatação
  // ============================================
  const fmtBRL = (v: number | null) => {
    if (v == null) return '—';
    return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      
      {/* Cabeçalho principal */}
      <header className="flex flex-col min-[460px]:flex-row min-[460px]:justify-between min-[460px]:items-center gap-3 w-full px-4 sm:px-5 lg:px-8 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 shrink-0 z-10">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-bold">Painel Geral</span>
          <h1 className="font-headline font-bold text-[var(--color-text)] text-lg leading-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[var(--color-brand)]" /> Movimentação Financeira
          </h1>
        </div>

        {currentUser?.role !== 'LEITOR' && (
          <div className="flex flex-col min-[460px]:flex-row gap-2 w-full min-[460px]:w-auto">
            <button
              onClick={handleOpenTransferModal}
              className="inline-flex w-full min-[460px]:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 px-4 py-2.5 text-xs font-bold text-[var(--color-accent)] shadow-sm transition hover:bg-[var(--color-accent)]/20 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" /> Transferir
            </button>
            <button
              onClick={handleOpenNovo}
              className="inline-flex w-full min-[460px]:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--color-brand-hover)] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Novo Lançamento
            </button>
          </div>
        )}
      </header>

      {/* Grid de Métricas / Cards no topo */}
      <div className="flex-grow overflow-y-auto px-4 sm:px-5 lg:px-8 py-6 space-y-6 pb-32 lg:pb-24">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card glow borderAccent="primary" className="flex flex-col justify-center gap-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--color-brand)]/10 rounded-xl text-[var(--color-brand)] shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="w-full">
                <span className="text-[var(--color-muted)] text-[9px] font-bold uppercase tracking-wider block">Saldo Geral</span>
                <h3 className={`text-xl font-black tracking-tight leading-none ${saldoCaixa >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                  R$ {saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-[var(--color-line)] text-[9px] font-bold uppercase tracking-wider">
              <span className="text-[var(--color-accent)] flex items-center gap-1" title="Saldo em Conta Bancária">🏦 {saldoBanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-[var(--color-success)] flex items-center gap-1" title="Saldo em Dinheiro">💵 {saldoDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </Card>

          <Card glow borderAccent="primary" className="flex items-center gap-4">
            <div className="p-3.5 bg-[var(--color-success)]/10 rounded-xl text-[var(--color-success)]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[var(--color-muted)] text-[10px] font-bold uppercase tracking-wider block">Total Receitas</span>
              <h3 className="text-xl font-black text-[var(--color-success)] tracking-tight mt-0.5">
                R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </Card>

          <Card glow borderAccent="error" className="flex items-center gap-4">
            <div className="p-3.5 bg-[var(--color-danger)]/10 rounded-xl text-[var(--color-danger)]">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[var(--color-muted)] text-[10px] font-bold uppercase tracking-wider block">Total Despesas</span>
              <h3 className="text-xl font-black text-[var(--color-danger)] tracking-tight mt-0.5">
                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </Card>

          <Card glow borderAccent="tertiary" className="flex items-center gap-4">
            <div className="p-3.5 bg-[var(--color-accent)]/10 rounded-xl text-[var(--color-accent)]">
              <Egg className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[var(--color-muted)] text-[10px] font-bold uppercase tracking-wider block">Estoque Geral de Pintinhos</span>
              <h3 className="text-xl font-black text-[var(--color-accent)] tracking-tight mt-0.5">
                {estoquePintinhosTotal} pintinhos
              </h3>
            </div>
          </Card>
        </div>

        {/* Bloco de Filtros */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-line)] pb-2">
            <Filter className="w-4 h-4 text-[var(--color-muted)]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Filtros de Movimentação</h3>
          </div>
          
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-2 px-3 text-xs text-[var(--color-text)]"
              >
                <option value="TODOS">Todos os tipos</option>
                <option value="RECEITA">Receitas</option>
                <option value="DESPESA">Despesas</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Forma</label>
              <select
                value={filtroForma}
                onChange={(e) => setFiltroForma(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-2 px-3 text-xs text-[var(--color-text)]"
              >
                <option value="TODAS">Todas</option>
                <option value="BANCO">Conta/Pix</option>
                <option value="DINHEIRO">Dinheiro Vivo</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Categoria</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-2 px-3 text-xs text-[var(--color-text)]"
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
              <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Chocadeira</label>
              <select
                value={filtroChocadeira}
                onChange={(e) => setFiltroChocadeira(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-2 px-3 text-xs text-[var(--color-text)]"
              >
                <option value="TODAS">Todas as chocadeiras</option>
                {chocadeiras.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Data Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-1.5 px-3 text-xs text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-1.5 px-3 text-xs text-[var(--color-text)]"
              />
            </div>
          </div>
        </Card>

        {/* Tabela de Lançamentos */}
        <Card className="overflow-hidden p-0">
          <div className="p-4 border-b border-[var(--color-line)] flex flex-col min-[460px]:flex-row min-[460px]:justify-between min-[460px]:items-center gap-2 bg-[var(--color-surface)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]">Histórico de Transações</h3>
            <span className="text-[10px] font-mono text-[var(--color-muted)] bg-[var(--color-bg)] px-2.5 py-1 rounded-full font-bold">
              {lancamentosFiltrados.length} lançamentos encontrados
            </span>
          </div>

          <div className="overflow-x-auto">
            {lancamentosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-muted)] space-y-2">
                <Info className="w-8 h-8 text-[var(--color-muted)]/40 mx-auto" />
                <p className="text-xs font-medium">Nenhuma movimentação financeira encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface)] border-b border-[var(--color-line)] text-[var(--color-muted)]">
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
                <tbody className="divide-y divide-[var(--color-line)]">
                  {lancamentosFiltrados.map((l) => {
                    const chocadeira = chocadeiras.find(c => c.id === l.chocadeiraId);
                    
                    return (
                      <tr key={l.id} className="hover:bg-[var(--color-bg)]/50 transition-all">
                        <td className="p-4 font-semibold">{repo.formatReadableDate(l.data)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${
                            l.tipo === 'RECEITA' 
                              ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' 
                              : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                          }`}>
                            {l.tipo === 'RECEITA' ? 'RECEITA' : 'DESPESA'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[10px] uppercase text-[var(--color-muted)] flex items-center gap-1.5 mt-1">
                          {l.formaPagamento === 'DINHEIRO' ? '💵 Espécie' : '🏦 Conta'}
                        </td>
                        <td className="p-4 font-medium">{l.categoria}</td>
                        <td className="p-4 text-[var(--color-muted)]">
                          {chocadeira ? (
                            <span className="inline-flex items-center gap-1">
                              <Egg className="w-3 h-3 text-[var(--color-brand)]" />
                              {chocadeira.nome}
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)]">-</span>
                          )}
                        </td>
                        <td className="p-4 text-[var(--color-text)] max-w-[200px] truncate" title={l.descricao}>
                          {l.descricao || <span className="italic text-[var(--color-muted)]">Sem descrição</span>}
                        </td>
                        <td className="p-4 font-mono font-bold text-center">
                          {l.quantidadePintinhos ? `${l.quantidadePintinhos} ud` : '-'}
                        </td>
                        <td className={`p-4 font-bold font-mono text-right ${l.tipo === 'RECEITA' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                          {l.tipo === 'RECEITA' ? '+' : '-'} R$ {l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="p-4 text-center">
                            <div className="inline-flex gap-1.5 justify-center">
                              <button
                                onClick={() => handleOpenEdicao(l)}
                                className="p-1.5 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 rounded-lg transition-colors cursor-pointer"
                                title="Editar Lançamento"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(l.id)}
                                className="p-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors cursor-pointer"
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

      {/* ============================================
          Modal CRUD Lançamento
          ============================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[var(--color-text)]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold font-headline uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
              {isEditMode ? <Edit3 className="w-4.5 h-4.5 text-[var(--color-brand)]" /> : <PlusCircle className="w-4.5 h-4.5 text-[var(--color-brand)]" />}
              {isEditMode ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Avisos */}
              {errorMsg && (
                <div className="bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-xs py-2.5 px-3.5 rounded-xl text-center font-bold">
                  {successMsg}
                </div>
              )}

              {/* Tipo e Forma */}
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
                {/* Tipo de Lançamento */}
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1.5">Tipo</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormTipo('RECEITA')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                        formTipo === 'RECEITA'
                          ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)] shadow-sm'
                          : 'border-[var(--color-line)] hover:bg-[var(--color-bg)] text-[var(--color-muted)]'
                      }`}
                    >
                      Receita (Crédito)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormTipo('DESPESA')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                        formTipo === 'DESPESA'
                          ? 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/25 text-[var(--color-danger)] shadow-sm'
                          : 'border-[var(--color-line)] hover:bg-[var(--color-bg)] text-[var(--color-muted)]'
                      }`}
                    >
                      Despesa (Débito)
                    </button>
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1.5">Forma de Pagto</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormFormaPagamento('BANCO')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formFormaPagamento === 'BANCO'
                          ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)] shadow-sm'
                          : 'border-[var(--color-line)] hover:bg-[var(--color-bg)] text-[var(--color-muted)]'
                      }`}
                    >
                      <span>🏦</span> Conta Bancária
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormFormaPagamento('DINHEIRO')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formFormaPagamento === 'DINHEIRO'
                          ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)] shadow-sm'
                          : 'border-[var(--color-line)] hover:bg-[var(--color-bg)] text-[var(--color-muted)]'
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
                  label={
                    temControleEstoque
                      ? modoValor === 'total'
                        ? 'Valor Total da Venda (R$)'
                        : 'Valor Unitário por Pintinho (R$)'
                      : 'Valor (R$)'
                  }
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={formValor}
                  onChange={(e) => setFormValor(e.target.value)}
                  required
                  helperText={
                    temControleEstoque
                      ? modoValor === 'total'
                        ? 'Informe o valor total da venda'
                        : 'Informe o preço por pintinho/unidade'
                      : undefined
                  }
                />
              </div>

              {/* ============================================
                  Toggle de Modo de Valor (seção 3.1 do prompt)
                  ============================================ */}
              {temControleEstoque && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block">
                    Informar valor por:
                  </label>
                  <div
                    className="flex rounded-xl border border-[var(--color-line)] overflow-hidden"
                    role="group"
                    aria-label="Modo de entrada do valor"
                  >
                    <button
                      type="button"
                      onClick={() => setModoValor('total')}
                      aria-pressed={modoValor === 'total'}
                      className={`flex-1 py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                        modoValor === 'total'
                          ? 'bg-[var(--color-brand)] text-white shadow-sm'
                          : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Valor Total da Venda
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoValor('unitario')}
                      aria-pressed={modoValor === 'unitario'}
                      className={`flex-1 py-2.5 px-3 text-xs font-bold transition-all cursor-pointer border-l border-[var(--color-line)] ${
                        modoValor === 'unitario'
                          ? 'bg-[var(--color-brand)] text-white shadow-sm'
                          : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5" />
                        Valor Unitário
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Categoria */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1.5">Categoria</label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium cursor-pointer text-xs"
                >
                  {formTipo === 'RECEITA' 
                    ? categoriasReceita.map(c => <option key={c} value={c}>{c}</option>)
                    : categoriasDespesa.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>

              {/* ============================================
                  Formulário condicional de Venda de Pintinhos
                  ============================================ */}
              {temControleEstoque && (
                <div className="p-4 bg-[var(--color-bg)] border border-[var(--color-line)] rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-[var(--color-brand)] text-[10px] font-bold uppercase tracking-wider">
                    <Egg className="w-3.5 h-3.5" /> Controle de Estoque
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-[var(--color-muted)] uppercase block mb-1">Chocadeira de Origem</label>
                      <select
                        value={formChocadeiraId}
                        onChange={(e) => setFormChocadeiraId(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-2 px-3 text-xs text-[var(--color-text)]"
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
                      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg p-2.5 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[var(--color-muted)]">Pintinhos Nascidos:</span>
                          <span className="font-bold text-[var(--color-text)]">{estoqueDisponivel.nascidos} ud</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-muted)]">Vendas Registradas:</span>
                          <span className="font-bold text-[var(--color-text)]">{estoqueDisponivel.vendidos} ud</span>
                        </div>
                        <div className="flex justify-between border-t border-[var(--color-line)] pt-1.5 font-bold text-[var(--color-success)]">
                          <span>Disponível p/ Venda:</span>
                          <span>{estoqueDisponivel.disponivel} ud</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] font-bold text-[var(--color-muted)] uppercase block mb-1">Quantidade Vendida</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ex: 10"
                        value={formQtdPintinhos}
                        onChange={(e) => setFormQtdPintinhos(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg py-2 px-3 text-xs text-[var(--color-text)]"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================
                  Card de Prévia do Lançamento (seção 3.2 do prompt)
                  Sempre visível — campos não preenchidos mostram "—"
                  ============================================ */}
              <div className={`rounded-xl border p-4 space-y-2.5 transition-colors duration-200 ${
                previewData.excedeEstoque
                  ? 'bg-[var(--color-danger)]/5 border-[var(--color-danger)]/30'
                  : 'bg-[var(--color-brand)]/5 border-[var(--color-brand)]/20'
              }`}>
                <div className="flex items-center gap-1.5 text-[var(--color-brand)] text-[10px] font-bold uppercase tracking-wider">
                  <Calculator className="w-3.5 h-3.5" /> Resumo do Lançamento
                </div>
                
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-muted)]">Tipo:</span>
                    <span className="font-bold text-[var(--color-text)]">{previewData.tipoLabel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-muted)]">Categoria:</span>
                    <span className="font-bold text-[var(--color-text)]">{previewData.categoriaLabel}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-muted)]">Quantidade:</span>
                    <span className="font-bold text-[var(--color-text)]">
                      {previewData.quantidade != null ? `${previewData.quantidade} unidades` : '—'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-muted)]">Valor unitário:</span>
                    <span className="font-bold text-[var(--color-text)]">
                      {previewData.valorUnitario != null ? fmtBRL(previewData.valorUnitario) : '—'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1.5 border-t border-[var(--color-line)]">
                    <span className="text-[var(--color-muted)] font-semibold">Valor total:</span>
                    <span className="text-sm font-black text-[var(--color-brand)]">
                      {previewData.valorTotal != null && previewData.valorTotal > 0 ? fmtBRL(previewData.valorTotal) : '—'}
                    </span>
                  </div>

                  {/* Linhas de estoque (apenas quando aplicável) */}
                  {previewData.estoqueAntes != null && (
                    <>
                      <div className="flex justify-between items-center pt-2 border-t border-[var(--color-line)]">
                        <span className="text-[var(--color-muted)]">Estoque antes:</span>
                        <span className="font-bold text-[var(--color-text)]">{previewData.estoqueAntes} disponíveis</span>
                      </div>
                      <div className={`flex justify-between items-center ${
                        previewData.excedeEstoque ? 'text-[var(--color-danger)] font-bold' : ''
                      }`}>
                        <span className="text-[var(--color-muted)]">Estoque depois:</span>
                        <span className={`font-bold ${previewData.excedeEstoque ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                          {previewData.estoqueDepois != null ? `${previewData.estoqueDepois} disponíveis` : '—'}
                        </span>
                      </div>
                      {previewData.excedeEstoque && (
                        <div className="flex items-center gap-1.5 text-[var(--color-danger)] text-[10px] font-bold mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Quantidade excede o estoque disponível
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Descrição / Observações</label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Compra de ração inicial de crescimento para pintinhos"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-text)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium text-xs h-18 resize-none"
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
                  className="flex-1 py-2.5 text-xs"
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
