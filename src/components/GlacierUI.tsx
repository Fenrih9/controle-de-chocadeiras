/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'glass';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  isLoading = false,
  ...props
}) => {
  const baseStyle = "w-full py-3.5 px-4 font-semibold rounded-xl text-sm transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer select-none";
  
  const variants = {
    primary: "bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white shadow-md hover:shadow-lg",
    secondary: "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-line-strong)]",
    danger: "bg-[var(--color-danger)] hover:brightness-110 border border-[var(--color-danger)]/25 text-white shadow-md",
    glass: "bg-[var(--color-surface)]/85 backdrop-blur-md border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className} ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      ) : (
        children
      )}
    </button>
  );
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  borderAccent?: 'default' | 'error' | 'warning' | 'primary' | 'tertiary';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = false,
  borderAccent = 'default',
  ...props
}) => {
  const accents = {
    default: "border-[var(--color-line)]",
    error: "border-[var(--color-danger)]/25",
    warning: "border-[var(--color-warning)]/25",
    primary: "border-[var(--color-brand)]/25",
    tertiary: "border-[var(--color-accent)]/20",
  };

  return (
    <div
      className={`card-base p-5 ${accents[borderAccent]} ${glow ? 'shadow-[var(--shadow-elevated)] ring-1 ring-[var(--color-brand)]/10' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface ChipProps {
  status: 'EM_ANDAMENTO' | 'PROXIMA' | 'ATRASADA' | 'FINALIZADA' | 'CANCELADA' | string;
}

export const StatusChip: React.FC<ChipProps> = ({ status }) => {
  const normalized = status.toUpperCase();
  
  const styles: Record<string, string> = {
    EM_ANDAMENTO: "bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/20",
    PROXIMA: "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/25",
    ATRASADA: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/25",
    FINALIZADA: "bg-[var(--color-brand-soft)] text-[var(--color-brand)] border-[var(--color-brand)]/20",
    CANCELADA: "bg-[var(--color-muted)]/10 text-[var(--color-muted)] border-[var(--color-muted)]/20",
  };

  const labels: Record<string, string> = {
    EM_ANDAMENTO: "EM ANDAMENTO",
    PROXIMA: "PRÓXIMA",
    ATRASADA: "ATRASADA",
    FINALIZADA: "FINALIZADA",
    CANCELADA: "CANCELADA",
  };

  const style = styles[normalized] || "bg-[var(--color-info-soft)] text-[var(--color-info)] border-[var(--color-info)]/20";
  const label = labels[normalized] || normalized;

  return (
    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border flex items-center gap-1.5 ${style}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${
        normalized === 'EM_ANDAMENTO' ? 'bg-[var(--color-success)]' :
        normalized === 'PROXIMA' ? 'bg-[var(--color-accent)]' :
        normalized === 'ATRASADA' ? 'bg-[var(--color-danger)]' :
        normalized === 'FINALIZADA' ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-muted)]'
      }`}></div>
      {label}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      <label htmlFor={id} className="text-xs font-semibold text-[var(--color-muted)] px-1 block uppercase tracking-wider">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-light)] transition-colors group-focus-within:text-[var(--color-brand)]">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3.5 ${
            icon ? 'pl-11' : 'px-4'
          } pr-4 text-[var(--color-ink)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  icon,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      <label htmlFor={id} className="text-xs font-semibold text-[var(--color-muted)] px-1 block uppercase tracking-wider">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-light)] transition-colors group-focus-within:text-[var(--color-brand)]">
            {icon}
          </div>
        )}
        <select
          id={id}
          className={`w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl py-3.5 ${
            icon ? 'pl-11' : 'px-4'
          } pr-10 text-[var(--color-ink)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] focus:border-[var(--color-brand)] transition-all font-medium cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[var(--color-surface)] text-[var(--color-ink)]">
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-muted-light)] font-medium">▼</span>
      </div>
    </div>
  );
};

// ============================================
// 🎞 AnimatedPage — Transições entre telas
// ============================================

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1],
};

interface AnimatedPageProps {
  children: React.ReactNode;
  screenKey: string;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  screenKey,
  className = '',
}) => {
  return (
    <motion.div
      key={screenKey}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={`flex-grow flex flex-col min-h-0 ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface DialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmDialog: React.FC<DialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}></div>
      
      {/* Card */}
      <div className="relative w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center gap-3 mb-4 text-[var(--color-danger)]">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-[var(--color-ink)]">{title}</h3>
        </div>
        
        <p className="text-sm text-[var(--color-ink-secondary)] mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
