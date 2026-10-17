import React, { useState, useCallback } from 'react';
import { CategoryArchitecture, CategoryId } from '../types';
import {
  Award,
  Bot,
  Briefcase,
  CheckCircle2,
  CircuitBoard,
  HeartHandshake,
  Workflow,
} from 'lucide-react';

interface Props {
  categories: CategoryArchitecture[];
  activeCategoryId: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
}

function getCoverDiameter(width: number, height: number, x: number, y: number) {
  return Math.ceil(
    2 *
      Math.max(
        Math.hypot(x, y),
        Math.hypot(width - x, y),
        Math.hypot(x, height - y),
        Math.hypot(width - x, height - y)
      )
  );
}

export const CategoryNavigation: React.FC<Props> = ({ categories, activeCategoryId, onSelectCategory }) => {
  const [activeTabOrigin, setActiveTabOrigin] = useState<Record<string, { x: number; y: number; coverSize: number; isHovered: boolean }>>({});

  const handlePointerEnter = useCallback((catId: string, event: React.PointerEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const coverSize = getCoverDiameter(rect.width, rect.height, x, y);
    setActiveTabOrigin((prev) => ({
      ...prev,
      [catId]: { x, y, coverSize, isHovered: true },
    }));
  }, []);

  const handlePointerLeave = useCallback((catId: string) => {
    setActiveTabOrigin((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], isHovered: false },
    }));
  }, []);

  const getCategoryIcon = (id: CategoryId) => {
    switch (id) {
      case 'role-based': return <Briefcase className="w-6 h-6" />;
      case 'tools-technology': return <CircuitBoard className="w-6 h-6" />;
      case 'process-based': return <Workflow className="w-6 h-6" />;
      case 'certifications': return <Award className="w-6 h-6" />;
      case 'ai-tools': return <Bot className="w-6 h-6" />;
      case 'people-behavioural': return <HeartHandshake className="w-6 h-6" />;
    }
  };

  return (
    <section id="category-selection-section" className="w-full bg-white py-6 sm:py-8 shrink-0 border-b border-[rgba(1,38,106,0.14)] font-['Poppins',sans-serif]" aria-label="Training Categories">
      <div className="te-page-container">
        
        {/* Section Heading */}
        <div className="category-navigation__heading mb-8 sm:mb-9">
          <h2 className="font-bold text-[#01266A]">Explore Our Catalogue</h2>
          <p className="text-[rgba(0,0,0,0.78)] text-base sm:text-lg">Select a learning track to browse programmes.</p>
        </div>

        {/* Tablist for categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6" role="tablist">
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            const originData = activeTabOrigin[cat.id];
            const isHovered = Boolean(originData?.isHovered);
            return (
              <a
                key={cat.id}
                href={`/catalogue/${cat.id}`}
                role="tab"
                aria-selected={isActive}
                onClick={(event) => { event.preventDefault(); onSelectCategory(cat.id); }}
                onPointerEnter={(e) => handlePointerEnter(cat.id, e)}
                onPointerDown={(e) => handlePointerEnter(cat.id, e)}
                onPointerLeave={() => handlePointerLeave(cat.id)}
                className={`text-left min-h-[17rem] p-5 sm:p-6 rounded-xl transition-all duration-200 relative outline-none focus-visible:ring-2 focus-visible:ring-[#01266A] focus-visible:ring-offset-2 flex flex-col overflow-hidden cursor-pointer ${
                  isActive
                    ? 'bg-[#F0F7FF] border-2 border-[#01266A] shadow-[0_3px_7px_rgba(1,38,106,0.20)]'
                    : 'bg-white border border-[rgba(1,38,106,0.16)] hover:border-[#2666C4]/50 hover:shadow-[0_8px_24px_rgba(1,38,106,0.12)] hover:-translate-y-0.5'
                }`}
              >
                {/* Dynamic Origin Fill Ripple */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    'bg-[#DCEEFF]'
                  }`}
                  style={{
                    height: originData?.coverSize || 0,
                    left: originData?.x || 0,
                    top: originData?.y || 0,
                    width: originData?.coverSize || 0,
                    transform: `translate(-50%, -50%) scale(${isHovered && originData ? 1 : 0})`,
                    transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />

                <div className="relative z-10 flex flex-col flex-1 w-full">
                  <div className="flex items-start gap-4 mb-5 w-full">
                    <div className={`shrink-0 p-3 rounded-lg transition-all duration-200 ${
                      isActive && isHovered
                        ? 'bg-[#2666C4] text-white shadow-sm scale-105'
                        : isActive
                          ? 'bg-[#01266A] text-white shadow-sm'
                          : isHovered
                            ? 'bg-[#2666C4] text-white shadow-md scale-105'
                            : 'bg-[rgba(115,194,251,0.08)] text-[#01266A]'
                    }`}>
                      {getCategoryIcon(cat.id)}
                    </div>
                    <h3 className={`pt-1 text-xl font-bold leading-tight transition-colors duration-200 ${
                      isActive ? 'text-[#01266A]' : isHovered ? 'text-[#01266A]/70' : 'text-[#111111]'
                    }`}>
                      {cat.name}
                    </h3>
                    <div className="ml-auto text-right">
                      <span className={`block text-[2.125rem] font-bold leading-none tracking-tight transition-colors duration-200 ${
                        isActive ? 'text-[#01266A]' : isHovered ? 'text-[#01266A]/70' : 'text-[rgba(0,0,0,0.65)]'
                      }`}>
                        {cat.count > 0 ? cat.count.toLocaleString() : 'New'}
                      </span>
                      <span className={`mt-1 block text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[#01266A]' : 'text-[rgba(0,0,0,0.58)]'}`}>
                        {cat.count > 0 ? 'Programmes' : 'Catalogue'}
                      </span>
                    </div>
                  </div>
                  
                  <p className={`text-sm leading-[1.6] ${isActive ? 'text-[rgba(0,0,0,0.72)]' : 'text-[rgba(0,0,0,0.62)]'}`}>
                    {cat.description}
                  </p>

                  {isActive ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#01266A] uppercase tracking-wider mt-auto pt-3 border-t border-[rgba(1,38,106,0.14)] w-full">
                      <CheckCircle2 className="w-4 h-4 text-[#01266A]" /> Selected
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mt-auto pt-3 border-t border-[rgba(1,38,106,0.14)] w-full transition-colors duration-200 ${
                      isHovered ? 'text-[#01266A]/70' : 'text-[rgba(0,0,0,0.58)]'
                    }`}>
                      <span>Click to explore</span>
                      <span className={`transition-transform duration-200 ${isHovered ? 'translate-x-1' : ''}`}>→</span>
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
