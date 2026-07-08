/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chocadeira, Chocada, RegistroDiario, Ovoscopia, RegistroNascimento, Propriedade, Alerta, ChocadaStatus, Usuario, LancamentoFinanceiro, Notificacao, SeveridadeNotificacao, TransferenciaAgendada } from './types';
import { supabase } from './supabaseClient';

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function daysBetween(startStr: string, endStr: string): number {
  const start = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DURACAO_INCUBACAO: Record<string, number> = {
  'Galinha': 21,
  'Codorna': 17,
  'Pato': 28,
  'Peru': 28,
};

export const CURRENT_DATE_STRING = getCurrentDateString();

// Seed Initial Data definition omitted for brevity, but used if DB is completely empty
const SEED_PROPRIEDADE: Propriedade = {
  id: 'p-1',
  nome: 'Minha Granja',
  responsavel: '',
  telefone: '',
  cidade: '',
  estado: '',
  observacoes: '',
  criadoEm: CURRENT_DATE_STRING,
  atualizadoEm: CURRENT_DATE_STRING,
};

const toSafeInteger = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.trunc(numberValue)) : 0;
};

const compareRegistroNascimentoRecency = (a: RegistroNascimento, b: RegistroNascimento): number => {
  const aDate = a.atualizadoEm || a.criadoEm || a.dataNascimentoReal || '';
  const bDate = b.atualizadoEm || b.criadoEm || b.dataNascimentoReal || '';
  const byDate = aDate.localeCompare(bDate);
  if (byDate !== 0) return byDate;
  return a.id.localeCompare(b.id);
};

// Optimistic Cache Storage
type AppCache = {
  propriedades: Propriedade[];
  chocadeiras: Chocadeira[];
  chocadas: Chocada[];
  registros_diarios: RegistroDiario[];
  ovoscopias: Ovoscopia[];
  registros_nascimentos: RegistroNascimento[];
  usuarios: Usuario[];
  financeiro_lancamentos: LancamentoFinanceiro[];
  notificacoes: Notificacao[];
  transferencias_agendadas: TransferenciaAgendada[];
};

class AppRepository {
  private cache: AppCache = {
    propriedades: [],
    chocadeiras: [],
    chocadas: [],
    registros_diarios: [],
    ovoscopias: [],
    registros_nascimentos: [],
    usuarios: [],
    financeiro_lancamentos: [],
    notificacoes: [],
    transferencias_agendadas: [],
  };

  private isLoaded = false;
  private financeiroAceitaFormaPagamento = true;
  private notificationPollInterval: ReturnType<typeof setInterval> | null = null;
  private notificationListeners: Set<() => void> = new Set();

  constructor() {
    this.loadLocalCache();
    this.loadNotificacoesFromLocalCache();
  }

  // Verifica se há dados locais cacheados para renderização rápida
  public hasLocalData(): boolean {
    return this.cache.propriedades.length > 0 || this.cache.chocadeiras.length > 0;
  }

  private loadLocalCache(): void {
    try {
      const cached = window.localStorage.getItem('laranjeiras_repo_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Merge seguro: garante que campos adicionados após o cache do usuário
        // nunca fiquem undefined, evitando crashes ao chamar .filter() etc.
        this.cache = {
          propriedades: parsed.propriedades ?? [],
          chocadeiras: parsed.chocadeiras ?? [],
          chocadas: parsed.chocadas ?? [],
          registros_diarios: parsed.registros_diarios ?? [],
          ovoscopias: parsed.ovoscopias ?? [],
          registros_nascimentos: parsed.registros_nascimentos ?? [],
          usuarios: parsed.usuarios ?? [],
          financeiro_lancamentos: parsed.financeiro_lancamentos ?? [],
          notificacoes: parsed.notificacoes ?? [],
          transferencias_agendadas: parsed.transferencias_agendadas ?? [],
        };
      }
    } catch (e) {
      console.warn('Falha ao recuperar cache local:', e);
    }
  }

  private saveLocalCache(): void {
    try {
      window.localStorage.setItem('laranjeiras_repo_cache', JSON.stringify(this.cache));
    } catch (e) {
      console.warn('Falha ao salvar cache local:', e);
    }
  }

