/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chocadeira, Chocada, RegistroDiario, Ovoscopia, RegistroNascimento, Propriedade, Alerta, ChocadaStatus, Usuario, LancamentoFinanceiro } from './types';
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
  };

  private isLoaded = false;
  private financeiroAceitaFormaPagamento = true;

  constructor() {
    // Initialized empty. App.tsx should call loadFromSupabase()
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

      const [prop, chocadeiras, chocadas, registros, ovos, nascimentos, users, lancamentos] = await Promise.all([
        supabase.from('propriedades').select('*'),
        supabase.from('chocadeiras').select('*').eq('excluido', false),
        supabase.from('chocadas').select('*').eq('excluido', false),
        supabase.from('registros_diarios').select('*').eq('excluido', false).gte('data', limitDateStr),
        supabase.from('ovoscopias').select('*').eq('excluido', false),
        supabase.from('registros_nascimentos').select('*').eq('excluido', false),
        supabase.from('usuarios').select('*').eq('ativo', true),
        supabase.from('financeiro_lancamentos').select('*').eq('excluido', false)
      ]);

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

      this.isLoaded = true;
    } catch (e) {
      console.error('Error loading from Supabase, operating offline or corrupted', e);
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
      formaPagamento: lancamento.formaPagamento || 'BANCO',
    };
  }

  private async upsertLancamentoToSupabase(lancamento: LancamentoFinanceiro) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    const record = { ...lancamento };
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
    return filtered;
  }

  public async saveRegistroNascimento(nasc: RegistroNascimento): Promise<{ success: boolean; message: string }> {
    const chocada = this.getChocadaById(nasc.chocadaId);
    if (!chocada) return { success: false, message: 'Incubação não encontrada.' };
    if (!nasc.dataNascimentoReal) return { success: false, message: 'A data do nascimento real é obrigatória.' };
    
    const list = this.cache.registros_nascimentos;
    const index = list.findIndex(item => item.id === nasc.id);
    const dateStr = CURRENT_DATE_STRING;

    const clone = { ...nasc };
    if (index >= 0) {
      clone.atualizadoEm = dateStr;
    } else {
      clone.id = clone.id || `rn-${Date.now()}`;
      clone.criadoEm = dateStr;
      clone.atualizadoEm = dateStr;
      clone.excluido = false;
    }

    try {
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
      const clone = { ...list[index], excluido: true, atualizadoEm: CURRENT_DATE_STRING };
      
      try {
        await this.upsertToSupabase('registros_nascimentos', clone);

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

        list[index] = clone;
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
      const qtd = lancamento.quantidadePintinhos || 0;
      if (qtd <= 0) {
        return { success: false, message: 'A quantidade de pintinhos vendida deve ser maior que zero.' };
      }
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
        totalNascidos += n.pintinhosNascidos;
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
      totalVendidos += v.quantidadePintinhos || 0;
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
}

export const repo = new AppRepository();
