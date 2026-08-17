import React from 'react';
import { MallStats } from '../game/types';
import { UITheme } from './TopHeader';
import { DollarSign, Calendar, Users, TrendingUp, Sparkles, Building } from 'lucide-react';

interface StatsBarProps {
  stats: MallStats;
  leasedCount: number;
  unitCount: number;
  theme: UITheme;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, leasedCount, unitCount, theme }) => {
  const isLight = theme === 'light_executive';
  const isCyber = theme === 'cyber_blueprint';

  return (
    <div
      className={`grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 border-b divide-x transition-colors ${
        isLight
          ? 'bg-slate-50 border-slate-200 divide-slate-200 text-slate-800'
          : isCyber
          ? 'bg-[#080d17] border-cyan-950 divide-cyan-950/80 text-cyan-100'
          : 'bg-slate-950/90 border-slate-800 divide-slate-800 text-slate-200'
      }`}
    >
      {/* Cash Reserves */}
      <div className="px-2 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span>Cash Reserves</span>
        </div>
        <div className="text-lg font-bold tracking-tight text-amber-400 mt-0.5">
          ${Math.round(stats.cash).toLocaleString()}
        </div>
      </div>

      {/* Operating Period */}
      <div className="hidden sm:block px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>Operating Period</span>
        </div>
        <div className="text-lg font-bold tracking-tight mt-0.5">
          Week {stats.week}{' '}
          <span className="text-xs font-normal text-slate-400">· Day {stats.day}</span>
        </div>
      </div>

      {/* Active Shoppers on Floor */}
      <div className="px-2 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Guests</span>
        </div>
        <div className="text-lg font-bold tracking-tight text-cyan-400 mt-0.5 flex items-center gap-1.5">
          {stats.activeShoppersCount}
          <span className="text-[11px] font-normal text-cyan-300/80 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
            on floor
          </span>
        </div>
      </div>

      {/* Concession Revenue */}
      <div className="hidden sm:block px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Concession Sales</span>
        </div>
        <div className="text-lg font-bold tracking-tight text-emerald-400 mt-0.5">
          ${Math.round(stats.totalSales).toLocaleString()}
        </div>
      </div>

      {/* Mall Reputation */}
      <div className="hidden sm:block px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Reputation Rating</span>
        </div>
        <div className="text-lg font-bold tracking-tight text-amber-300 mt-0.5">
          {Math.round(stats.reputation)}{' '}
          <span className="text-xs font-normal text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Leasing Occupancy */}
      <div className="px-2 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Building className="w-3.5 h-3.5 text-indigo-400" />
          <span>Leased Occupancy</span>
        </div>
        <div className="text-lg font-bold tracking-tight mt-0.5">
          {leasedCount}{' '}
          <span className="text-xs font-normal text-slate-400">/ {unitCount} Units</span>
        </div>
      </div>
    </div>
  );
};