  // Fetch all tables from Supabase and cache them
  public async loadFromSupabase(): Promise<void> {
    if (this.isLoaded) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const limitDateStr = sixtyDaysAgo.toISOString().split('T')[0];

      const fetchPromise = Promise.all([
        supabase.from('propriedades').select('*'),
        supabase.from('chocadeiras').select('*').eq('excluido', false),
        supabase.from('chocadas').select('*').eq('excluido', false),
        supabase.from('registros_diarios').select('*').eq('excluido', false).gte('data', limitDateStr),
        supabase.from('ovoscopias').select('*').eq('excluido', false),
        supabase.from('registros_nascimentos').select('*').eq('excluido', false),
        supabase.from('usuarios').select('*').eq('ativo', true),
        supabase.from('financeiro_lancamentos').select('*').eq('excluido', false)
      ]);

      const timeoutPromise = new Promise<any[]>((resolve) => {
        setTimeout(() => {
          console.warn('A sincronização inicial do repositório expirou. Continuando offline/cache local.');
          resolve([
            { data: [] }, // propriedades
            { data: [] }, // chocadeiras
            { data: [] }, // chocadas
            { data: [] }, // registros_diarios
            { data: [] }, // ovoscopias
            { data: [] }, // registros_nascimentos
            { data: [] }, // usuarios
            { data: [] }  // financeiro_lancamentos
          ]);
        }, 5000);
      });

      const [prop, chocadeiras, chocadas, registros, ovos, nascimentos, users, lancamentos] = 
        await Promise.race([fetchPromise, timeoutPromise]);

      if (prop.data) this.cache.propriedades = prop.data;
      if (chocadeiras.data) this.cache.chocadeiras = chocadeiras.data;
      if (chocadas.data) this.cache.chocadas = chocadas.data;
      if (registros.data) this.cache.registros_diarios = registros.data;
      if (ovos.data) this.cache.ovoscopias = ovos.data;
      if (nascimentos.data) this.cache.registros_nascimentos = nascimentos.data;
      if (users.data) this.cache.usuarios = users.data;
      if (lancamentos.data) this.cache.financeiro_lancamentos = lancamentos.data.map(this.normalizeLancamento);

      // Seed fallback se absolutamente vazio e usuário estiver autenticado
      if (userId && this.cache.propriedades.length === 0) {
        const initialProp = { ...SEED_PROPRIEDADE, user_id: userId };
        this.cache.propriedades.push(initialProp);
        await this.upsertToSupabase('propriedades', initialProp);
      }

      this.saveLocalCache();
      this.isLoaded = true;
    } catch (e) {
      console.error('Error loading from Supabase, operating offline or corrupted', e);
    }
  }

  // Limpa o cache local e redefine o estado de carregamento para permitir nova sincronização
  public clearCache(): void {
    this.cache = {
      propriedades: [],
      chocadeiras: [],
      chocadas: [],
      registros_diarios: [],
      ovoscopias: [],
      registros_nascimentos: [],
      usuarios: [],
      financeiro_lancamentos: [],
      notificacoes: [],
      transferencias_agendadas: [],
    };
    this.isLoaded = false;
    this.stopNotificationPolling();
    try {
      window.localStorage.removeItem('laranjeiras_repo_cache');
    } catch (e) {
      // ignore
    }
  }

  // Generic background sync helper with user_id mapping
  private async upsertToSupabase(table: string, payload: any) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    const record = { ...payload };
    if (userId && table !== 'usuarios') {
      record.user_id = userId;
    }

    const { error } = await supabase.from(table).upsert(record);
    if (error) {
      console.error(`Error saving to ${table} on Supabase:`, error);
      throw error;
    }
  }

  private normalizeLancamento(lancamento: LancamentoFinanceiro): LancamentoFinanceiro {
    return {
      ...lancamento,
      valor: Number(lancamento.valor) || 0,
      quantidadePintinhos: lancamento.quantidadePintinhos === undefined ? undefined : toSafeInteger(lancamento.quantidadePintinhos),
      formaPagamento: lancamento.formaPagamento || 'BANCO',
    };
  }

  private async upsertLancamentoToSupabase(lancamento: LancamentoFinanceiro) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    const record: LancamentoFinanceiro & { user_id?: string } = { ...lancamento };
    if (userId) {
      record.user_id = userId;
    }

    if (this.financeiroAceitaFormaPagamento) {
      const result = await supabase.from('financeiro_lancamentos').upsert(record);
      if (!this.isMissingFormaPagamentoColumn(result.error)) {
        return result;
      }

      this.financeiroAceitaFormaPagamento = false;
      console.warn(
        'A coluna financeiro_lancamentos.formaPagamento não existe no Supabase. Salvando lançamento sem este campo até o schema ser atualizado.',
        result.error
      );
    }

    const fallbackPayload = { ...record };
    delete fallbackPayload.formaPagamento;
    return supabase.from('financeiro_lancamentos').upsert(fallbackPayload);
  }

  private isMissingFormaPagamentoColumn(error: any): boolean {
    return Boolean(
      error &&
      error.code === 'PGRST204' &&
      typeof error.message === 'string' &&
      error.message.includes('formaPagamento')
    );
  }

  public initDatabase() {
     // No-op for compatibility with App.tsx older codes
  }

  // --- USUÁRIOS ---
  public getUsuarios(): Usuario[] {
    return this.cache.usuarios;
  }

  public getUsuarioByUsername(username: string): Usuario | undefined {
    // Filtra apenas usuários ativos para evitar conflito com registros inativos/fantasmas
    return this.cache.usuarios.find(u => u.username === username && u.ativo);
  }

  public async saveUsuario(usuario: Usuario): Promise<{ success: boolean; message: string }> {
    if (!usuario.username.trim()) return { success: false, message: 'Nome de usuário obrigatório.' };
    
    const isEditing = !!usuario.id;
    // Evitar nome de usuário duplicado ao criar
    if (!isEditing && this.getUsuarioByUsername(usuario.username)) {
      return { success: false, message: 'Este nome de usuário já existe.' };
    }

    const list = this.cache.usuarios;
    const index = list.findIndex(item => item.id === usuario.id);
    
    let isNew = false;
    if (index >= 0) {
      list[index] = { ...list[index], ...usuario };
    } else {
      usuario.id = usuario.id || `usr-${Date.now()}`;
      usuario.criadoEm = CURRENT_DATE_STRING;
      usuario.ativo = true;
      isNew = true;
    }
    
    // Tenta salvar de forma síncrona com o await para capturar bloqueios RLS ou Restrições
    const { error } = await supabase.from('usuarios').upsert(usuario);
    if (error) {
      console.error('Supabase save error:', error);
      return { success: false, message: `Erro ao salvar no banco de dados (Verifique permissões RLS): ${error.message}` };
    }

    if (isNew) {
      list.push(usuario);
    }
    return { success: true, message: 'Usuário salvo com sucesso.' };
  }

  public async deleteUsuario(id: string): Promise<{ success: boolean; message: string }> {
    const list = this.cache.usuarios;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      // Bloquear deleção do admin
      if (list[index].username === 'admin') {
        return { success: false, message: 'Não é possível excluir o super administrador.' };
      }
      
      // Deletar permanentemente do Supabase para liberar o username para recadastro
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) {
        console.error('Erro ao deletar usuário do Supabase:', error);
        return { success: false, message: `Erro ao remover do banco de dados: ${error.message}` };
      }

      // Remover do cache local somente após sucesso no Supabase
      list.splice(index, 1);
    }
    return { success: true, message: 'Usuário removido com sucesso.' };
  }

  // --- PROPRIEDADE ---
  public getPropriedade(): Propriedade {
    return this.cache.propriedades[0] || SEED_PROPRIEDADE;
  }

  public async savePropriedade(prop: Propriedade): Promise<{ success: boolean; message: string }> {
    prop.atualizadoEm = CURRENT_DATE_STRING;
    try {
      await this.upsertToSupabase('propriedades', prop);
      if (this.cache.propriedades.length > 0) {
        this.cache.propriedades[0] = prop;
      } else {
        this.cache.propriedades.push(prop);
      }
      this.saveLocalCache();
      return { success: true, message: 'Propriedade salva com sucesso.' };
    } catch (e: any) {
      return { success: false, message: `Erro ao salvar propriedade: ${e.message || e}` };
    }
  }

  // --- CHOCADEIRAS ---
  public getChocadeiras(incluiExcluidos = false): Chocadeira[] {
    return this.cache.chocadeiras.filter(item => incluiExcluidos || !item.excluido);
  }

  public getChocadeiraById(id: string): Chocadeira | undefined {
    return this.getChocadeiras(true).find(item => item.id === id);
  }

  private isChocadaEmAberto(chocada: Chocada): boolean {
    return !chocada.excluido && !chocada.finalizada && !chocada.cancelada;
  }

  public getChocadeiraOcupadaPor(chocadeiraId: string, ignoreChocadaId?: string): Chocada | undefined {
    return this.getChocadas().find(
      c => c.chocadeiraId === chocadeiraId && c.id !== ignoreChocadaId && this.isChocadaEmAberto(c)
    );
  }

  public getChocadeirasDisponiveis(ignoreChocadaId?: string): Chocadeira[] {
    return this.getChocadeiras().filter(ch => (
      ch.status === 'Ativa' && !this.getChocadeiraOcupadaPor(ch.id, ignoreChocadaId)
    ));
  }

  public async saveChocadeira(chocadeira: Chocadeira): Promise<{ success: boolean; message: string }> {
    const list = this.cache.chocadeiras;
    const index = list.findIndex(item => item.id === chocadeira.id);
    const dateStr = CURRENT_DATE_STRING;
    
    const clone = { ...chocadeira };
    if (index >= 0) {
      clone.atualizadoEm = dateStr;
    } else {
      clone.id = clone.id || `choc-${Date.now()}`;
      clone.criadoEm = dateStr;
      clone.atualizadoEm = dateStr;
      clone.excluido = false;
    }

    try {
      await this.upsertToSupabase('chocadeiras', clone);
      if (index >= 0) {
        list[index] = { ...list[index], ...clone };
      } else {
        list.push(clone);
      }
      this.saveLocalCache();
      return { success: true, message: 'Chocadeira salva com sucesso.' };
    } catch (e: any) {
      return { success: false, message: `Erro ao salvar chocadeira: ${e.message || e}` };
    }
  }

  public async deleteChocadeira(id: string): Promise<{ success: boolean; message: string }> {
    const linkedChocadas = this.getChocadas().filter(c => c.chocadeiraId === id);

    if (linkedChocadas.length > 0) {
      return {
        success: false,
        message: `Não é possível excluir esta chocadeira pois ela possui lote vinculado ("${linkedChocadas[0].nome}"). Mantenha o cadastro para preservar histórico, nascimentos e vendas.`,
      };
    }

    const linkedSales = this.getLancamentos().filter(l => l.chocadeiraId === id);
    if (linkedSales.length > 0) {
      return {
        success: false,
        message: 'Não é possível excluir esta chocadeira pois existem lançamentos financeiros vinculados a ela.',
      };
    }

    const list = this.cache.chocadeiras;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      const clone = { ...list[index], excluido: true, atualizadoEm: CURRENT_DATE_STRING };
      try {
        await this.upsertToSupabase('chocadeiras', clone);
        list[index] = clone;
      } catch (e: any) {
        return { success: false, message: `Erro ao deletar chocadeira: ${e.message || e}` };
      }
    }
    return { success: true, message: 'Chocadeira excluída com sucesso.' };
  }

  // --- CHOCADAS (INCUBATIONS) ---
  public getChocadas(incluiExcluidos = false): Chocada[] {
    const list = this.cache.chocadas;
    const filtered = list.filter(item => incluiExcluidos || !item.excluido);
    return filtered.map(chocada => this.recalculateChocadaStatusAndBalance(chocada));
  }

  public getChocadaById(id: string): Chocada | undefined {
    const chocada = this.cache.chocadas.find(item => item.id === id && !item.excluido);
    if (chocada) {
      return this.recalculateChocadaStatusAndBalance(chocada);
    }
    return undefined;
  }

  private recalculateChocadaStatusAndBalance(chocada: Chocada): Chocada {
    const ovoscopias = this.getOvoscopias(chocada.id);
    let descartadosTotais = 0;
    let inferteisTotais = 0;
    ovoscopias.forEach(ov => {
      descartadosTotais += ov.ovosDescartados;
      inferteisTotais += ov.ovosInferteis;
    });

    const calculatedActiveValue = Math.max(0, chocada.quantidadeOvosInicial - descartadosTotais - inferteisTotais);
    chocada.quantidadeOvosAtivos = calculatedActiveValue;

    const duration = DURACAO_INCUBACAO[chocada.tipoOvo] || 21;
    chocada.dataPrevistaNascimento = addDays(chocada.dataInicio, duration);

    if (chocada.cancelada) {
      chocada.status = 'CANCELADA';
    } else if (chocada.finalizada) {
      chocada.status = 'FINALIZADA';
    } else {
      const todayStr = getCurrentDateString();
      const elapsed = daysBetween(chocada.dataInicio, todayStr);
      const remaining = duration - elapsed;

      if (remaining < 0) {
        chocada.status = 'ATRASADA';
      } else if (remaining <= 3) {
        chocada.status = 'PROXIMA';
      } else {
        chocada.status = 'EM_ANDAMENTO';
      }
    }

    return chocada;
  }

  public async saveChocada(chocada: Chocada): Promise<{ success: boolean; message: string; data?: Chocada }> {
    if (!chocada.nome.trim()) return { success: false, message: 'O nome da chocada é obrigatório.' };
    if (!chocada.dataInicio) return { success: false, message: 'A data de início é obrigatória.' };
    if (chocada.quantidadeOvosInicial <= 0) return { success: false, message: 'A quantidade de ovos deve ser maior que zero.' };
    if (!chocada.chocadeiraId) return { success: false, message: 'Selecione uma chocadeira disponível.' };

    const existingChocada = chocada.id ? this.cache.chocadas.find(item => item.id === chocada.id && !item.excluido) : undefined;
    const isSameChocadeira = existingChocada?.chocadeiraId === chocada.chocadeiraId;
    const selectedChocadeira = this.getChocadeiraById(chocada.chocadeiraId);
    if (!selectedChocadeira || selectedChocadeira.excluido || (!isSameChocadeira && selectedChocadeira.status !== 'Ativa')) {
      return { success: false, message: 'A chocadeira selecionada não está ativa ou não está disponível.' };
    }

    const occupiedBy = this.getChocadeiraOcupadaPor(chocada.chocadeiraId, chocada.id);
    if (occupiedBy) {
      return {
        success: false,
        message: `A chocadeira "${selectedChocadeira.nome}" já está ocupada pelo lote "${occupiedBy.nome}". Finalize esse ciclo antes de cadastrar outro.`,
      };
    }

    const perdasRegistradas = this.getOvoscopias(chocada.id).reduce(
      (total, ov) => total + ov.ovosDescartados + ov.ovosInferteis,
      0
    );
    if (perdasRegistradas > chocada.quantidadeOvosInicial) {
      return {
        success: false,
        message: `A quantidade inicial não pode ser menor que as perdas já registradas (${perdasRegistradas} ovos).`,
      };
    }

    const duration = DURACAO_INCUBACAO[chocada.tipoOvo] || 21;
    const clone = { ...chocada };
    clone.dataPrevistaNascimento = addDays(clone.dataInicio, duration);

    const list = this.cache.chocadas;
    const index = list.findIndex(item => item.id === clone.id);
    const dateStr = CURRENT_DATE_STRING;

    if (index >= 0) {
      clone.atualizadoEm = dateStr;
    } else {
      clone.id = clone.id || `chocada-${Date.now()}`;
      clone.quantidadeOvosAtivos = clone.quantidadeOvosInicial;
      clone.criadoEm = dateStr;
      clone.atualizadoEm = dateStr;
      clone.excluido = false;
      clone.finalizada = false;
      clone.cancelada = false;
    }

    const calculatedChocada = this.recalculateChocadaStatusAndBalance(clone);

    try {
      await this.upsertToSupabase('chocadas', calculatedChocada);
      if (index >= 0) {
        list[index] = calculatedChocada;
      } else {
        list.push(calculatedChocada);
      }
      const saved = this.getChocadaById(calculatedChocada.id);
      this.saveLocalCache();
      return { success: true, message: 'Lote registrado com sucesso.', data: saved };
    } catch (e: any) {
      return { success: false, message: `Erro ao salvar lote no Supabase: ${e.message || e}` };
    }
  }

  public async deleteChocada(id: string): Promise<{ success: boolean; message: string }> {
    const list = this.cache.chocadas;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      const nascimentoCount = this.getRegistrosNascimento(id).length;
      if (nascimentoCount > 0) {
        return {
          success: false,
          message: 'Não é possível excluir esta chocada pois ela possui registro de nascimento. Utilize a opção "Cancelar/Estornar" caso precise corrigir erros de lançamento que afetam o estoque.',
        };
      }

      const linkedLancamentos = this.getLancamentos().filter(l => l.chocadaId === id);
      if (linkedLancamentos.length > 0) {
        return {
          success: false,
          message: 'Não é possível excluir esta chocada pois existem lançamentos financeiros vinculados a ela.',
        };
      }

      const clone = { ...list[index], excluido: true, atualizadoEm: CURRENT_DATE_STRING };
      try {
        await this.upsertToSupabase('chocadas', clone);
        list[index] = clone;
      } catch (e: any) {
        return { success: false, message: `Erro ao excluir lote no Supabase: ${e.message || e}` };
      }
    }
    return { success: true, message: 'Chocada excluída com segurança.' };
  }

  public async cancelarChocada(id: string): Promise<{ success: boolean; message: string }> {
    const list = this.cache.chocadas;
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return { success: false, message: 'Chocada não encontrada.' };

    const chocada = list[index];

    const nascimentosDestaChocada = this.getRegistrosNascimento(id);
    const totalNascidosDestaChocada = nascimentosDestaChocada.reduce((acc, n) => acc + n.pintinhosNascidos, 0);
    const estoqueAtual = this.getEstoquePintinhosPorChocadeira(chocada.chocadeiraId);
    
    if (estoqueAtual.disponivel - totalNascidosDestaChocada < 0) {
      return { 
        success: false, 
        message: `Não é possível inativar o lote. Existem vendas financeiras que dependem dos pintinhos nascidos aqui. Exclua a venda no Financeiro antes de cancelar.` 
      };
    }

    const dateStr = CURRENT_DATE_STRING;

    const registros = this.cache.registros_diarios.filter(r => r.chocadaId === id && !r.excluido);
    const ovoscopias = this.cache.ovoscopias.filter(o => o.chocadaId === id && !o.excluido);
    const nascimentos = this.cache.registros_nascimentos.filter(n => n.chocadaId === id && !n.excluido);

    try {
      const promises: Promise<any>[] = [];
      
      registros.forEach(r => {
        const c = { ...r, excluido: true, atualizadoEm: dateStr };
        promises.push(this.upsertToSupabase('registros_diarios', c));
      });

      ovoscopias.forEach(o => {
        const c = { ...o, excluido: true, atualizadoEm: dateStr };
        promises.push(this.upsertToSupabase('ovoscopias', c));
      });

      nascimentos.forEach(n => {
        const c = { ...n, excluido: true, updatedEm: dateStr, atualizadoEm: dateStr };
        promises.push(this.upsertToSupabase('registros_nascimentos', c));
      });

      const cloneChocada = { 
        ...chocada, 
        cancelada: true, 
        finalizada: false, 
        status: 'CANCELADA' as ChocadaStatus, 
        atualizadoEm: dateStr 
      };
      promises.push(this.upsertToSupabase('chocadas', cloneChocada));

      await Promise.all(promises);

      registros.forEach(r => { r.excluido = true; r.atualizadoEm = dateStr; });
      ovoscopias.forEach(o => { o.excluido = true; o.atualizadoEm = dateStr; });
      nascimentos.forEach(n => { n.excluido = true; n.atualizadoEm = dateStr; });
      list[index] = cloneChocada;

      return { success: true, message: 'Lote cancelado e registros vinculados foram estornados com sucesso.' };
    } catch (e: any) {
      return { success: false, message: `Erro ao cancelar lote no Supabase: ${e.message || e}` };
    }
  }

  // --- REGISTRO DIÁRIO ---
  public getRegistrosDiarios(chocadaId?: string): RegistroDiario[] {
    let filtered = this.cache.registros_diarios.filter(item => !item.excluido);
    if (chocadaId) {
      filtered = filtered.filter(item => item.chocadaId === chocadaId);
    }
    return filtered.sort((a, b) => b.data.localeCompare(a.data));
  }

  public async saveRegistroDiario(reg: RegistroDiario): Promise<{ success: boolean; message: string }> {
    if (reg.temperatura < 0) return { success: false, message: 'A temperatura idealmente não pode ser negativa.' };
    if (reg.umidade < 0 || reg.umidade > 100) return { success: false, message: 'A umidade relativa do ar deve estar entre 0% e 100%.' };

    const list = this.cache.registros_diarios;
    const index = list.findIndex(item => item.id === reg.id);
    const dateStr = CURRENT_DATE_STRING;

    const clone = { ...reg };
    if (index >= 0) {
      clone.atualizadoEm = dateStr;
    } else {
      clone.id = clone.id || `rd-${Date.now()}`;
      clone.criadoEm = dateStr;
      clone.atualizadoEm = dateStr;
      clone.excluido = false;
    }

    try {
      await this.upsertToSupabase('registros_diarios', clone);
      if (index >= 0) {
        list[index] = clone;
      } else {
        list.push(clone);
      }
      return { success: true, message: 'Acompanhamento diário salvo.' };
    } catch (e: any) {
      return { success: false, message: `Erro ao salvar registro diário: ${e.message || e}` };
    }
  }

  public async deleteRegistroDiario(id: string): Promise<{ success: boolean; message: string }> {
    const list = this.cache.registros_diarios;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      const clone = { ...list[index], excluido: true, atualizadoEm: CURRENT_DATE_STRING };
      try {
        await this.upsertToSupabase('registros_diarios', clone);
        list[index] = clone;
        return { success: true, message: 'Acompanhamento diário excluído.' };
      } catch (e: any) {
        return { success: false, message: `Erro ao excluir acompanhamento diário: ${e.message || e}` };
      }
    }
    return { success: false, message: 'Registro não encontrado.' };
  }

  // --- OVOSCOPIAS ---
  public getOvoscopias(chocadaId?: string): Ovoscopia[] {
    let filtered = this.cache.ovoscopias.filter(item => !item.excluido);
    if (chocadaId) {
      filtered = filtered.filter(item => item.chocadaId === chocadaId);
    }
    return filtered.sort((a, b) => b.data.localeCompare(a.data));
  }

  public async saveOvoscopia(ov: Ovoscopia): Promise<{ success: boolean; message: string }> {
    const chocada = this.getChocadaById(ov.chocadaId);
    if (!chocada) return { success: false, message: 'Lote de incubação associado não encontrado.' };

    const ovoscopiasAnteriores = this.getOvoscopias(ov.chocadaId).filter(o => o.id !== ov.id);
    let acumuladosAnteriores = 0;
    ovoscopiasAnteriores.forEach(o => {
      acumuladosAnteriores += (o.ovosDescartados + o.ovosInferteis);
    });

    const novasPerdas = ov.ovosDescartados + ov.ovosInferteis;
    const totalDescartes = acumuladosAnteriores + novasPerdas;

    if (totalDescartes > chocada.quantidadeOvosInicial) {
      return {
        success: false,
        message: `A soma de descarte e inférteis (${totalDescartes}) excede quantidade total de ovos do lote (${chocada.quantidadeOvosInicial}).`,
      };
    }

    const list = this.cache.ovoscopias;
    const index = list.findIndex(item => item.id === ov.id);
    const dateStr = CURRENT_DATE_STRING;

    const clone = { ...ov };
    if (index >= 0) {
      clone.atualizadoEm = dateStr;
    } else {
      clone.id = clone.id || `ov-${Date.now()}`;
      clone.criadoEm = dateStr;
      clone.atualizadoEm = dateStr;
      clone.excluido = false;
    }

    try {
      await this.upsertToSupabase('ovoscopias', clone);
      if (index >= 0) {
        list[index] = clone;
      } else {
        list.push(clone);
      }
      await this.recalcAndSaveChocadaAfterAction(clone.chocadaId);
      return { success: true, message: 'Ovoscopia registrada com sucesso.' };
    } catch (e: any) {
      return { success: false, message: `Erro ao salvar ovoscopia: ${e.message || e}` };
    }
  }

  public async deleteOvoscopia(id: string): Promise<{ success: boolean; message: string }> {
    const list = this.cache.ovoscopias;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      const chocadaId = list[index].chocadaId;
      const clone = { ...list[index], excluido: true, atualizadoEm: CURRENT_DATE_STRING };
      try {
        await this.upsertToSupabase('ovoscopias', clone);
        list[index] = clone;
        await this.recalcAndSaveChocadaAfterAction(chocadaId);
        return { success: true, message: 'Ovoscopia excluída.' };
      } catch (e: any) {
        return { success: false, message: `Erro ao excluir ovoscopia: ${e.message || e}` };
      }
    }
    return { success: false, message: 'Ovoscopia não encontrada.' };
  }

  private async recalcAndSaveChocadaAfterAction(chocadaId: string) {
    const rawList = this.cache.chocadas;
    const idx = rawList.findIndex(item => item.id === chocadaId);
    if (idx >= 0) {
      const updatedChocada = this.recalculateChocadaStatusAndBalance(rawList[idx]);
      await this.upsertToSupabase('chocadas', updatedChocada);
      rawList[idx] = updatedChocada;
    }
  }

  // --- REGISTROS NASCIMENTO ---
  public getRegistrosNascimento(chocadaId?: string): RegistroNascimento[] {
    let filtered = this.cache.registros_nascimentos.filter(item => !item.excluido);
    if (chocadaId) {
      filtered = filtered.filter(item => item.chocadaId === chocadaId);
    }

    const latestByChocada = new Map<string, RegistroNascimento>();
    filtered.forEach(item => {
      const normalized: RegistroNascimento = {
        ...item,
        pintinhosNascidos: toSafeInteger(item.pintinhosNascidos),
        ovosNaoEclodidos: toSafeInteger(item.ovosNaoEclodidos),
        perdas: toSafeInteger(item.perdas),
      };
      const current = latestByChocada.get(normalized.chocadaId);
      if (!current || compareRegistroNascimentoRecency(current, normalized) <= 0) {
        latestByChocada.set(normalized.chocadaId, normalized);
      }
    });

    return Array.from(latestByChocada.values());
  }

  public async saveRegistroNascimento(nasc: RegistroNascimento): Promise<{ success: boolean; message: string }> {
    const chocada = this.getChocadaById(nasc.chocadaId);
    if (!chocada) return { success: false, message: 'Incubação não encontrada.' };
    if (!nasc.dataNascimentoReal) return { success: false, message: 'A data do nascimento real é obrigatória.' };
    
    const pintinhosNascidos = toSafeInteger(nasc.pintinhosNascidos);
    const ovosNaoEclodidos = toSafeInteger(nasc.ovosNaoEclodidos);
    const perdas = toSafeInteger(nasc.perdas);
    const totalInformado = pintinhosNascidos + ovosNaoEclodidos + perdas;
    if (pintinhosNascidos > chocada.quantidadeOvosInicial) {
      return { success: false, message: `Pintinhos nascidos (${pintinhosNascidos}) nao pode ser maior que os ovos iniciais (${chocada.quantidadeOvosInicial}).` };
    }
    if (totalInformado > chocada.quantidadeOvosInicial) {
      return { success: false, message: `A soma de nascidos, nao eclodidos e perdas (${totalInformado}) nao pode ultrapassar os ovos iniciais (${chocada.quantidadeOvosInicial}).` };
    }

    const list = this.cache.registros_nascimentos;
    const activeForChocada = list
      .filter(item => item.chocadaId === nasc.chocadaId && !item.excluido)
      .sort(compareRegistroNascimentoRecency);
    const existingActive = activeForChocada[activeForChocada.length - 1];
    const targetId = nasc.id || existingActive?.id || `rn-${nasc.chocadaId}`;
    const index = list.findIndex(item => item.id === targetId);
    const dateStr = CURRENT_DATE_STRING;

    const clone = {
      ...nasc,
      id: targetId,
      pintinhosNascidos,
      ovosNaoEclodidos,
      perdas,
    };
    if (index >= 0) {
      clone.atualizadoEm = dateStr;
    } else {
      clone.criadoEm = dateStr;
      clone.atualizadoEm = dateStr;
      clone.excluido = false;
    }

    try {
      const duplicatedActive = activeForChocada.filter(item => item.id !== clone.id);
      await Promise.all(
        duplicatedActive.map(item => this.upsertToSupabase('registros_nascimentos', {
          ...item,
          excluido: true,
          atualizadoEm: dateStr,
        }))
      );
      await this.upsertToSupabase('registros_nascimentos', clone);

      const rawList = this.cache.chocadas;
      const idx = rawList.findIndex(item => item.id === clone.chocadaId);
      if (idx >= 0) {
        const cloneChocada = { 
          ...rawList[idx], 
          finalizada: true, 
          status: 'FINALIZADA' as ChocadaStatus, 
          atualizadoEm: dateStr 
        };
        await this.upsertToSupabase('chocadas', cloneChocada);
        rawList[idx] = cloneChocada;
      }

      if (index >= 0) {
        list[index] = clone;
      } else {
        list.push(clone);
      }
      duplicatedActive.forEach(item => {
        const dupIndex = list.findIndex(current => current.id === item.id);
        if (dupIndex >= 0) {
          list[dupIndex] = { ...list[dupIndex], excluido: true, atualizadoEm: dateStr };
        }
      });
      this.saveLocalCache();
      return { success: true, message: 'Registro de nascimento salvo e lote finalizado!' };
    } catch (e: any) {
      return { success: false, message: `Erro ao salvar registro de nascimento: ${e.message || e}` };
    }
  }

  public async deleteRegistroNascimento(id: string): Promise<{ success: boolean; message: string }> {
    const list = this.cache.registros_nascimentos;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      const chocadaId = list[index].chocadaId;
      const activeForChocada = list.filter(item => item.chocadaId === chocadaId && !item.excluido);
      
      try {
        await Promise.all(
          activeForChocada.map(item => this.upsertToSupabase('registros_nascimentos', {
            ...item,
            excluido: true,
            atualizadoEm: CURRENT_DATE_STRING,
          }))
        );

        const rawList = this.cache.chocadas;
        const idx = rawList.findIndex(item => item.id === chocadaId);
        if (idx >= 0) {
          const cloneChocada = { 
            ...rawList[idx], 
            finalizada: false, 
            atualizadoEm: CURRENT_DATE_STRING 
          };
          const recalculated = this.recalculateChocadaStatusAndBalance(cloneChocada);
          await this.upsertToSupabase('chocadas', recalculated);
          rawList[idx] = recalculated;
        }

        activeForChocada.forEach(item => {
          const activeIndex = list.findIndex(current => current.id === item.id);
          if (activeIndex >= 0) {
            list[activeIndex] = { ...list[activeIndex], excluido: true, atualizadoEm: CURRENT_DATE_STRING };
          }
        });
        this.saveLocalCache();
        return { success: true, message: 'Registro de nascimento excluído.' };
      } catch (e: any) {
        return { success: false, message: `Erro ao excluir registro de nascimento: ${e.message || e}` };
      }
    }
    return { success: false, message: 'Registro de nascimento não encontrado.' };
  }

  // --- ALERTA GENERATOR ---
  public getAlertas(): Alerta[] {
    const alerts: Alerta[] = [];
    const chocadas = this.getChocadas();
    const todayStr = getCurrentDateString();
    
    // 1. Alertas de status das Chocadas (Atrasadas, Próximas, Sem Registro)
    chocadas.forEach(ch => {
      if (ch.status === 'ATRASADA') {
        const diff = daysBetween(ch.dataPrevistaNascimento, todayStr);
        alerts.push({
          id: `al-atrasada-${ch.id}`,
          titulo: `Lote "${ch.nome}" está atrasado!`,
          msg: `Lote atrasado em D+${diff} dia(s). Realize a verificação sanitária ou ovoscopia final.`,
          tipo: 'error',
          chocadaId: ch.id,
          data: todayStr,
        });
      }

      if (ch.status === 'PROXIMA') {
        const daysLeft = daysBetween(todayStr, ch.dataPrevistaNascimento);
        alerts.push({
          id: `al-proxima-${ch.id}`,
          titulo: `Próximo Nascimento: ${ch.nome}`,
          msg: `Faltam apenas ${daysLeft} dia(s) para o nascimento. Eleve a umidade ideal para ~70%.`,
          tipo: 'warning',
          chocadaId: ch.id,
          data: todayStr,
        });
      }

      const hojeStr = todayStr;
      const registrosHoje = this.getRegistrosDiarios(ch.id).filter(r => r.data === hojeStr);
      if (registrosHoje.length === 0 && (ch.status === 'EM_ANDAMENTO' || ch.status === 'PROXIMA')) {
        alerts.push({
          id: `al-diario-${ch.id}`,
          titulo: `Pendente: Registro diário em "${ch.nome}"`,
          msg: `Inspeção pendente para hoje. Lembrar de virar os ovos e analisar parâmetros.`,
          tipo: 'warning',
          chocadaId: ch.id,
          data: todayStr,
        });
      }
      
      // Novo Alerta: Choca cadastrada recentemente (últimos 3 dias)
      const diasDesdeCriacao = daysBetween(ch.criadoEm || ch.dataInicio, todayStr);
      if (diasDesdeCriacao >= 0 && diasDesdeCriacao <= 3) {
        alerts.push({
          id: `al-nova-${ch.id}`,
          titulo: `Novo Lote Cadastrado: ${ch.nome}`,
          msg: `Uma nova choca foi iniciada com ${ch.quantidadeOvosInicial} ovos de ${ch.tipoOvo}.`,
          tipo: 'info',
          chocadaId: ch.id,
          data: ch.criadoEm || ch.dataInicio,
        });
      }
    });

    // 2. Alertas de Nascimentos Recentes (últimos 3 dias)
    const nascimentos = this.getRegistrosNascimento();
    nascimentos.forEach(nasc => {
      const diasDesdeNascimento = daysBetween(nasc.dataNascimentoReal, todayStr);
      if (diasDesdeNascimento >= 0 && diasDesdeNascimento <= 3) {
        const chocadaAssoc = this.getChocadaById(nasc.chocadaId);
        alerts.push({
          id: `al-nasc-${nasc.id}`,
          titulo: `Pintinhos Nascidos! (${chocadaAssoc?.nome || 'Lote'})`,
          msg: `Sucesso! ${nasc.pintinhosNascidos} pintinhos acabaram de nascer.`,
          tipo: 'info',
          chocadaId: nasc.chocadaId,
          data: nasc.dataNascimentoReal,
        });
      }
    });

    // 3. Alertas de Vendas Recentes (últimos 3 dias)
    const vendas = this.getLancamentos().filter(l => l.tipo === 'RECEITA' && l.categoria === 'Venda de Pintinhos');
    vendas.forEach(v => {
      const diasDesdeVenda = daysBetween(v.data, todayStr);
      if (diasDesdeVenda >= 0 && diasDesdeVenda <= 3) {
        alerts.push({
          id: `al-venda-${v.id}`,
          titulo: `Venda Realizada!`,
          msg: `Foram vendidos ${v.quantidadePintinhos || 0} pintinhos no valor de R$ ${v.valor.toFixed(2)}.`,
          tipo: 'info',
          data: v.data,
        });
      }
    });

    // Ordenar alertas por data (mais recentes primeiro) e retornar
    return alerts.sort((a, b) => b.data.localeCompare(a.data));
  }

  // ==========================================
  // NOTIFICAÇÕES (Sino) — Busca, Persistência
  // ==========================================

  /**
   * Gera notificações a partir dos dados atuais (baseado em getAlertas())
   * com classificação por severidade e metadados de navegação.
   */
  public async syncNotificacoesFromData(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const todayStr = getCurrentDateString();
    const chocadas = this.getChocadas();
    const novasNotificacoes: Omit<Notificacao, 'id' | 'user_id' | 'criado_em' | 'atualizado_em'>[] = [];

    chocadas.forEach(ch => {
      // 🔴 Crítico: Registro atrasado (sem registro há mais de 48h)
      if (ch.status === 'ATRASADA') {
        const diff = daysBetween(ch.dataPrevistaNascimento, todayStr);
        novasNotificacoes.push({
          severidade: 'CRITICO',
          tipo_alerta: 'registro_atrasado',
          titulo: `Lote atrasado: ${ch.nome}`,
          descricao: `Lote atrasado em D+${diff} dia(s). Realize verificação sanitária imediata.`,
          entidade_relacionada: ch.nome,
          link_destino: 'chocada_detalhes',
          chocada_id: ch.id,
          chocadeira_id: ch.chocadeiraId,
          timestamp_completo: new Date().toISOString(),
          lido: false,
        });
      }

      // 🟠 Atenção: Registro pendente hoje
      const registrosHoje = this.getRegistrosDiarios(ch.id).filter(r => r.data === todayStr);
      if (registrosHoje.length === 0 && (ch.status === 'EM_ANDAMENTO' || ch.status === 'PROXIMA')) {
        novasNotificacoes.push({
          severidade: 'ATENCAO',
          tipo_alerta: 'registro_pendente',
          titulo: `Pendente: Registro diário — ${ch.nome}`,
          descricao: `Inspeção de hoje ainda não foi realizada. Lembre-se de verificar temperatura, umidade e virar os ovos.`,
          entidade_relacionada: ch.nome,
          link_destino: 'chocada_detalhes',
          chocada_id: ch.id,
          chocadeira_id: ch.chocadeiraId,
          timestamp_completo: new Date().toISOString(),
          lido: false,
        });
      }

      // 🟠 Atenção: Nascimento próximo (≤3 dias)
      if (ch.status === 'PROXIMA') {
        const daysLeft = daysBetween(todayStr, ch.dataPrevistaNascimento);
        novasNotificacoes.push({
          severidade: 'ATENCAO',
          tipo_alerta: 'nascimento_proximo',
          titulo: `Nascimento próximo: ${ch.nome}`,
          descricao: `Faltam ${daysLeft} dia(s) para o nascimento. Eleve a umidade para ~70% e prepare o ambiente.`,
          entidade_relacionada: ch.nome,
          link_destino: 'chocada_detalhes',
          chocada_id: ch.id,
          chocadeira_id: ch.chocadeiraId,
          timestamp_completo: new Date().toISOString(),
          lido: false,
        });
      }

      // 🔵 Informativo: Novo lote cadastrado (últimos 3 dias)
      const diasDesdeCriacao = daysBetween(ch.criadoEm || ch.dataInicio, todayStr);
      if (diasDesdeCriacao >= 0 && diasDesdeCriacao <= 3) {
        novasNotificacoes.push({
          severidade: 'INFORMATIVO',
          tipo_alerta: 'novo_lote',
          titulo: `Novo lote: ${ch.nome}`,
          descricao: `Lote iniciado com ${ch.quantidadeOvosInicial} ovos de ${ch.tipoOvo}. Previsão de nascimento: ${this.formatReadableDate(ch.dataPrevistaNascimento)}.`,
          entidade_relacionada: ch.nome,
          link_destino: 'chocada_detalhes',
          chocada_id: ch.id,
          chocadeira_id: ch.chocadeiraId,
          timestamp_completo: new Date(ch.criadoEm || ch.dataInicio + 'T12:00:00').toISOString(),
          lido: false,
        });
      }
    });

    // 🔵 Informativo: Pintinhos nascidos (últimos 3 dias)
    const nascimentos = this.getRegistrosNascimento();
    nascimentos.forEach(nasc => {
      const diasDesdeNascimento = daysBetween(nasc.dataNascimentoReal, todayStr);
      if (diasDesdeNascimento >= 0 && diasDesdeNascimento <= 3) {
        const chocadaAssoc = this.getChocadaById(nasc.chocadaId);
        novasNotificacoes.push({
          severidade: 'INFORMATIVO',
          tipo_alerta: 'pintinhos_nascidos',
          titulo: `Pintinhos nasceram! ${chocadaAssoc?.nome || ''}`,
          descricao: `${nasc.pintinhosNascidos} pintinhos nasceram com sucesso.`,
          entidade_relacionada: chocadaAssoc?.nome,
          link_destino: 'chocada_detalhes',
          chocada_id: nasc.chocadaId,
          chocadeira_id: chocadaAssoc?.chocadeiraId,
          timestamp_completo: new Date(nasc.dataNascimentoReal + 'T12:00:00').toISOString(),
          lido: false,
        });
      }
    });

    // 🔵 Informativo: Vendas recentes (últimos 3 dias)
    const vendas = this.getLancamentos().filter(l => l.tipo === 'RECEITA' && l.categoria === 'Venda de Pintinhos');
    vendas.forEach(v => {
      const diasDesdeVenda = daysBetween(v.data, todayStr);
      if (diasDesdeVenda >= 0 && diasDesdeVenda <= 3) {
        novasNotificacoes.push({
          severidade: 'INFORMATIVO',
          tipo_alerta: 'venda_realizada',
          titulo: 'Venda realizada!',
          descricao: `${v.quantidadePintinhos || 0} pintinhos vendidos — R$ ${v.valor.toFixed(2)}.`,
          link_destino: 'financeiro',
          timestamp_completo: new Date(v.data + 'T12:00:00').toISOString(),
          lido: false,
        });
      }
    });

    // Buscar notificações existentes no Supabase para preservar estado de leitura
    const { data: notificacoesExistentes } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', userId);

    // Mapa de fingerprint → notificação existente
    const mapaExistente = new Map<string, Notificacao>();
    (notificacoesExistentes || []).forEach(n => {
      const fingerprint = `${n.tipo_alerta}|${n.chocada_id || ''}|${n.chocadeira_id || ''}`;
      mapaExistente.set(fingerprint, n);
    });

    // Inserir apenas notificações que ainda não existem
    for (const nova of novasNotificacoes) {
      const fingerprint = `${nova.tipo_alerta}|${nova.chocada_id || ''}|${nova.chocadeira_id || ''}`;
      if (!mapaExistente.has(fingerprint)) {
        const payload = {
          ...nova,
          user_id: userId,
        };
        const { error } = await supabase.from('notificacoes').insert(payload);
        if (error) {
          console.error('Erro ao salvar notificação:', error);
        }
      }
    }

    // Recarregar cache de notificações
    await this.loadNotificacoesFromSupabase();
  }

  /**
   * Carrega notificações do Supabase para o cache local.
   */
  public async loadNotificacoesFromSupabase(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp_completo', { ascending: false });

    if (data) {
      this.cache.notificacoes = data;
      this.saveNotificacoesCache();
      this.notifyListeners();
    }
  }

  /**
   * Retorna notificações do cache local.
   */
  public getNotificacoes(): Notificacao[] {
    return this.cache.notificacoes;
  }

  /**
   * Marca uma notificação como lida/não lida.
   */
  public async marcarNotificacaoLida(id: string, lido: boolean = true): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const { error } = await supabase
      .from('notificacoes')
      .update({ lido })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return;
    }

    // Atualizar cache local
    const idx = this.cache.notificacoes.findIndex(n => n.id === id);
    if (idx >= 0) {
      this.cache.notificacoes[idx].lido = lido;
      this.saveNotificacoesCache();
      this.notifyListeners();
    }
  }

  /**
   * Marca todas as notificações do usuário como lidas.
   */
  public async marcarTodasNotificacoesLidas(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const { error } = await supabase
      .from('notificacoes')
      .update({ lido: true })
      .eq('user_id', userId)
      .eq('lido', false);

    if (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return;
    }

    this.cache.notificacoes.forEach(n => { n.lido = true; });
    this.saveNotificacoesCache();
    this.notifyListeners();
  }

  /**
   * Contagem de não lidas, separadas por severidade.
   */
  public getContagemNotificacoes(): { critico: number; atencao: number; informativo: number; totalAcao: number } {
    const naoLidas = this.cache.notificacoes.filter(n => !n.lido);
    const critico = naoLidas.filter(n => n.severidade === 'CRITICO').length;
    const atencao = naoLidas.filter(n => n.severidade === 'ATENCAO').length;
    const informativo = naoLidas.filter(n => n.severidade === 'INFORMATIVO').length;
    return {
      critico,
      atencao,
      informativo,
      totalAcao: critico + atencao, // Apenas Crítico + Atenção contam no badge
    };
  }

  /**
   * Inicia polling periódico de notificações.
   */
  public startNotificationPolling(intervalMs: number = 60000, autoSync: boolean = false): void {
    this.stopNotificationPolling();
    this.notificationPollInterval = setInterval(async () => {
      if (autoSync) {
        // Gera novas notificações com base nos dados atuais e recarrega do Supabase
        await this.syncNotificacoesFromData();
      } else {
        await this.loadNotificacoesFromSupabase();
      }
    }, intervalMs);
  }

  /**
   * Para o polling de notificações.
   */
  public stopNotificationPolling(): void {
    if (this.notificationPollInterval) {
      clearInterval(this.notificationPollInterval);
      this.notificationPollInterval = null;
    }
  }

  /**
   * Registra um listener para mudanças nas notificações.
   */
  public onNotificacoesChange(listener: () => void): () => void {
    this.notificationListeners.add(listener);
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.notificationListeners.forEach(fn => fn());
  }

  private saveNotificacoesCache(): void {
    try {
      window.localStorage.setItem('laranjeiras_notificacoes_cache', JSON.stringify(this.cache.notificacoes));
    } catch (e) {
      // ignore
    }
  }

  private loadNotificacoesFromLocalCache(): void {
    try {
      const cached = window.localStorage.getItem('laranjeiras_notificacoes_cache');
      if (cached) {
        this.cache.notificacoes = JSON.parse(cached);
      }
    } catch (e) {
      // ignore
    }
  }

  public formatReadableDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  // --- FINANCEIRO ---
  public getLancamentos(incluiExcluidos = false): LancamentoFinanceiro[] {
    return this.cache.financeiro_lancamentos
      .filter(item => incluiExcluidos || !item.excluido)
      .map(this.normalizeLancamento)
      .sort((a, b) => b.data.localeCompare(a.data));
  }

  public async saveLancamento(lancamento: LancamentoFinanceiro): Promise<{ success: boolean; message: string }> {
    if (lancamento.valor <= 0) return { success: false, message: 'O valor do lançamento deve ser maior que zero.' };
    if (!lancamento.data) return { success: false, message: 'A data do lançamento é obrigatória.' };
    if (!lancamento.categoria) return { success: false, message: 'A categoria do lançamento é obrigatória.' };

    // Validação adicional de estoque de pintinhos se for venda
    if (lancamento.tipo === 'RECEITA' && lancamento.categoria === 'Venda de Pintinhos' && lancamento.chocadeiraId) {
      const qtd = toSafeInteger(lancamento.quantidadePintinhos);
      if (qtd <= 0) {
        return { success: false, message: 'A quantidade de pintinhos vendida deve ser maior que zero.' };
      }
      lancamento.quantidadePintinhos = qtd;
      const estoque = this.getEstoquePintinhosPorChocadeira(lancamento.chocadeiraId, lancamento.id);
      if (qtd > estoque.disponivel) {
        return {
          success: false,
          message: `Estoque insuficiente! A chocadeira possui apenas ${estoque.disponivel} pintinhos disponíveis para venda. (Total Nascidos: ${estoque.nascidos}, Total Vendidos: ${estoque.vendidos})`
        };
      }
    }

    const list = this.cache.financeiro_lancamentos;
    const index = list.findIndex(item => item.id === lancamento.id);
    const dateStr = CURRENT_DATE_STRING;

    if (index >= 0) {
      lancamento.atualizadoEm = dateStr;
      list[index] = { ...list[index], ...lancamento };
    } else {
      lancamento.id = lancamento.id || `lanc-${Date.now()}`;
      lancamento.criadoEm = dateStr;
      lancamento.atualizadoEm = dateStr;
      lancamento.excluido = false;
      list.push(lancamento);
    }

    const { error } = await this.upsertLancamentoToSupabase(lancamento);
    if (error) {
      console.error('Erro ao salvar lançamento no Supabase:', error);
      return { success: false, message: `Erro ao salvar no banco de dados (RLS/Permissões): ${error.message}` };
    }

    return {
      success: true,
      message: this.financeiroAceitaFormaPagamento
        ? 'Lançamento financeiro salvo com sucesso.'
        : 'Lançamento salvo. Atualize o schema do Supabase para persistir a forma de pagamento.',
    };
  }

  public async deleteLancamento(id: string): Promise<{ success: boolean; message: string }> {
    const list = this.cache.financeiro_lancamentos;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      const lanc = { ...list[index] };
      lanc.excluido = true;
      lanc.atualizadoEm = CURRENT_DATE_STRING;

      const { error } = await this.upsertLancamentoToSupabase(lanc);
      if (error) {
        console.error('Erro ao excluir lançamento no Supabase:', error);
        return { success: false, message: `Erro ao salvar exclusão no banco de dados: ${error.message}` };
      }
      list[index] = lanc;
    }
    return { success: true, message: 'Lançamento financeiro excluído com sucesso.' };
  }

  public getEstoquePintinhosPorChocadeira(chocadeiraId: string, ignoreLancamentoId?: string): { nascidos: number; vendidos: number; disponivel: number } {
    // 1. Achar todas as chocadas finalizadas vinculadas a esta chocadeira
    const chocadasFinalizadas = this.getChocadas().filter(
      c => c.chocadeiraId === chocadeiraId && c.finalizada && !c.excluido
    );

    // 2. Somar o total de nascimentos dessas chocadas
    let totalNascidos = 0;
    chocadasFinalizadas.forEach(ch => {
      const nascimentos = this.getRegistrosNascimento(ch.id);
      nascimentos.forEach(n => {
        totalNascidos += toSafeInteger(n.pintinhosNascidos);
      });
    });

    // 3. Somar o total de pintinhos vendidos desta chocadeira
    let totalVendidos = 0;
    const vendas = this.cache.financeiro_lancamentos.filter(
      l => !l.excluido &&
           l.tipo === 'RECEITA' &&
           l.categoria === 'Venda de Pintinhos' &&
           l.chocadeiraId === chocadeiraId &&
           l.id !== ignoreLancamentoId
    );
    vendas.forEach(v => {
      totalVendidos += toSafeInteger(v.quantidadePintinhos);
    });

    return {
      nascidos: totalNascidos,
      vendidos: totalVendidos,
      disponivel: Math.max(0, totalNascidos - totalVendidos)
    };
  }

  public getEstoquePintinhosGeral(ignoreLancamentoId?: string): { nascidos: number; vendidos: number; disponivel: number } {
    return this.getChocadeiras().reduce(
      (total, chocadeira) => {
        const estoque = this.getEstoquePintinhosPorChocadeira(chocadeira.id, ignoreLancamentoId);
        return {
          nascidos: total.nascidos + estoque.nascidos,
          vendidos: total.vendidos + estoque.vendidos,
          disponivel: total.disponivel + estoque.disponivel,
        };
      },
      { nascidos: 0, vendidos: 0, disponivel: 0 }
    );
  }

  // ==========================================
  // TRANSFERÊNCIAS AGENDADAS
  // ==========================================

  public getTransferenciasAgendadas(): TransferenciaAgendada[] {
    return this.cache.transferencias_agendadas
      .filter(t => t.ativo)
      .sort((a, b) => a.diaVencimento - b.diaVencimento);
  }

  public async saveTransferenciaAgendada(t: TransferenciaAgendada): Promise<{ success: boolean; message: string }> {
    if (t.valor <= 0) return { success: false, message: 'O valor deve ser maior que zero.' };
    if (t.diaVencimento < 1 || t.diaVencimento > 31) return { success: false, message: 'O dia de vencimento deve estar entre 1 e 31.' };

    const list = this.cache.transferencias_agendadas;
    const index = list.findIndex(item => item.id === t.id);

    if (index >= 0) {
      list[index] = { ...list[index], ...t };
    } else {
      t.id = t.id || `transf-agend-${Date.now()}`;
      t.criadoEm = CURRENT_DATE_STRING;
      t.ativo = true;
      t.ultimaExecucao = null;
      list.push(t);
    }

    this.saveLocalCache();
    return { success: true, message: 'Transferência agendada salva com sucesso!' };
  }

  public async deleteTransferenciaAgendada(id: string): Promise<{ success: boolean; message: string }> {
    const list = this.cache.transferencias_agendadas;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      list[index].ativo = false;
      this.saveLocalCache();
      return { success: true, message: 'Agendamento removido.' };
    }
    return { success: false, message: 'Agendamento não encontrado.' };
  }

  /**
   * Verifica e executa transferências agendadas que estão vencidas.
   * Retorna quantas foram executadas.
   */
  public async executarTransferenciasAgendadas(): Promise<number> {
    const hoje = getCurrentDateString();
    const hojeParts = hoje.split('-');
    const hojeDia = parseInt(hojeParts[2]);
    const hojeMesAno = hojeParts[0] + '-' + hojeParts[1]; // YYYY-MM

    let executadas = 0;

    for (const t of this.cache.transferencias_agendadas) {
      if (!t.ativo) continue;

      // Verificar se hoje é >= dia de vencimento
      if (hojeDia < t.diaVencimento) continue;

      // Verificar se já foi executada este mês
      if (t.ultimaExecucao) {
        const ultimaExecucaoMes = t.ultimaExecucao.substring(0, 7); // YYYY-MM
        if (ultimaExecucaoMes === hojeMesAno) continue;
      }

      // Executar transferência
      const timestamp = Date.now() + executadas;
      const desc = t.descricao.trim()
        ? `Transferência agendada: ${t.descricao.trim()}`
        : `Transferência agendada (dia ${t.diaVencimento})`;

      const saida: LancamentoFinanceiro = {
        id: `transf-agend-saida-${timestamp}`,
        tipo: 'DESPESA',
        formaPagamento: t.direction === 'paraConta' ? 'DINHEIRO' : 'BANCO',
        valor: t.valor,
        descricao: `${desc} (saída)`,
        data: hoje,
        categoria: 'Transferência entre contas',
        excluido: false,
        criadoEm: '',
        atualizadoEm: '',
      };

      const entrada: LancamentoFinanceiro = {
        id: `transf-agend-entrada-${timestamp}`,
        tipo: 'RECEITA',
        formaPagamento: t.direction === 'paraConta' ? 'BANCO' : 'DINHEIRO',
        valor: t.valor,
        descricao: `${desc} (entrada)`,
        data: hoje,
        categoria: 'Transferência entre contas',
        excluido: false,
        criadoEm: '',
        atualizadoEm: '',
      };

      const resSaida = await this.saveLancamento(saida);
      if (!resSaida.success) {
        console.error(`Erro ao executar transferência agendada ${t.id} (saída):`, resSaida.message);
        continue;
      }

      const resEntrada = await this.saveLancamento(entrada);
      if (!resEntrada.success) {
        console.error(`Erro ao executar transferência agendada ${t.id} (entrada):`, resEntrada.message);
        continue;
      }

      // Atualizar última execução
      t.ultimaExecucao = hoje;
      executadas++;
    }

    if (executadas > 0) {
      this.saveLocalCache();
    }

    return executadas;
  }
}

export const repo = new AppRepository();
