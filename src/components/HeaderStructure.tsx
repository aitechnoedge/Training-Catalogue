import React, { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';

interface HeaderStructureProps {
  onQuickSearchClick?: () => void;
  onEnterpriseInquiryClick?: () => void;
  onNavigate?: (path: string) => void;
  currentPath?: string;
}

const primaryNavigation = [
  { label: 'Home', path: '/', enabled: true },
  { label: 'E-Learning', path: '/e-learning/', enabled: true },
  { label: 'Catalogue', path: '/catalogue', enabled: true },
  { label: 'Insights', path: '/insights', enabled: true },
  { label: 'Careers', path: '/careers', enabled: true },
  { label: 'Training ROI', path: '/training-roi', enabled: true },
];

export const HeaderStructure: React.FC<HeaderStructureProps> = ({
  onQuickSearchClick,
  onEnterpriseInquiryClick,
  onNavigate,
  currentPath = '/catalogue',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const visibleNavigation = primaryNavigation.filter((item) => item.enabled);

  const navigate = (path: string) => {
    setIsMenuOpen(false);
    onNavigate?.(path);
  };

  return (
    <header id="technoedge-header-structure" className="w-full bg-white border-b border-[rgba(1,38,106,0.12)] sticky top-0 z-40 shrink-0">
      {/* Main navigation header */}
      <div className="mx-auto grid h-[76px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 min-[761px]:h-20 min-[761px]:px-[clamp(22px,4.5vw,72px)] min-[1280px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] min-[1280px]:gap-x-6">
        {/* The corporate wordmark is shared by every site topbar. */}
        <a href="/" aria-label="TechnoEdge home" className="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01266A]">
          <img
            id="header-brand-logo"
            src="/website/assets/technoedge-logo.png"
            alt="TechnoEdge Learning Services"
            className="block h-[48px] w-[145px] object-cover object-center min-[761px]:h-[60px] min-[761px]:w-[190px]"
          />
        </a>

        <nav className="hidden min-[1280px]:flex items-center justify-center justify-self-center gap-6 font-[Arial,sans-serif]" aria-label="Primary navigation">
          {visibleNavigation.map((item) => {
            const isActive = item.path === '/'
              ? currentPath === '/' || currentPath === '/website/'
              : item.path === '/catalogue'
                ? currentPath === '/catalogue' || currentPath.startsWith('/programmes/')
                : currentPath.startsWith(item.path);
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(event) => { event.preventDefault(); navigate(item.path); }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01266A]/35 rounded-sm cursor-pointer ${
                  isActive ? 'text-[#01266A]' : 'text-[rgba(0,0,0,0.72)] hover:text-[#2666C4]'
                }`}
              >
                {item.label}
                <span className={`absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[#01266A] transition-transform ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />
              </a>
            );
          })}
        </nav>

        {/* Right action group */}
        <div className="hidden min-[1280px]:flex items-center justify-self-end gap-3">
          <button
            type="button"
            id="header-quick-search"
            aria-label="Focus search bar"
            onClick={onQuickSearchClick}
            className="h-9 inline-flex items-center gap-2 rounded-lg border border-[#01266A] bg-[#01266A] px-3 text-white shadow-[0_4px_14px_rgba(1,38,106,0.22)] hover:border-[#2666C4] hover:bg-[#2666C4] active:bg-[#01266A] transition-all focus:outline-none focus:ring-2 focus:ring-[#01266A]/30 focus:ring-offset-2 cursor-pointer"
            title="Search catalogue"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold">Search programmes</span>
          </button>
          <OriginButton
            id="header-enterprise-inquiry-btn"
            onClick={onEnterpriseInquiryClick}
            fillClassName="bg-[#2666C4]"
            className="h-9 px-4 rounded-lg bg-[#01266A] border-none text-white text-xs uppercase tracking-wider font-bold shadow-xs hover:shadow-[0_4px_18px_rgba(1,38,106,0.42)] hover:ring-2 hover:ring-[#73C2FB]/70 transition-all duration-200 text-white hover:text-white cursor-pointer"
          >
            Corporate Enquiry
          </OriginButton>
        </div>

        <button
          type="button"
          className="min-[1280px]:hidden inline-flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-[rgba(1,38,106,0.18)] text-[#01266A] hover:bg-[rgba(115,194,251,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01266A]/30"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-site-navigation"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div id="mobile-site-navigation" className="min-[1280px]:hidden border-t border-[rgba(1,38,106,0.12)] bg-white px-4 sm:px-8 py-5 shadow-[0_18px_35px_rgba(15,23,42,0.10)]">
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {visibleNavigation.map((item) => {
              const isActive = item.path === '/'
                ? currentPath === '/' || currentPath === '/website/'
                : item.path === '/catalogue'
                  ? currentPath === '/catalogue' || currentPath.startsWith('/programmes/')
                  : currentPath.startsWith(item.path);
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(event) => { event.preventDefault(); navigate(item.path); }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`border-b border-[rgba(38,102,196,0.12)] px-1 py-3.5 text-left text-sm font-semibold ${isActive ? 'text-[#01266A]' : 'text-[rgba(0,0,0,0.78)]'}`}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { setIsMenuOpen(false); onQuickSearchClick?.(); }}
                className="h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-[#01266A] px-4 text-sm font-bold text-white"
              >
                <Search className="h-4 w-4" />
                Search programmes
              </button>
              <button
                type="button"
                onClick={() => { setIsMenuOpen(false); onEnterpriseInquiryClick?.(); }}
                className="h-11 rounded-lg border border-[#01266A] px-4 text-sm font-bold text-[#01266A]"
              >
                Corporate enquiry
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
