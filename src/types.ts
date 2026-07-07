/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SeveridadeNotificacao = 'CRITICO' | 'ATENCAO' | 'INFORMATIVO';

export interface Notificacao {
  id: string;
  user_id: string;
  severidade: SeveridadeNotificacao;
  tipo_alerta: string;
  titulo: string;
  descricao: string;
  entidade_relacionada?: string;
  link_destino?: string;
  chocada_id?: string;
  chocadeira_id?: string;
  timestamp_completo: string;
  lido: boolean;
  criado_em: string;
  atualizado_em: string;
}

export type Role = 'ADMIN' | 'OPERADOR' | 'LEITOR';

export interface Usuario {
  id: string;
  username: string;
  senhaMock: string;
  role: Role;
  ativo: boolean;
  criadoEm: string;
  auth_user_id?: string;
}

export interface Chocadeira {
  id: string;
  nome: string;
  modelo: string;
  capacidadeMaximaOvos: number;
  localizacao: string;
  status: string; // 'Ativa' | 'Inativa' | 'Manutenção'
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
  excluido: boolean;
}

export type ChocadaStatus = 'EM_ANDAMENTO' | 'PROXIMA' | 'ATRASADA' | 'FINALIZADA' | 'CANCELADA';

export interface Chocada {
  id: string;
  nome: string;
  tipoOvo: string; // 'Galinha' | 'Codorna' | 'Pato' | 'Peru' etc.
  dataInicio: string; // YYYY-MM-DD
  dataPrevistaNascimento: string; // YYYY-MM-DD
  quantidadeOvosInicial: number;
  quantidadeOvosAtivos: number;
  chocadeiraId: string;
  temperaturaIdeal: number;
  umidadeIdeal: number;
  status: ChocadaStatus;
  observacoes: string;
  finalizada: boolean;
  cancelada: boolean;
  criadoEm: string;
  atualizadoEm: string;
  excluido: boolean;
}

export interface RegistroDiario {
  id: string;
  chocadaId: string;
  data: string; // YYYY-MM-DD
  temperatura: number;
  umidade: number;
  ovosVirados: boolean;
  observacoes: string;
  ocorrencias: string;
  criadoEm: string;
  atualizadoEm: string;
  excluido: boolean;
}

export interface Ovoscopia {
  id: string;
  chocadaId: string;
  data: string; // YYYY-MM-DD
  ovosFerteis: number;
  ovosInferteis: number;
  ovosDescartados: number;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
  excluido: boolean;
}

export interface RegistroNascimento {
  id: string;
  chocadaId: string;
  dataNascimentoReal: string; // YYYY-MM-DD
  pintinhosNascidos: number;
  ovosNaoEclodidos: number;
  perdas: number;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
  excluido: boolean;
}

export interface Propriedade {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  cidade: string;
  estado: string;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Alerta {
  id: string;
  titulo: string;
  msg: string;
  tipo: 'error' | 'warning' | 'info';
  chocadaId?: string;
  data: string;
}

export interface LancamentoFinanceiro {
  id: string;
  tipo: 'RECEITA' | 'DESPESA';
  valor: number;
  descricao: string;
  data: string; // YYYY-MM-DD
  categoria: string; // 'Venda de Pintinhos' | 'Compra de Ração' | 'Medicamentos' | 'Energia' | 'Outros'
  formaPagamento?: 'BANCO' | 'DINHEIRO'; // Opcional para manter compatibilidade com antigos
  quantidadePintinhos?: number; // Opcional, usado se for Venda de Pintinhos
  chocadeiraId?: string; // Opcional, vincula à chocadeira
  chocadaId?: string; // Opcional, vincula ao lote
  criadoEm: string;
  atualizadoEm: string;
  excluido: boolean;
}
