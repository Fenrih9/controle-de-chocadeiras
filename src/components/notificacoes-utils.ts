/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, AlertCircle, Info, type LucideIcon } from 'lucide-react';

export interface SeveridadeStyle {
  label: string;
  icon: LucideIcon;
  color: string;
  bgSoft: string;
  borderColor: string;
  emoji: string;
}

export const severityConfig: Record<string, SeveridadeStyle> = {
  CRITICO: {
    label: 'Crítico',
    icon: AlertTriangle,
    color: 'var(--color-danger)',
    bgSoft: 'var(--color-danger-soft)',
    borderColor: 'var(--color-danger)',
    emoji: '🔴',
  },
  ATENCAO: {
    label: 'Atenção',
    icon: AlertCircle,
    color: 'var(--color-warning)',
    bgSoft: 'var(--color-warning-soft)',
    borderColor: 'var(--color-warning)',
    emoji: '🟠',
  },
  INFORMATIVO: {
    label: 'Informativo',
    icon: Info,
    color: 'var(--color-info)',
    bgSoft: 'var(--color-info-soft)',
    borderColor: 'var(--color-info)',
    emoji: '🔵',
  },
};

export function timeAgo(isoTimestamp: string): string {
  if (!isoTimestamp) return '';
  const now = new Date();
  const date = new Date(isoTimestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)}sem`;
  return date.toLocaleDateString('pt-BR');
}
