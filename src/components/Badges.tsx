import React, { useMemo } from 'react';
import { Award, CheckCircle2, Compass, Layers, ShieldCheck, Zap } from 'lucide-react';
import type {
  BriefSubmission,
  CompetencyPassport,
  MilestoneBadge,
  SkillCapability,
} from '../types/kora';
import { computeMilestoneBadges } from '../utils/talentEngine';

interface BadgesProps {
  capabilities: SkillCapability[];
  contributions: BriefSubmission[];
  passport: CompetencyPassport | null;
}

function renderBadgeIcon(iconKey: MilestoneBadge['iconKey'], unlocked: boolean) {
  const cls = unlocked
    ? 'w-5 h-5 text-[#146C53] dark:text-[#2EB88B]'
    : 'w-5 h-5 text-[#8A847A] dark:text-[#6E6960]';

  switch (iconKey) {
    case 'shield':
      return <ShieldCheck className={cls} />;
    case 'check':
      return <CheckCircle2 className={cls} />;
    case 'compass':
      return <Compass className={cls} />;
    case 'zap':
      return <Zap className={cls} />;
    case 'layers':
      return <Layers className={cls} />;
    case 'award':
      return <Award className={cls} />;
  }
}

export const Badges: React.FC<BadgesProps> = ({
  capabilities,
  contributions,
  passport,
}) => {
  const badges = useMemo(
    () => computeMilestoneBadges(capabilities, contributions, passport),
    [capabilities, contributions, passport]
  );

  const earnedCount = badges.filter((b) => b.unlocked).length;

  return (
    <section
      aria-labelledby="badges-heading"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 space-y-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#E8E3DB] dark:border-[#2C3037] pb-4">
        <div>
          <h2
            id="badges-heading"
            className="font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Verified Milestones &amp; Badges
          </h2>
          <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Earned directly from confirmed field capabilities, Living Competency Passports, and closed paid briefs.
          </p>
        </div>
        <p className="text-xs font-mono-tabular tabular-nums font-medium text-[#146C53] dark:text-[#2EB88B]">
          {earnedCount} / {badges.length} unlocked
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => {
          const pct = Math.min(
            100,
            Math.round((badge.currentValue / Math.max(1, badge.targetValue)) * 100)
          );

          return (
            <article
              key={badge.id}
              data-badge-unlocked={badge.unlocked ? 'true' : 'false'}
              className={`rounded-xl p-4 border transition-colors flex flex-col justify-between gap-4 ${
                badge.unlocked
                  ? 'bg-[#E7F3EE]/75 dark:bg-[#142B24]/85 border-[#146C53]/35 dark:border-[#2EB88B]/40'
                  : 'bg-[#FAF8F5]/75 dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    badge.unlocked
                      ? 'bg-white dark:bg-[#10201B] border-[#146C53]/25 dark:border-[#2EB88B]/30'
                      : 'bg-white/80 dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037]'
                  }`}
                >
                  {renderBadgeIcon(badge.iconKey, badge.unlocked)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <span
                      className={
                        badge.unlocked
                          ? 'text-[#146C53] dark:text-[#2EB88B]'
                          : 'text-[#575B62] dark:text-[#A3A7AE]'
                      }
                    >
                      {badge.tier}
                    </span>
                    <span aria-hidden="true" className="text-[#8A847A]">
                      ·
                    </span>
                    <span
                      className={
                        badge.unlocked
                          ? 'text-[#146C53] dark:text-[#2EB88B]'
                          : 'text-[#575B62] dark:text-[#A3A7AE]'
                      }
                    >
                      {badge.unlocked ? 'Earned' : 'In Progress'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-0.5">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] mt-1 leading-snug">
                    {badge.subtitle}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                  <span>
                    {badge.currentValue}/{badge.targetValue} {badge.unit}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div
                  className="h-1.5 w-full rounded-full bg-white/85 dark:bg-[#22252A] overflow-hidden"
                  role="progressbar"
                  aria-label={`${badge.title} milestone progress`}
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${
                      badge.unlocked
                        ? 'bg-[#146C53] dark:bg-[#2EB88B]'
                        : 'bg-[#8A847A]/45 dark:bg-[#575B62]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
