/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chocadeira, Chocada, RegistroDiario, Ovoscopia, RegistroNascimento, Propriedade, Alerta, ChocadaStatus, Usuario } from './types';
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
  };

  private isLoaded = false;

  constructor() {
    // Initialized empty. App.tsx should call loadFromSupabase()
  }

  // Fetch all tables from Supabase and cache them
  public async loadFromSupabase(): Promise<void> {
    if (this.isLoaded) return;
    
    try {
      const [prop, chocadeiras, chocadas, registros, ovos, nascimentos, users] = await Promise.all([
        supabase.from('propriedades').select('*'),
        supabase.from('chocadeiras').select('*'),
        supabase.from('chocadas').select('*'),
        supabase.from('registros_diarios').select('*'),
        supabase.from('ovoscopias').select('*'),
        supabase.from('registros_nascimentos').select('*'),
        supabase.from('usuarios').select('*')
      ]);

      if (prop.data) this.cache.propriedades = prop.data;
      if (chocadeiras.data) this.cache.chocadeiras = chocadeiras.data;
      if (chocadas.data) this.cache.chocadas = chocadas.data;
      if (registros.data) this.cache.registros_diarios = registros.data;
      if (ovos.data) this.cache.ovoscopias = ovos.data;
      if (nascimentos.data) this.cache.registros_nascimentos = nascimentos.data;
      if (users.data) this.cache.usuarios = users.data;

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
    return this.cache.usuarios.find(u => u.username === username);
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

  public deleteUsuario(id: string): { success: boolean; message: string } {
    const list = this.cache.usuarios;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      // Bloquear deleção de si mesmo ou admin
      if (list[index].username === 'admin') {
        return { success: false, message: 'Não é possível excluir o super administrador.' };
      }
      
      const deletedUser = list.splice(index, 1)[0];
      // Note: No supabase, seria melhor ter ativo = false, mas para simplificar vamos deletar ou fazer inativo.
      deletedUser.ativo = false;
      this.upsertToSupabase('usuarios', deletedUser);
    }
    return { success: true, message: 'Usuário inativado/removido.' };
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
    const activeChocadas = this.getChocadas().filter(
      c => c.chocadeiraId === id && (c.status === 'EM_ANDAMENTO' || c.status === 'PROXIMA' || c.status === 'ATRASADA')
    );

    if (activeChocadas.length > 0) {
      return {
        success: false,
        message: `Não é possível excluir esta chocadeira pois está vinculada ao lote ativo "${activeChocadas[0].nome}".`,
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

  public deleteChocada(id: string): void {
    const list = this.cache.chocadas;
    const index = list.findIndex(item => item.id === id);
    if (index >= 0) {
      list[index].excluido = true;
      list[index].atualizadoEm = CURRENT_DATE_STRING;
      this.upsertToSupabase('chocadas', list[index]);
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
          tipo: 'info',
          chocadaId: ch.id,
          data: todayStr,
        });
      }
    });

    return alerts;
  }

  public formatReadableDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }
}

export const repo = new AppRepository();
