import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  DollarSign,
  GraduationCap,
  BarChart3,
  Building,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    {
      to: '/',
      label: t('navDashboard'),
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: '/students',
      label: t('navStudents'),
      icon: Users,
      show: true,
    },
    {
      to: '/invoices',
      label: t('navInvoices'),
      icon: FileText,
      show: true,
    },
    {
      to: '/payments',
      label: t('navPayments'),
      icon: CreditCard,
      show: hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'CASHIER', 'ACCOUNTANT'),
    },
    {
      to: '/fee-structures',
      label: t('navFeeStructures'),
      icon: DollarSign,
      show: hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
    },
    {
      to: '/academic',
      label: t('navAcademic'),
      icon: GraduationCap,
      show: hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'REGISTRAR'),
    },
    {
      to: '/reports',
      label: t('navReports'),
      icon: BarChart3,
      show: hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT', 'VIEWER'),
    },
    {
      to: '/staff',
      label: t('navStaff'),
      icon: Building,
      show: hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
    },
    {
      to: '/audit-logs',
      label: t('navAuditLogs'),
      icon: ShieldCheck,
      show: hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/30">
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-tight leading-none">
                Smart School Fee
              </h1>
              <span className="text-[10px] text-emerald-400 font-medium">Ethiopia Edition</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 text-xs text-slate-500">
          <p className="font-medium text-slate-400">Smart School Fee v1.0</p>
          <p className="text-[11px] text-slate-600 mt-0.5">ETB Multi-Branch Platform</p>
        </div>
      </aside>
    </>
  );
};
