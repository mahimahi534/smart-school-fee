import React from 'react';
import { Menu, LogOut, Bell, Building2, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageToggle } from '../common/LanguageToggle.jsx';

export const Navbar = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const { t, lang } = useLanguage();

  const schoolName = lang === 'am' && user?.school?.nameAmharic ? user.school.nameAmharic : (user?.school?.name || 'Smart School Fee');
  const branchName = lang === 'am' && user?.branch?.nameAmharic ? user.branch.nameAmharic : (user?.branch?.name || (user?.role === 'SUPER_ADMIN' ? 'Headquarters' : ''));

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hidden sm:flex">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
              {schoolName}
            </h2>
            {branchName && (
              <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                {branchName}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Language Switcher */}
        <LanguageToggle />

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {lang === 'am' && user?.fullNameAmharic ? user.fullNameAmharic : user?.fullName}
            </p>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
            {user?.fullName?.charAt(0) || 'U'}
          </div>

          <button
            onClick={logout}
            title={t('navLogout')}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
