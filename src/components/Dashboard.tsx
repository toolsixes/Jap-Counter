import React, { useState, useMemo } from 'react';
import { Flame, Award, Target, TrendingUp, BarChart2, PlusCircle } from 'lucide-react';
import { JaapEntry, Mantra, MalaTrack, UserSettings, DEFAULT_MANTRAS, DEFAULT_MALA_TRACKS } from '../types/jaap';

interface DashboardProps {
  entries: JaapEntry[];
  mantras?: Mantra[];
  allMalas?: MalaTrack[];
  settings: UserSettings;
  onOpenHistory?: () => void;
  onOpenManualModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  entries,
  mantras = DEFAULT_MANTRAS,
  allMalas = [],
  settings,
  onOpenManualModal,
}) => {
  const [chartRange, setChartRange] = useState<'7days' | '30days'>('7days');
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; chants: number; malas: number } | null>(null);

  // Compute lifetime metrics
  const totalLifetimeChants = entries.reduce((acc, e) => acc + (e.deleted ? 0 : e.count), 0);
  const totalLifetimeMalas = Math.round((totalLifetimeChants / 108) * 10) / 10;

  // Compute today's chants
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayTs = startOfToday.getTime();

  const todayEntries = entries.filter((e) => !e.deleted && e.timestamp >= startOfTodayTs);
  const todayChants = todayEntries.reduce((acc, e) => acc + e.count, 0);
  const todayMalas = Math.round((todayChants / 108) * 10) / 10;

  // Compute daily streak
  const daysWithChants = new Set<string>();
  entries.forEach((e) => {
    if (!e.deleted && e.count > 0) {
      const d = new Date(e.timestamp);
      daysWithChants.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
    }
  });

  let streak = 0;
  const checkDate = new Date();
  // If no chants today yet, check if there was a streak ending yesterday
  const todayKey = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
  if (!daysWithChants.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
    if (daysWithChants.has(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Daily target progress
  const targetChants = settings.dailyTargetMalas * 108;
  const targetProgress = Math.min(100, Math.round((todayChants / (targetChants || 1)) * 100));

  // Build daily timeline data for line chart
  const numDays = chartRange === '7days' ? 7 : 14;
  const chartData: { label: string; date: string; chants: number; malas: number }[] = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const start = day.getTime();
    const end = start + 86400000;

    const dayChants = entries
      .filter((e) => !e.deleted && e.timestamp >= start && e.timestamp < end)
      .reduce((sum, e) => sum + e.count, 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${monthNames[day.getMonth()]} ${day.getDate()}`;

    chartData.push({
      label,
      date: day.toLocaleDateString(),
      chants: dayChants,
      malas: Math.round((dayChants / 108) * 10) / 10,
    });
  }

  // SVG Line Chart Coordinates
  const maxChants = Math.max(...chartData.map((d) => d.chants), targetChants, 108);
  const chartWidth = 340;
  const chartHeight = 150;
  const paddingX = 25;
  const paddingY = 20;

  const points = chartData.map((d, index) => {
    const x = paddingX + (index / (chartData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.chants / maxChants) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    // Bezier control curves
    const prev = points[idx - 1];
    const cx1 = prev.x + (p.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (p.x - prev.x) / 2;
    const cy2 = p.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  // Only show the mantras/malas that have been created by the user
  const userCreatedList = useMemo(() => {
    const defaultMalaIds = new Set(DEFAULT_MALA_TRACKS.map((d) => d.id));
    const defaultMantraIds = new Set(DEFAULT_MANTRAS.map((d) => d.id));
    const defaultTitles = new Set([
      ...DEFAULT_MALA_TRACKS.map((d) => d.title.toLowerCase()),
      ...DEFAULT_MANTRAS.map((d) => d.name.toLowerCase()),
    ]);

    const map = new Map<string, { id: string; name: string; count: number; color?: string }>();

    // 1. Gather all user-created malas from allMalas
    allMalas.forEach((m) => {
      const isUserCreated = m.isCustom === true || !defaultMalaIds.has(m.id);
      if (isUserCreated && m.isActive !== false) {
        map.set(m.id, {
          id: m.id,
          name: m.title,
          count: 0,
          color: m.colorTheme,
        });
      }
    });

    // 2. Also check entries for any custom user mantras not in defaults
    entries.forEach((e) => {
      if (!e.deleted && e.count > 0) {
        const isCustomMala = e.malaId && !defaultMalaIds.has(e.malaId);
        const isCustomMantra =
          (e.mantraId && !defaultMantraIds.has(e.mantraId)) ||
          (e.mantraName && !defaultTitles.has(e.mantraName.toLowerCase()));

        if (isCustomMala || isCustomMantra) {
          let targetKey = e.malaId && map.has(e.malaId)
            ? e.malaId
            : e.mantraId && map.has(e.mantraId)
            ? e.mantraId
            : null;

          if (!targetKey && e.mantraName) {
            for (const [k, v] of map.entries()) {
              if (v.name.toLowerCase() === e.mantraName.toLowerCase()) {
                targetKey = k;
                break;
              }
            }
          }

          if (targetKey) {
            const item = map.get(targetKey)!;
            item.count += e.count;
          } else if (e.mantraName && !defaultTitles.has(e.mantraName.toLowerCase())) {
            map.set(e.mantraId || e.malaId || e.mantraName, {
              id: e.mantraId || e.malaId || e.mantraName,
              name: e.mantraName,
              count: e.count,
              color: '#F59E0B',
            });
          }
        }
      }
    });

    const items = Array.from(map.values());
    items.sort((a, b) => b.count - a.count);
    return items;
  }, [allMalas, entries]);

  const userCreatedTotalChants = useMemo(() => {
    return userCreatedList.reduce((sum, item) => sum + item.count, 0);
  }, [userCreatedList]);


  return (
    <div className="flex-1 w-full overflow-y-auto px-4 py-4 space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Daily Streak Card */}
        <div className="p-4 rounded-2xl bg-[#14161F] border border-[#232736] flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Flame className="w-6 h-6 fill-amber-500/30" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Daily Streak
            </div>
            <div className="text-xl font-bold text-gray-100 flex items-baseline gap-1">
              {streak} <span className="text-xs text-amber-400 font-normal">days</span>
            </div>
          </div>
        </div>

        {/* Lifetime Malas Card */}
        <div className="p-4 rounded-2xl bg-[#14161F] border border-[#232736] flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Total Malas
            </div>
            <div className="text-xl font-bold text-gray-100 font-sacred">
              {totalLifetimeMalas}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Target Goal Progress Card */}
      <div className="p-4 rounded-2xl bg-[#14161F] border border-[#232736]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-gray-200">Today's Sadhana Target</span>
          </div>
          <span className="text-xs font-bold text-amber-400 font-sacred">
            {todayMalas} / {settings.dailyTargetMalas} Malas
          </span>
        </div>

        <div className="w-full bg-[#1C1F2B] h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 transition-all duration-500"
            style={{ width: `${targetProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
          <span>{todayChants} chants today</span>
          <span>{targetProgress}% reached</span>
        </div>
      </div>

      {/* Progress Dashboard Line Chart */}
      <div className="p-4 rounded-2xl bg-[#14161F] border border-[#232736]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-gray-200">Chanting Consistency</h3>
          </div>
          <div className="flex p-0.5 bg-[#1B1E2B] rounded-lg border border-[#262A3B]">
            <button
              onClick={() => setChartRange('7days')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                chartRange === '7days' ? 'bg-amber-500 text-black font-semibold' : 'text-gray-400'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setChartRange('30days')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                chartRange === '30days' ? 'bg-amber-500 text-black font-semibold' : 'text-gray-400'
              }`}
            >
              14 Days
            </button>
          </div>
        </div>

        {/* Hover details badge */}
        <div className="h-5 text-center text-xs">
          {hoveredPoint ? (
            <span className="text-amber-300 font-medium">
              {hoveredPoint.date}: <strong className="text-white">{hoveredPoint.chants}</strong> chants ({hoveredPoint.malas} Malas)
            </span>
          ) : (
            <span className="text-gray-500 text-[11px]">Hover or tap points on chart to see details</span>
          )}
        </div>

        {/* SVG Line Chart */}
        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line
              x1={paddingX}
              y1={paddingY}
              x2={chartWidth - paddingX}
              y2={paddingY}
              stroke="#212534"
              strokeDasharray="3 3"
            />
            <line
              x1={paddingX}
              y1={chartHeight / 2}
              x2={chartWidth - paddingX}
              y2={chartHeight / 2}
              stroke="#212534"
              strokeDasharray="3 3"
            />
            <line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY}
              stroke="#2A2F42"
            />

            {/* Area Fill */}
            <path d={areaD} fill="url(#chartGradient)" />

            {/* Line Stroke */}
            <path
              d={pathD}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {points.map((p, idx) => (
              <g
                key={idx}
                onMouseEnter={() => setHoveredPoint(p)}
                onTouchStart={() => setHoveredPoint(p)}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#0B0C10"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  className="hover:r-6 transition-all"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Date labels */}
        <div className="flex justify-between px-2 mt-1 text-[10px] text-gray-500 font-medium">
          <span>{chartData[0]?.label}</span>
          <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>
          <span>{chartData[chartData.length - 1]?.label}</span>
        </div>
      </div>

      {/* User-Created Mantras Breakdown */}
      <div className="p-4 rounded-2xl bg-[#14161F] border border-[#232736]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-gray-200">User-Created Mantras</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            {userCreatedTotalChants} Chants
          </span>
        </div>

        {userCreatedList.length === 0 ? (
          <div className="py-6 px-3 text-center rounded-xl bg-[#10121A] border border-dashed border-[#232636] space-y-2">
            <p className="text-xs text-gray-300 font-medium">No user-created mantras yet</p>
            <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
              Any custom mantras and sadhana tracks you create will be tracked here with dedicated analytics.
            </p>
            {onOpenManualModal && (
              <button
                onClick={onOpenManualModal}
                className="mt-1 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Add Custom Mantra Chants</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {userCreatedList.map((item) => {
              const count = item.count;
              const pct = userCreatedTotalChants > 0 ? Math.round((count / userCreatedTotalChants) * 100) : 100;

              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate max-w-[190px]">
                      {item.color && (
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <span className="text-gray-300 font-medium truncate">{item.name}</span>
                    </div>
                    <span className="text-gray-400 font-mono text-[11px] shrink-0">
                      {count} chants ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#1C1F2B] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: item.color || '#F59E0B',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Entry slot */}
      {onOpenManualModal && (
        <div className="pt-1">
          <button
            onClick={onOpenManualModal}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Manual Entry</span>
          </button>
        </div>
      )}
    </div>
  );
};
