/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

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
  const baseStyle = "w-full py-3.5 px-4 font-semibold rounded-xl text-sm transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer";
  
  const variants = {
    primary: "bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-300 shadow-[0_0_15px_rgba(125,211,252,0.1)]",
    secondary: "bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200",
    danger: "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300",
    glass: "bg-slate-900/60 backdrop-blur-md border border-sky-500/10 text-slate-300 hover:bg-slate-800/60",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className} ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-sky-300 border-t-transparent rounded-full animate-spin"></span>
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
    default: "border-sky-500/10",
    error: "border-red-500/25",
    warning: "border-yellow-500/20",
    primary: "border-sky-500/20",
    tertiary: "border-purple-500/20",
  };

  return (
    <div
      className={`bg-slate-950/60 backdrop-blur-md border ${accents[borderAccent]} rounded-2xl p-5 transition-all duration-300 ${glow ? 'shadow-[0_0_30px_rgba(125,211,252,0.03)]' : ''} ${className}`}
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
    EM_ANDAMENTO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PROXIMA: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    ATRASADA: "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse",
    FINALIZADA: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    CANCELADA: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  const labels: Record<string, string> = {
    EM_ANDAMENTO: "EM ANDAMENTO",
    PROXIMA: "PRÓXIMA",
    ATRASADA: "ATRASADA",
    FINALIZADA: "FINALIZADA",
    CANCELADA: "CANCELADA",
  };

  const style = styles[normalized] || "bg-sky-500/10 text-sky-400 border-sky-500/20";
  const label = labels[normalized] || normalized;

  return (
    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border flex items-center gap-1.5 ${style}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${
        normalized === 'EM_ANDAMENTO' ? 'bg-emerald-400' :
        normalized === 'PROXIMA' ? 'bg-purple-400' :
        normalized === 'ATRASADA' ? 'bg-red-400' :
        normalized === 'FINALIZADA' ? 'bg-sky-400' : 'bg-slate-400'
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
      <label htmlFor={id} className="text-xs font-semibold text-slate-400 px-1 block uppercase tracking-wider">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-sky-300">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full bg-[#1a2438]/30 border border-sky-500/10 rounded-xl py-3.5 ${
            icon ? 'pl-11' : 'px-4'
          } pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium ${className}`}
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
      <label htmlFor={id} className="text-xs font-semibold text-slate-400 px-1 block uppercase tracking-wider">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-sky-400">
            {icon}
          </div>
        )}
        <select
          id={id}
          className={`w-full bg-[#1a2438]/30 border border-sky-500/10 rounded-xl py-3.5 ${
            icon ? 'pl-11' : 'px-4'
          } pr-10 text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all font-medium cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-sky-400/60 font-medium">▼</span>
      </div>
    </div>
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
      
      {/* Card */}
      <div className="relative w-full max-w-sm bg-slate-950 border border-red-500/20 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4 text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        </div>
        
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
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
