import React from 'react';
import { ArrowRight, Award, BarChart, Clock } from 'lucide-react';
import { CertificationProgramme } from '../../types';

interface Props {
  programme: CertificationProgramme;
  onViewDetail?: () => void;
}

function formatTechnology(value: string) {
  const aliases: Record<string, string> = {
    m365: 'Microsoft 365',
    'ms-copilot': 'Microsoft Copilot',
    'microsoft-365-copilot': 'Microsoft 365 Copilot',
    'microsoft-365-copilot-chat': 'Microsoft 365 Copilot Chat',
  };
  return aliases[value] || value
    .split('-')
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(' ');
}

export const CertificationCard: React.FC<Props> = ({ programme, onViewDetail }) => (
  <a
    href={`/programmes/${encodeURIComponent(programme.id)}`}
    onClick={(event) => {
      if (!onViewDetail) return;
      event.preventDefault();
      onViewDetail();
    }}
    className="group flex h-full w-full max-w-sm mx-auto flex-col overflow-hidden rounded-xl border border-[rgba(1,38,106,0.12)] bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#01266A]/30 hover:shadow-[0_10px_28px_rgba(1,38,106,0.16)] focus:outline-none focus:ring-2 focus:ring-[#01266A]/30"
    aria-label={`View details for ${programme.title}`}
  >
    <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden border-b border-[rgba(38,102,196,0.14)] bg-gradient-to-br from-[#F0F7FF] via-white to-[#73C2FB]/20">
      {programme.imageUrl ? (
        <img
          src={programme.imageUrl}
          alt={programme.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
          onError={(event) => {
            (event.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#01266A] text-white shadow-[0_12px_30px_rgba(1,38,106,0.24)] transition-transform duration-300 group-hover:scale-105">
            <Award className="h-10 w-10" aria-hidden="true" />
          </div>
          <span className="absolute bottom-4 text-xs font-bold uppercase tracking-[0.18em] text-[rgba(0,0,0,0.58)]">
            {programme.provider}
          </span>
        </>
      )}
      <div className="absolute left-4 top-4 rounded-md border border-[rgba(1,38,106,0.12)] bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#01266A] shadow-xs">
        {programme.id}
      </div>
    </div>

    <div className="flex flex-1 flex-col p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <span className="rounded border border-[rgba(1,38,106,0.14)] bg-[rgba(115,194,251,0.10)] px-2.5 py-1 text-[10px] font-semibold text-[#01266A]">
          {programme.recordKind === 'training-course'
            ? 'Certification Training Course'
            : programme.credentialType === 'Assessment'
              ? 'Certification Assessment'
              : programme.credentialType === 'Exam'
                ? 'Certification Exam'
                : 'Certification Credential'}
        </span>
        <div className="flex max-w-[52%] flex-col items-end gap-1 pt-1 text-right">
          <span className="truncate text-[10px] font-bold uppercase tracking-wider text-[rgba(0,0,0,0.58)]">
            {programme.productTechnologies.slice(0, 2).map(formatTechnology).join(' • ') || programme.provider}
          </span>
          {programme.credentialStatus && (
            <span className="rounded-full bg-[rgba(115,194,251,0.09)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#01266A]">
              {programme.credentialStatus}
            </span>
          )}
        </div>
      </div>

      {(programme.providerCourseCode || programme.examCode) && (
        <p className="mb-2 font-mono text-[11px] font-semibold text-[rgba(0,0,0,0.58)]">
          {programme.providerCourseCode
            ? `Official course code: ${programme.providerCourseCode}`
            : `Exam code: ${programme.examCode}`}
        </p>
      )}

      <h3 className="mb-5 min-h-[3.5rem] text-lg font-bold leading-snug text-[#000000] transition-colors group-hover:text-[#01266A] line-clamp-2">
        {programme.title}
      </h3>

      <div className="mt-auto flex items-center justify-between border-t border-[rgba(1,38,106,0.08)] pt-4 text-xs text-[rgba(0,0,0,0.62)]">
        <div className="flex items-center gap-3">
          {(programme.credentialLevel || programme.level) && (
            <span className="flex items-center gap-1.5"><BarChart className="h-4 w-4 text-[#01266A]/50" />{programme.credentialLevel || programme.level}</span>
          )}
          {(programme.examDuration || programme.duration) && (
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-[#01266A]/50" />{programme.examDuration || programme.duration}</span>
          )}
        </div>
        <span className="flex items-center gap-1 font-semibold uppercase tracking-wide text-[#01266A] group-hover:underline">
          Details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </div>
  </a>
);
