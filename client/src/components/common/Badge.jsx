import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  // Status mapping
  let selected = styles[variant] || styles.default;
  if (children === 'PAID' || children === 'ACTIVE' || children === 'COMPLETED') {
    selected = styles.success;
  } else if (children === 'PARTIALLY_PAID' || children === 'ISSUED') {
    selected = styles.warning;
  } else if (children === 'OVERDUE' || children === 'REVERSED') {
    selected = styles.danger;
  } else if (children === 'CANCELLED' || children === 'INACTIVE') {
    selected = styles.default;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${selected} ${className}`}
    >
      {children}
    </span>
  );
};
