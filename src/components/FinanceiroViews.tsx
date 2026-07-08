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
  ArrowRightLeft,
  Repeat,
  Calendar,
  BarChart3,
  ChartPie
} from 'lucide-react';
import { repo, getCurrentDateString } from '../repository';
import { LancamentoFinanceiro, TransferenciaAgendada, Chocadeira, Usuario } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Button, Card, Input } from './GlacierUI';
import { useAuth } from '../contexts/AuthContext';

// Cores para gráfico de pizza
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#ec4899'];

const MESES_NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

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
  // Transferências Agendadas (recorrentes)
  // ============================================
  const [agendamentos, setAgendamentos] = useState<TransferenciaAgendada[]>([]);
  const [isAgendarModalOpen, setIsAgendarModalOpen] = useState(false);
  const [agendamentoValor, setAgendamentoValor] = useState<string>('');
  const [agendamentoDirection, setAgendamentoDirection] = useState<'paraConta' | 'paraDinheiro'>('paraConta');
  const [agendamentoDescricao, setAgendamentoDescricao] = useState<string>('');
  const [agendamentoDia, setAgendamentoDia] = useState<string>('5');
  const [agendamentoError, setAgendamentoError] = useState<string>('');
  const [agendamentoSuccess, setAgendamentoSuccess] = useState<string>('');
  const [agendamentoLoading, setAgendamentoLoading] = useState(false);
  const [agendamentoEditId, setAgendamentoEditId] = useState<string | null>(null);

  // ============================================
  // Relatório Mensal
  // ============================================
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportAno, setReportAno] = useState(new Date().getFullYear().toString());
  const [reportMes, setReportMes] = useState<string>('todas');

  // Dados do relatório mensal
  const reportData = useMemo(() => {
    if (lancamentos.length === 0) return { meses: [], resumo: { receitas: 0, despesas: 0, saldo: 0 } };

    const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Filtrar lançamentos do ano selecionado, excluindo transferências entre contas
    const filtrados = lancamentos.filter(l => {
      if (l.categoria === 'Transferência entre contas') return false;
      return l.data.substring(0, 4) === reportAno;
    });

    // Agrupar por mês
    const meses: { mes: number; label: string; receitas: number; despesas: number; saldo: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const doMes = filtrados.filter(l => parseInt(l.data.substring(5, 7), 10) - 1 === i);
      const receitas = doMes.filter(l => l.tipo === 'RECEITA').reduce((s, l) => s + l.valor, 0);
      const despesas = doMes.filter(l => l.tipo === 'DESPESA').reduce((s, l) => s + l.valor, 0);
      meses.push({ mes: i, label: MESES_ABREV[i], receitas, despesas, saldo: receitas - despesas });
    }

    // Se um mês específico foi selecionado, filtrar
    const mesesExibir = reportMes === 'todas' ? meses : meses.filter(m => m.mes === parseInt(reportMes));

    const receitas = filtrados.filter(l => l.tipo === 'RECEITA').reduce((s, l) => s + l.valor, 0);
    const despesas = filtrados.filter(l => l.tipo === 'DESPESA').reduce((s, l) => s + l.valor, 0);
    const resumo = { receitas, despesas, saldo: receitas - despesas };

    return { meses: mesesExibir, resumo };
  }, [lancamentos, reportAno, reportMes]);

  // Dados para gráfico de pizza por categoria
  const pieData = useMemo(() => {
    const filtrados = lancamentos.filter(l => {
      if (l.categoria === 'Transferência entre contas') return false;
      return l.data.substring(0, 4) === reportAno;
    });

    // Categorias por tipo
    const receitas: Record<string, number> = {};
    const despesas: Record<string, number> = {};

    filtrados.forEach(l => {
      if (l.tipo === 'RECEITA') {
        receitas[l.categoria] = (receitas[l.categoria] || 0) + l.valor;
      } else {
        despesas[l.categoria] = (despesas[l.categoria] || 0) + l.valor;
      }
    });

    return {
      receitas: Object.entries(receitas).map(([name, value]) => ({ name, value })),
      despesas: Object.entries(despesas).map(([name, value]) => ({ name, value })),
    };
  }, [lancamentos, reportAno, reportMes]);

  // Anos disponíveis para o relatório
  const anosDisponiveisRelatorio = useMemo(() => {
    return Array.from(new Set(lancamentos.map(l => l.data.substring(0, 4)))).sort().reverse() as string[];
  }, [lancamentos]);

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
  // Carregar agendamentos e executar vencidos
  // ============================================
  const carregarAgendamentos = () => {
    setAgendamentos(repo.getTransferenciasAgendadas());
  };

  useEffect(() => {
    carregarAgendamentos();
    // Executar transferências agendadas que estão vencidas
    repo.executarTransferenciasAgendadas().then(executadas => {
      if (executadas > 0) {
        carregarDados();
        carregarAgendamentos();
      }
    });
  }, []);

  // ============================================
  // Abrir modal de agendamento
  // ============================================
  const handleOpenAgendarModal = (editItem?: TransferenciaAgendada) => {
    if (editItem) {
      setAgendamentoEditId(editItem.id);
      setAgendamentoValor(editItem.valor.toString());
      setAgendamentoDirection(editItem.direction);
      setAgendamentoDescricao(editItem.descricao);
      setAgendamentoDia(editItem.diaVencimento.toString());
    } else {
      setAgendamentoEditId(null);
      setAgendamentoValor('');
      setAgendamentoDirection('paraConta');
      setAgendamentoDescricao('');
      setAgendamentoDia('5');
    }
    setAgendamentoError('');
    setAgendamentoSuccess('');
    setAgendamentoLoading(false);
    setIsAgendarModalOpen(true);
  };

  // ============================================
  // Salvar agendamento
  // ============================================
  const handleSaveAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgendamentoError('');
    setAgendamentoSuccess('');

    const valor = parseFloat(agendamentoValor);
    if (!valor || isNaN(valor) || valor <= 0) {
      setAgendamentoError('Por favor, insira um valor válido maior que zero.');
      return;
    }

    const dia = parseInt(agendamentoDia);
    if (isNaN(dia) || dia < 1 || dia > 31) {
      setAgendamentoError('O dia deve estar entre 1 e 31.');
      return;
    }

    setAgendamentoLoading(true);

    const existing = agendamentoEditId
      ? repo.getTransferenciasAgendadas().find(t => t.id === agendamentoEditId)
      : undefined;

    const payload: TransferenciaAgendada = {
      id: agendamentoEditId || '',
      valor,
      direction: agendamentoDirection,
      descricao: agendamentoDescricao.trim(),
      diaVencimento: dia,
      ultimaExecucao: existing?.ultimaExecucao || null,
      ativo: true,
      criadoEm: existing?.criadoEm || '',
    };

    const res = await repo.saveTransferenciaAgendada(payload);
    if (res.success) {
      setAgendamentoSuccess('Agendamento salvo com sucesso!');
      carregarAgendamentos();
      setAgendamentoLoading(false);
      setTimeout(() => {
        setIsAgendarModalOpen(false);
      }, 1200);
    } else {
      setAgendamentoError(res.message);
      setAgendamentoLoading(false);
    }
  };

  // ============================================
  // Excluir agendamento
  // ============================================
  const handleExcluirAgendamento = async (id: string) => {
    if (confirm('Deseja realmente remover este agendamento?')) {
      const res = await repo.deleteTransferenciaAgendada(id);
      if (res.success) {
        carregarAgendamentos();
      } else {
        alert(res.message);
      }
    }
  };

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
            {agendamentos.length > 0 && (
              <button
                onClick={() => handleOpenAgendarModal()}
                className="inline-flex w-full min-[460px]:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 px-4 py-2.5 text-xs font-bold text-[var(--color-warning)] shadow-sm transition hover:bg-[var(--color-warning)]/20 cursor-pointer"
                title="Gerenciar transferências agendadas"
              >
                <Calendar className="w-4 h-4" /> Agendamentos
              </button>
            )}
            <button
              onClick={handleOpenNovo}
              className="inline-flex w-full min-[460px]:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--color-brand-hover)] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Novo Lançamento
            </button>
            <button
              onClick={() => { setReportAno(new Date().getFullYear().toString()); setReportMes('todas'); setIsReportModalOpen(true); }}
              className="inline-flex w-full min-[460px]:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] px-4 py-2.5 text-xs font-bold text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface-hover)] cursor-pointer"
              title="Relatório Mensal"
            >
              <BarChart3 className="w-4 h-4" /> Relatório
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
                <option value="Transferência entre contas">Transferência entre contas</option>
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

        {/* Card de Transferências Agendadas */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--color-line)] pb-2 mb-4">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[var(--color-warning)]" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Transferências Agendadas (Recorrentes)</h3>
            </div>
            <button
              onClick={() => handleOpenAgendarModal()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-[10px] font-bold uppercase tracking-wider transition hover:bg-[var(--color-warning)]/20 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Novo Agendamento
            </button>
          </div>

          {agendamentos.length === 0 ? (
            <div className="text-center py-6 text-[var(--color-muted)] space-y-2">
              <Repeat className="w-8 h-8 text-[var(--color-muted)]/30 mx-auto" />
              <p className="text-xs font-medium">Nenhum agendamento ativo.</p>
              <button
                onClick={() => handleOpenAgendarModal()}
                className="text-[var(--color-warning)] text-[10px] font-bold underline hover:no-underline cursor-pointer"
              >
                Criar agendamento recorrente
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {agendamentos.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-[var(--color-bg)] border border-[var(--color-line)] rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                      t.direction === 'paraConta'
                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                        : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                    }`}>
                      {t.direction === 'paraConta' ? '💵→🏦' : '🏦→💵'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--color-ink)] truncate">
                        {t.descricao || 'Transferência recorrente'}
                      </p>
                      <p className="text-[10px] text-[var(--color-muted)]">
                        <span className="font-bold">Dia {t.diaVencimento}°</span> de cada mês · 
                        R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.ultimaExecucao && (
                      <span className="text-[9px] text-[var(--color-success)] font-bold" title="Última execução">
                        ✓ {t.ultimaExecucao.substring(8,10)}/{t.ultimaExecucao.substring(5,7)}
                      </span>
                    )}
                    <button
                      onClick={() => handleOpenAgendarModal(t)}
                      className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-all cursor-pointer"
                      title="Editar agendamento"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleExcluirAgendamento(t.id)}
                      className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-all cursor-pointer"
                      title="Excluir agendamento"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

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

      {/* ============================================
          Modal de Agendamento Recorrente
          ============================================ */}
      {isAgendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAgendarModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[var(--color-text)]">
            <button
              onClick={() => setIsAgendarModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold font-headline uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
              <Repeat className="w-4.5 h-4.5 text-[var(--color-warning)]" />
              {agendamentoEditId ? 'Editar Agendamento' : 'Nova Transferência Recorrente'}
            </h3>

            <form onSubmit={handleSaveAgendamento} className="space-y-4">

              {agendamentoError && (
                <div className="bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{agendamentoError}</span>
                </div>
              )}

              {agendamentoSuccess && (
                <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-xs py-2.5 px-3.5 rounded-xl text-center font-bold">
                  {agendamentoSuccess}
                </div>
              )}

              {/* Direção */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1.5">Direção da Transferência</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAgendamentoDirection('paraConta')}
                    className={`py-3 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                      agendamentoDirection === 'paraConta'
                        ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)] shadow-sm'
                        : 'border-[var(--color-line)] hover:bg-[var(--color-bg)] text-[var(--color-muted)]'
                    }`}
                  >
                    <span className="block mb-0.5 text-base">💵 → 🏦</span>
                    <span>Dinheiro → Conta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendamentoDirection('paraDinheiro')}
                    className={`py-3 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                      agendamentoDirection === 'paraDinheiro'
                        ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)] shadow-sm'
                        : 'border-[var(--color-line)] hover:bg-[var(--color-bg)] text-[var(--color-muted)]'
                    }`}
                  >
                    <span className="block mb-0.5 text-base">🏦 → 💵</span>
                    <span>Conta → Dinheiro</span>
                  </button>
                </div>
              </div>

              {/* Valor e Dia */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Valor (R$)"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={agendamentoValor}
                  onChange={(e) => setAgendamentoValor(e.target.value)}
                  required
                />
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1.5">Dia do Mês</label>
                  <select
                    value={agendamentoDia}
                    onChange={(e) => setAgendamentoDia(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium cursor-pointer text-xs"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>Dia {d}°</option>
                    ))}
                    <option value={29}>Dia 29°</option>
                    <option value={30}>Dia 30°</option>
                    <option value={31}>Dia 31° (último dia útil)</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Descrição (opcional)</label>
                <textarea
                  value={agendamentoDescricao}
                  onChange={(e) => setAgendamentoDescricao(e.target.value)}
                  placeholder="Ex: Depósito mensal para a conta"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-text)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium text-xs h-18 resize-none"
                />
              </div>

              {/* Resumo */}
              {agendamentoValor && parseFloat(agendamentoValor) > 0 && (
                <div className="bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[var(--color-warning)] text-[10px] font-bold uppercase tracking-wider">
                    <Repeat className="w-3.5 h-3.5" /> Resumo do Agendamento
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Todo dia</span>
                      <span className="font-bold text-[var(--color-ink)]">{agendamentoDia}° de cada mês</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Direção:</span>
                      <span className="font-bold text-[var(--color-ink)]">
                        {agendamentoDirection === 'paraConta' ? '💵 Dinheiro → 🏦 Conta' : '🏦 Conta → 💵 Dinheiro'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[var(--color-line)]">
                      <span className="text-[var(--color-muted)] font-semibold">Valor mensal:</span>
                      <span className="text-sm font-black text-[var(--color-warning)]">
                        R$ {parseFloat(agendamentoValor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex flex-col min-[420px]:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAgendarModalOpen(false)}
                  className="flex-1 py-2.5 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-2.5 text-xs"
                  isLoading={agendamentoLoading}
                  disabled={agendamentoLoading}
                >
                  <Repeat className="w-3.5 h-3.5" /> {agendamentoEditId ? 'Atualizar' : 'Agendar'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================
          Modal de Transferência entre Contas
          ============================================ */}
      {/* ============================================
          Modal de Relatório Mensal
          ============================================ */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)}></div>
          
          <div className="relative w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[var(--color-text)]">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold font-headline uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
              <BarChart3 className="w-4.5 h-4.5 text-[var(--color-brand)]" />
              Relatório Mensal — Receitas vs Despesas
            </h3>

            {/* Seletor de período */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Ano</label>
                <select
                  value={reportAno}
                  onChange={e => setReportAno(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-line)] rounded-xl py-2.5 px-3 text-xs text-[var(--color-text)] font-medium cursor-pointer"
                >
                  {anosDisponiveisRelatorio.length > 0 ? anosDisponiveisRelatorio.map(a => (
                    <option key={a} value={a}>{a}</option>
                  )) : (
                    <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
                  )}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Mês</label>
                <select
                  value={reportMes}
                  onChange={e => setReportMes(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-line)] rounded-xl py-2.5 px-3 text-xs text-[var(--color-text)] font-medium cursor-pointer"
                >
                  <option value="todas">Todos os meses</option>
                  {MESES_NOMES.map((nome, i) => (
                    <option key={i} value={i.toString()}>{nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 rounded-xl p-4">
                <span className="text-[10px] font-bold text-[var(--color-success)] uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Total Receitas
                </span>
                <p className="text-xl font-black text-[var(--color-success)] mt-1">
                  {fmtBRL(reportData.resumo.receitas)}
                </p>
              </div>
              <div className="bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 rounded-xl p-4">
                <span className="text-[10px] font-bold text-[var(--color-danger)] uppercase tracking-wider flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> Total Despesas
                </span>
                <p className="text-xl font-black text-[var(--color-danger)] mt-1">
                  {fmtBRL(reportData.resumo.despesas)}
                </p>
              </div>
              <div className={`${reportData.resumo.saldo >= 0 ? 'bg-[var(--color-brand)]/5 border-[var(--color-brand)]/20' : 'bg-[var(--color-danger)]/5 border-[var(--color-danger)]/20'} rounded-xl p-4`}>
                <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Saldo do Período
                </span>
                <p className={`text-xl font-black mt-1 ${reportData.resumo.saldo >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                  {fmtBRL(reportData.resumo.saldo)}
                </p>
              </div>
            </div>

            {/* Gráfico de Barras: Receitas vs Despesas por mês */}
            <div className="bg-[var(--color-bg)] border border-[var(--color-line)] rounded-xl p-4 mb-4">
              <h4 className="text-[11px] font-bold text-[var(--color-brand)] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <BarChart3 className="w-4 h-4" /> Receitas vs Despesas
                {reportMes !== 'todas' && (
                  <span className="text-[9px] text-[var(--color-muted)] font-normal normal-case">
                    — {MESES_NOMES[parseInt(reportMes)]}
                  </span>
                )}
              </h4>
              {reportData.meses.length === 0 || reportData.meses.every(m => m.receitas === 0 && m.despesas === 0) ? (
                <div className="h-48 flex items-center justify-center text-[var(--color-muted)] text-xs italic rounded-xl border border-dashed border-[var(--color-line)]">
                  Nenhum dado financeiro disponível para o período selecionado.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={reportData.meses} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'var(--color-muted)', fontWeight: 600 }}
                      axisLine={{ stroke: 'var(--color-line)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `R$${v.toLocaleString('pt-BR', { notation: 'compact', minimumFractionDigits: 0 })}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-line)',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                      formatter={(value: number, name: string) => [
                        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        name === 'receitas' ? 'Receitas' : 'Despesas',
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      iconType="rect"
                      iconSize={8}
                      formatter={(value: string) => value === 'receitas' ? 'Receitas' : 'Despesas'}
                    />
                    <Bar
                      dataKey="receitas"
                      name="receitas"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="despesas"
                      name="despesas"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Linha do saldo */}
              {reportData.meses.length > 1 && reportData.meses.some(m => m.receitas > 0 || m.despesas > 0) && (
                <div className="mt-4 pt-3 border-t border-[var(--color-line)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {reportData.meses.map(m => (
                      <div key={m.mes} className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface)] rounded-lg border border-[var(--color-line)]">
                        <span className="text-[10px] font-bold text-[var(--color-muted)]">{m.label}</span>
                        <span className={`text-[10px] font-bold ${m.saldo >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                          {fmtBRL(m.saldo)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gráfico de Pizza: Distribuição por categoria */}
            {reportMes === 'todas' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Receitas */}
                <div className="bg-[var(--color-bg)] border border-[var(--color-line)] rounded-xl p-4">
                  <h4 className="text-[11px] font-bold text-[var(--color-success)] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <ChartPie className="w-4 h-4" /> Receitas por Categoria
                  </h4>
                  {pieData.receitas.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-[var(--color-muted)] text-xs italic">
                      Nenhuma receita no período.
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={pieData.receitas}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.receitas.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1 mt-2">
                        {pieData.receitas.map((entry, index) => (
                          <div key={entry.name} className="flex items-center justify-between text-[10px]">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                              <span className="text-[var(--color-text)] font-medium">{entry.name}</span>
                            </span>
                            <span className="font-bold text-[var(--color-text)]">
                              {fmtBRL(entry.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Despesas */}
                <div className="bg-[var(--color-bg)] border border-[var(--color-line)] rounded-xl p-4">
                  <h4 className="text-[11px] font-bold text-[var(--color-danger)] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <ChartPie className="w-4 h-4" /> Despesas por Categoria
                  </h4>
                  {pieData.despesas.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-[var(--color-muted)] text-xs italic">
                      Nenhuma despesa no período.
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={pieData.despesas}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.despesas.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1 mt-2">
                        {pieData.despesas.map((entry, index) => (
                          <div key={entry.name} className="flex items-center justify-between text-[10px]">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                              <span className="text-[var(--color-text)] font-medium">{entry.name}</span>
                            </span>
                            <span className="font-bold text-[var(--color-text)]">
                              {fmtBRL(entry.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================
          Modal de Transferência entre Contas
          ============================================ */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTransferModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[var(--color-text)]">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold font-headline uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
              <ArrowRightLeft className="w-4.5 h-4.5 text-[var(--color-accent)]" />
              Transferir entre Contas
            </h3>

            <form onSubmit={handleTransfer} className="space-y-4">

              {/* Avisos */}
              {transferError && (
                <div className="bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {transferSuccess && (
                <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-xs py-2.5 px-3.5 rounded-xl text-center font-bold">
                  {transferSuccess}
                </div>
              )}

              {/* Direção da Transferência */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1.5">Direção da Transferência</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferDirection('paraConta')}
                    className={`py-3 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                      transferDirection === 'paraConta'
                        ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)] shadow-sm'
                        : 'border-[var(--color-line)] hover:bg-[var(--color-bg)] text-[var(--color-muted)]'
                    }`}
                  >
                    <span className="block mb-0.5 text-base">💵 → 🏦</span>
                    <span>Dinheiro → Conta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferDirection('paraDinheiro')}
                    className={`py-3 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                      transferDirection === 'paraDinheiro'
                        ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)] shadow-sm'
                        : 'border-[var(--color-line)] hover:bg-[var(--color-bg)] text-[var(--color-muted)]'
                    }`}
                  >
                    <span className="block mb-0.5 text-base">🏦 → 💵</span>
                    <span>Conta → Dinheiro</span>
                  </button>
                </div>
              </div>

              {/* Saldos atuais */}
              <div className="p-3 bg-[var(--color-bg)] border border-[var(--color-line)] rounded-xl space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-muted)]">🏦 Saldo em Conta:</span>
                  <span className={`font-bold ${saldoBanco >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                    R$ {saldoBanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-muted)]">💵 Saldo em Dinheiro:</span>
                  <span className={`font-bold ${saldoDinheiro >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                    R$ {saldoDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-[var(--color-line)]">
                  <span className="text-[var(--color-muted)]">Destino:</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {transferDirection === 'paraConta' ? '🏦 Conta Bancária' : '💵 Dinheiro'}
                  </span>
                </div>
              </div>

              {/* Valor */}
              <Input
                label="Valor a Transferir (R$)"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={transferValor}
                onChange={(e) => setTransferValor(e.target.value)}
                required
                helperText={
                  transferDirection === 'paraConta'
                    ? 'Do dinheiro vivo para a conta bancária'
                    : 'Da conta bancária para o dinheiro vivo'
                }
              />

              {/* Data */}
              <Input
                label="Data da Transferência"
                type="date"
                value={transferData}
                onChange={(e) => setTransferData(e.target.value)}
                required
              />

              {/* Descrição */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase block mb-1">Descrição (opcional)</label>
                <textarea
                  value={transferDescricao}
                  onChange={(e) => setTransferDescricao(e.target.value)}
                  placeholder="Ex: Depósito em espécie"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3 px-4 text-[var(--color-text)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium text-xs h-18 resize-none"
                />
              </div>

              {/* Resumo */}
              {transferValor && parseFloat(transferValor) > 0 && (
                <div className="bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/20 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[var(--color-brand)] text-[10px] font-bold uppercase tracking-wider">
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Resumo da Transferência
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Origem:</span>
                      <span className="font-bold text-[var(--color-text)]">
                        {transferDirection === 'paraConta' ? '💵 Dinheiro' : '🏦 Conta'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Destino:</span>
                      <span className="font-bold text-[var(--color-text)]">
                        {transferDirection === 'paraConta' ? '🏦 Conta' : '💵 Dinheiro'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[var(--color-line)]">
                      <span className="text-[var(--color-muted)] font-semibold">Valor:</span>
                      <span className="text-sm font-black text-[var(--color-brand)]">
                        R$ {parseFloat(transferValor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex flex-col min-[420px]:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 py-2.5 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-2.5 text-xs"
                  isLoading={transferLoading}
                  disabled={transferLoading}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Confirmar Transferência
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
