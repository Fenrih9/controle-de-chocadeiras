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

  constructor() {
    // Initialized empty. App.tsx should call loadFromSupabase()
  }

  // Fetch all tables from Supabase and cache them
  public async loadFromSupabase(): Promise<void> {
    if (this.isLoaded) return;
    
    try {
      const [prop, chocadeiras, chocadas, registros, ovos, nascimentos, users, lancamentos] = await Promise.all([
        supabase.from('propriedades').select('*'),
        supabase.from('chocadeiras').select('*'),
        supabase.from('chocadas').select('*'),
        supabase.from('registros_diarios').select('*'),
        supabase.from('ovoscopias').select('*'),
        supabase.from('registros_nascimentos').select('*'),
        supabase.from('usuarios').select('*').eq('ativo', true),
        supabase.from('financeiro_lancamentos').select('*')
      ]);

      if (prop.data) this.cache.propriedades = prop.data;
      if (chocadeiras.data) this.cache.chocadeiras = chocadeiras.data;
      if (chocadas.data) this.cache.chocadas = chocadas.data;
      if (registros.data) this.cache.registros_diarios = registros.data;
      if (ovos.data) this.cache.ovoscopias = ovos.data;
      if (nascimentos.data) this.cache.registros_nascimentos = nascimentos.data;
      if (users.data) this.cache.usuarios = users.data;
      if (lancamentos.data) this.cache.financeiro_lancamentos = lancamentos.data;

      // Seed fallback if absolutely empty
      if (this.cache.propriedades.length === 0) {
        this.cache.propriedades.push(SEED_PROPRIEDADE);
        this.upsertToSupabase('propriedades', SEED_PROPRIEDADE);
      }

      // Seed fallback admin user
      if (this.cache.usuarios.length === 0) {
        const seedAdmin: Usuario = {
          id: 'usr-admin',
          username: 'admin',
          senhaMock: 'admin123',
          role: 'ADMIN',
          ativo: true,
          criadoEm: CURRENT_DATE_STRING,
        };
        this.cache.usuarios.push(seedAdmin);
        this.upsertToSupabase('usuarios', seedAdmin);
      }

      this.isLoaded = true;
    } catch (e) {
      console.error('Error loading from Supabase, operating offline or corrupted', e);
      // fallback to whatever is in memory (empty)
    }
  }

  // Generic background sync helper
  private async upsertToSupabase(table: string, payload: any) {
    // Fire and forget, no await to not block UI
    supabase.from(table).upsert(payload).then(({ error }) => {
      if (error) {
        console.error(`Error saving to ${table} on Supabase:`, error);
      }
    });
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

  public savePropriedade(prop: Propriedade): void {
    prop.atualizadoEm = CURRENT_DATE_STRING;
    // update cache
    if (this.cache.propriedades.length > 0) {
      this.cache.propriedades[0] = prop;
    } else {
      this.cache.propriedades.push(prop);
    }
    // sync supabase
    this.upsertToSupabase('propriedades', prop);
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

  public saveChocadeira(chocadeira: Chocadeira): void {
    const list = this.cache.chocadeiras;
    const index = list.findIndex(item => item.id === chocadeira.id);
    const dateStr = CURRENT_DATE_STRING;
    
    if (index >= 0) {
      chocadeira.atualizadoEm = dateStr;
      list[index] = { ...list[index], ...chocadeira };
    } else {
      chocadeira.id = chocadeira.id || `choc-${Date.now()}`;
      chocadeira.criadoEm = dateStr;
      chocadeira.atualizadoEm = dateStr;
      chocadeira.excluido = false;
      list.push(chocadeira);
    }
    this.upsertToSupabase('chocadeiras', chocadeira);
  }

  public deleteChocadeira(id: string): { success: boolean; message: string } {
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
      list[index].excluido = true;
      list[index].atualizadoEm = CURRENT_DATE_STRING;
      this.upsertToSupabase('chocadeiras', list[index]);
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

  public saveChocada(chocada: Chocada): { success: boolean; message: string; data?: Chocada } {
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
    chocada.dataPrevistaNascimento = addDays(chocada.dataInicio, duration);

    const list = this.cache.chocadas;
    const index = list.findIndex(item => item.id === chocada.id);
    const dateStr = CURRENT_DATE_STRING;

    if (index >= 0) {
      chocada.atualizadoEm = dateStr;
      list[index] = { ...list[index], ...chocada };
      chocada = this.recalculateChocadaStatusAndBalance(list[index]);
    } else {
      chocada.id = chocada.id || `chocada-${Date.now()}`;
      chocada.quantidadeOvosAtivos = chocada.quantidadeOvosInicial;
      chocada.criadoEm = dateStr;
      chocada.atualizadoEm = dateStr;
      chocada.excluido = false;
      chocada.finalizada = false;
      chocada.cancelada = false;
      list.push(chocada);
    }
    chocada = this.recalculateChocadaStatusAndBalance(chocada);
    this.upsertToSupabase('chocadas', chocada);
    const saved = this.getChocadaById(chocada.id);
    return { success: true, message: 'Lote registrado com sucesso.', data: saved };
  }

  public deleteChocada(id: string): { success: boolean; message: string } {
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

      list[index].excluido = true;
      list[index].atualizadoEm = CURRENT_DATE_STRING;
      this.upsertToSupabase('chocadas', list[index]);
    }
    return { success: true, message: 'Chocada excluída com segurança.' };
  }

  public cancelarChocada(id: string): { success: boolean; message: string } {
    const list = this.cache.chocadas;
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return { success: false, message: 'Chocada não encontrada.' };

    const chocada = list[index];

    // Verificar impacto no estoque
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

    // Soft delete em cascata
    const registros = this.cache.registros_diarios.filter(r => r.chocadaId === id && !r.excluido);
    registros.forEach(r => {
      r.excluido = true;
      r.atualizadoEm = dateStr;
      this.upsertToSupabase('registros_diarios', r);
    });

    const ovoscopias = this.cache.ovoscopias.filter(o => o.chocadaId === id && !o.excluido);
    ovoscopias.forEach(o => {
      o.excluido = true;
      o.atualizadoEm = dateStr;
      this.upsertToSupabase('ovoscopias', o);
    });

    const nascimentos = this.cache.registros_nascimentos.filter(n => n.chocadaId === id && !n.excluido);
    nascimentos.forEach(n => {
      n.excluido = true;
      n.atualizadoEm = dateStr;
      this.upsertToSupabase('registros_nascimentos', n);
    });

    // Inativar lote
    chocada.cancelada = true;
    chocada.finalizada = false;
    chocada.status = 'CANCELADA';
    chocada.atualizadoEm = dateStr;

    this.upsertToSupabase('chocadas', chocada);

    return { success: true, message: 'Lote cancelado e registros vinculados foram estornados com sucesso.' };
  }

  // --- REGISTRO DIÁRIO ---
  public getRegistrosDiarios(chocadaId?: string): RegistroDiario[] {
    let filtered = this.cache.registros_diarios.filter(item => !item.excluido);
    if (chocadaId) {
      filtered = filtered.filter(item => item.chocadaId === chocadaId);
    }
    return filtered.sort((a, b) => b.data.localeCompare(a.data));
  }

  public saveRegistroDiario(reg: RegistroDiario): { success: boolean; message: string } {
    if (reg.temperatura < 0) return { success: false, message: 'A temperatura idealmente não pode ser negativa.' };
    if (reg.umidade < 0 || reg.umidade > 100) return { success: false, message: 'A umidade relativa do ar deve estar entre 0% e 100%.' };

    const list = this.cache.registros_diarios;
    const index = list.findIndex(item => item.id === reg.id);
    const dateStr = CURRENT_DATE_STRING;

    if (index >= 0) {
      reg.atualizadoEm = dateStr;
      list[index] = { ...list[index], ...reg };
    } else {
      reg.id = reg.id || `rd-${Date.now()}`;
      reg.criadoEm = dateStr;
      reg.atualizadoEm = dateStr;
      reg.excluido = false;
      list.push(reg);
    }
    this.upsertToSupabase('registros_diarios', reg);
    return { success: true, message: 'Acompanhamento diário salvo.' };
  }

  public deleteRegistroDiario(id: string): void {
    const list = this.cache.registros_diarios;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      list[index].excluido = true;
      list[index].atualizadoEm = CURRENT_DATE_STRING;
      this.upsertToSupabase('registros_diarios', list[index]);
    }
  }

  // --- OVOSCOPIAS ---
  public getOvoscopias(chocadaId?: string): Ovoscopia[] {
    let filtered = this.cache.ovoscopias.filter(item => !item.excluido);
    if (chocadaId) {
      filtered = filtered.filter(item => item.chocadaId === chocadaId);
    }
    return filtered.sort((a, b) => b.data.localeCompare(a.data));
  }

  public saveOvoscopia(ov: Ovoscopia): { success: boolean; message: string } {
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

    if (index >= 0) {
      ov.atualizadoEm = dateStr;
      list[index] = { ...list[index], ...ov };
    } else {
      ov.id = ov.id || `ov-${Date.now()}`;
      ov.criadoEm = dateStr;
      ov.atualizadoEm = dateStr;
      ov.excluido = false;
      list.push(ov);
    }
    this.upsertToSupabase('ovoscopias', ov);
    this.recalcAndSaveChocadaAfterAction(ov.chocadaId);
    return { success: true, message: 'Ovoscopia registrada com sucesso.' };
  }

  public deleteOvoscopia(id: string): void {
    const list = this.cache.ovoscopias;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      const chocadaId = list[index].chocadaId;
      list[index].excluido = true;
      list[index].atualizadoEm = CURRENT_DATE_STRING;
      this.upsertToSupabase('ovoscopias', list[index]);
      this.recalcAndSaveChocadaAfterAction(chocadaId);
    }
  }

  private recalcAndSaveChocadaAfterAction(chocadaId: string) {
    const rawList = this.cache.chocadas;
    const idx = rawList.findIndex(item => item.id === chocadaId);
    if (idx >= 0) {
      const updatedChocada = this.recalculateChocadaStatusAndBalance(rawList[idx]);
      rawList[idx] = updatedChocada;
      this.upsertToSupabase('chocadas', updatedChocada);
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

  public saveRegistroNascimento(nasc: RegistroNascimento): { success: boolean; message: string } {
    const chocada = this.getChocadaById(nasc.chocadaId);
    if (!chocada) return { success: false, message: 'Incubação não encontrada.' };
    if (!nasc.dataNascimentoReal) return { success: false, message: 'A data do nascimento real é obrigatória.' };
    
    const list = this.cache.registros_nascimentos;
    const index = list.findIndex(item => item.id === nasc.id);
    const dateStr = CURRENT_DATE_STRING;

    if (index >= 0) {
      nasc.atualizadoEm = dateStr;
      list[index] = { ...list[index], ...nasc };
    } else {
      nasc.id = nasc.id || `rn-${Date.now()}`;
      nasc.criadoEm = dateStr;
      nasc.atualizadoEm = dateStr;
      nasc.excluido = false;
      list.push(nasc);
    }
    this.upsertToSupabase('registros_nascimentos', nasc);

    // Dynamic Rule: Finalize incubation
    const rawList = this.cache.chocadas;
    const idx = rawList.findIndex(item => item.id === nasc.chocadaId);
    if (idx >= 0) {
      rawList[idx].finalizada = true;
      rawList[idx].status = 'FINALIZADA';
      rawList[idx].atualizadoEm = dateStr;
      this.upsertToSupabase('chocadas', rawList[idx]);
    }

    return { success: true, message: 'Registro de nascimento salvo e lote finalizado!' };
  }

  public deleteRegistroNascimento(id: string): void {
    const list = this.cache.registros_nascimentos;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      const chocadaId = list[index].chocadaId;
      list[index].excluido = true;
      list[index].atualizadoEm = CURRENT_DATE_STRING;
      this.upsertToSupabase('registros_nascimentos', list[index]);

      const rawList = this.cache.chocadas;
      const idx = rawList.findIndex(item => item.id === chocadaId);
      if (idx >= 0) {
        rawList[idx].finalizada = false;
        rawList[idx].atualizadoEm = CURRENT_DATE_STRING;
        this.upsertToSupabase('chocadas', rawList[idx]);
      }
    }
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

    const { error } = await supabase.from('financeiro_lancamentos').upsert(lancamento);
    if (error) {
      console.error('Erro ao salvar lançamento no Supabase:', error);
      return { success: false, message: `Erro ao salvar no banco de dados (RLS/Permissões): ${error.message}` };
    }

    return { success: true, message: 'Lançamento financeiro salvo com sucesso.' };
  }

  public async deleteLancamento(id: string): Promise<{ success: boolean; message: string }> {
    const list = this.cache.financeiro_lancamentos;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      const lanc = { ...list[index] };
      lanc.excluido = true;
      lanc.atualizadoEm = CURRENT_DATE_STRING;

      const { error } = await supabase.from('financeiro_lancamentos').upsert(lanc);
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
