import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CategoryId, BaseProgramme, PeopleProcessProgramme } from './types';
import { CATEGORIES_ARCHITECTURE } from './data/architectureData';
import { HeaderStructure } from './components/HeaderStructure';
import { IntroductionStructure } from './components/IntroductionStructure';
import { CategoryNavigation } from './components/CategoryNavigation';
import { FooterStructure } from './components/FooterStructure';
import { peopleProcessProgrammes } from './data/actualProgrammes';
import { fetchCourseById } from './api/catalogueApi';
import type { ImportedArticleContent } from './components/insights/InsightArticlePage';
import type { InsightArticle } from './data/insightsData';
import { SeoHead } from './components/SeoHead';
import { CatalogueDirectoryPage } from './components/CatalogueDirectoryPage';
import { TrainingRoiPage } from './components/TrainingRoiPage';
import { catalogueDirectoryPage } from './seo/cataloguePagination';

const CatalogueGrid = lazy(() => import('./components/CatalogueGrid').then((module) => ({ default: module.CatalogueGrid })));
const CourseDetail = lazy(() => import('./components/CourseDetail').then((module) => ({ default: module.CourseDetail })));
const AdminApp = lazy(() => import('./admin/AdminApp'));
const CareersPage = lazy(() => import('./components/careers/CareersPage').then((module) => ({ default: module.CareersPage })));
const CareerRolePage = lazy(() => import('./components/careers/CareerRolePage').then((module) => ({ default: module.CareerRolePage })));
const InsightsPage = lazy(() => import('./components/insights/InsightsPage').then((module) => ({ default: module.InsightsPage })));
const InsightArticlePage = lazy(() => import('./components/insights/InsightArticlePage').then((module) => ({ default: module.InsightArticlePage })));
const SeoLandingRoute = lazy(() => import('./components/SeoLandingRoute').then((module) => ({ default: module.SeoLandingRoute })));
const RfqModal = lazy(() => import('./components/RfqModal').then((module) => ({ default: module.RfqModal })));
const FloatingActions = lazy(() => import('./components/FloatingActions').then((module) => ({ default: module.FloatingActions })));
const AnalyticsConsent = lazy(() => import('./components/AnalyticsConsent').then((module) => ({ default: module.AnalyticsConsent })));

const trustRoutes = new Set(['/about', '/contact', '/authors/technoedge-editorial-team', '/editorial-policy', '/corrections-policy', '/ai-content-policy', '/privacy', '/terms']);
const isSeoLandingPath = (pathname: string) => (
  /^\/(?:services|solutions|industries|markets|catalogue)\/.+/.test(pathname)
  || trustRoutes.has(pathname)
);

export interface AppInitialData {
  programme?: BaseProgramme | null;
  programmePath?: string;
  insightContent?: ImportedArticleContent | null;
  insightArticle?: InsightArticle | null;
  insightSlug?: string;
  programmeLinks?: Array<{ id: string; title: string }>;
  programmeLinksPath?: string;
  catalogueTotalPages?: number;
}

interface AppProps {
  initialData?: AppInitialData;
}

export default function App({ initialData }: AppProps) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname === '/') window.location.replace('/website/');
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.length <= 1 || !location.pathname.endsWith('/')) return;
    navigate(`${location.pathname.replace(/\/+$/, '')}${location.search}`, { replace: true });
  }, [location.pathname, location.search, navigate]);
  const isAdminzz = location.pathname.startsWith('/adminzz');
  const isInsightsPage = location.pathname === '/insights';
  const insightArticleSlug = location.pathname.startsWith('/insights/')
    ? decodeURIComponent(location.pathname.replace('/insights/', ''))
    : null;
  const isCareersPage = location.pathname === '/careers';
  const isTrainingRoiPage = location.pathname === '/training-roi';
  const careerRoleSlug = location.pathname.startsWith('/careers/')
    ? decodeURIComponent(location.pathname.replace('/careers/', ''))
    : null;
  const cataloguePageNumber = catalogueDirectoryPage(location.pathname);
  const isSeoLandingPage = cataloguePageNumber === null && isSeoLandingPath(location.pathname);
  const isCatalogueRoute = cataloguePageNumber !== null || location.pathname.startsWith('/programmes/');
  const [activeCategoryId, setActiveCategoryId] = useState<CategoryId>('role-based');
  const [selectedProgramme, setSelectedProgramme] = useState<BaseProgramme | null>(() => (
    initialData?.programmePath === location.pathname ? initialData.programme ?? null : null
  ));
  const [isProgrammeLoading, setIsProgrammeLoading] = useState(false);
  const [programmeLoadError, setProgrammeLoadError] = useState<string | null>(null);
  const [isEnterpriseInquiryOpen, setIsEnterpriseInquiryOpen] = useState(false);
  const [enterpriseInquiryCtaId, setEnterpriseInquiryCtaId] = useState('');
  const [showNonCriticalUi, setShowNonCriticalUi] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowNonCriticalUi(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  const openEnterpriseInquiry = (ctaId: string) => {
    setEnterpriseInquiryCtaId(ctaId);
    setIsEnterpriseInquiryOpen(true);
  };

  useEffect(() => {
    if (location.pathname !== '/catalogue') return;
    const requestedCategory = new URLSearchParams(location.search).get('category');
    const category = CATEGORIES_ARCHITECTURE.find(({ id }) => id === requestedCategory);
    if (category) setActiveCategoryId(category.id);
  }, [location.pathname, location.search]);

  useEffect(() => {
    let activeController: AbortController | null = null;
    const path = location.pathname;
    activeController?.abort();
      if (path.startsWith('/programmes/')) {
        if (path.endsWith('/')) return;
        const requestedId = decodeURIComponent(path.replace('/programmes/', ''));
        const id = requestedId.toUpperCase();
        if (requestedId !== id) {
          navigate(`/programmes/${encodeURIComponent(id)}`, { replace: true });
          return;
        }
        setProgrammeLoadError(null);

        if (initialData?.programmePath === path && initialData.programme?.id === id) {
          setSelectedProgramme(initialData.programme);
          setActiveCategoryId(initialData.programme.category === 'people-process'
            ? 'people-behavioural'
            : initialData.programme.category);
          setIsProgrammeLoading(false);
          return;
        }

        const isLegacyCertificationCode = /^[A-Z0-9]{2,12}-[A-Z0-9][A-Z0-9-]{1,30}$/.test(id) && /\d/.test(id);
        if (id.startsWith('TT') || id.startsWith('TC') || id.startsWith('RB') || id.startsWith('PI') || id.startsWith('BS') || id.startsWith('CER') || isLegacyCertificationCode) {
          const displayCategory: CategoryId = id.startsWith('TT')
            ? 'ai-tools'
            : id.startsWith('TC')
              ? 'tools-technology'
              : id.startsWith('RB')
                ? 'role-based'
              : id.startsWith('PI')
                ? 'process-based'
              : id.startsWith('BS')
                ? 'people-behavioural'
              : 'certifications';
          setActiveCategoryId(displayCategory);
          setSelectedProgramme(null);
          setIsProgrammeLoading(true);
          const controller = new AbortController();
          activeController = controller;

          fetchCourseById(id, controller.signal)
            .then((programme) => {
              if (programme.id !== id) {
                navigate(`/programmes/${programme.id}`, { replace: true });
              }
              setSelectedProgramme(programme);
            })
            .catch((error: Error) => {
              if (error.name === 'AbortError') return;
              setProgrammeLoadError(error.message);
              setSelectedProgramme({
                id: 'NOT_FOUND',
                title: 'Programme Not Found',
                category: displayCategory,
                level: 'Awareness',
              });
            })
            .finally(() => {
              if (!controller.signal.aborted) setIsProgrammeLoading(false);
            });
          return () => controller.abort();
        }

        let prog: PeopleProcessProgramme | undefined;
        if (id.startsWith('PP')) prog = peopleProcessProgrammes.find(p => p.id === id);

        setIsProgrammeLoading(false);
        if (prog) {
          if (id.startsWith('PP')) {
            const category: PeopleProcessProgramme['category'] = prog.subType === 'Process'
              ? 'process-based'
              : 'people-behavioural';
            setActiveCategoryId(category);
            const selectedPeopleProcessProgramme: PeopleProcessProgramme = {
              ...prog,
              category,
              badge: category === 'process-based' ? 'Process Based' : 'People & Behavioural',
            };
            setSelectedProgramme(selectedPeopleProcessProgramme);
          } else {
            setSelectedProgramme(prog);
          }
        } else {
          setSelectedProgramme({
            id: 'NOT_FOUND',
            title: 'Programme Not Found',
            category: id.startsWith('PP') ? 'people-behavioural' : 'role-based',
            level: 'Awareness',
          });
        }
      } else {
        setIsProgrammeLoading(false);
        setProgrammeLoadError(null);
        setSelectedProgramme(null);
      }

    return () => {
      activeController?.abort();
    };
  }, [initialData, location.pathname, navigate]);

  const handleSelectProgramme = (programme: BaseProgramme) => {
    navigate(`/programmes/${programme.id}`);
  };

  const handleBack = () => {
    navigate('/catalogue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickSearchClick = () => {
    if (location.pathname !== '/catalogue') {
      navigate('/catalogue');
    }
    setTimeout(() => {
      const searchInput = document.getElementById('catalogue-search-input');
      if (searchInput) {
        searchInput.focus();
        const catalogueSection = document.getElementById('programme-catalogue-section');
        if (catalogueSection) {
          const rect = catalogueSection.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          window.scrollTo({
            top: rect.top + scrollTop - 64,
            behavior: 'smooth',
          });
        }
      }
    }, 100);
  };

  const handleCategorySelect = (catId: CategoryId) => {
    setActiveCategoryId(catId);
    setTimeout(() => {
      const catalogueSection = document.getElementById('programme-catalogue-section');
      if (catalogueSection) {
        const rect = catalogueSection.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        window.scrollTo({
          top: rect.top + scrollTop - 64,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  const handleFooterCategorySelect = (catId: CategoryId) => {
    setActiveCategoryId(catId);
    if (location.pathname !== '/catalogue') {
      navigate('/catalogue');
    }
    setTimeout(() => {
      const catalogueSection = document.getElementById('programme-catalogue-section');
      if (catalogueSection) {
        const rect = catalogueSection.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        window.scrollTo({
          top: rect.top + scrollTop - 64,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  if (isAdminzz) {
    return <Suspense fallback={<div className="min-h-screen grid place-items-center bg-[#F0F7FF] text-[#01266A]">Loading secure workspace…</div>}><AdminApp /></Suspense>;
  }

  if (location.pathname === '/') {
    return <div role="status" className="min-h-screen grid place-items-center">Opening TechnoEdge Home…</div>;
  }

  return (
    <div id="corporate-catalogue-app" className="min-h-screen bg-white text-[#000000] flex flex-col font-sans antialiased selection:bg-[#01266A] selection:text-white">
      <SeoHead
        selectedProgramme={selectedProgramme}
        isProgrammeLoading={isProgrammeLoading}
        programmeLoadError={programmeLoadError}
      />
      <HeaderStructure 
        onQuickSearchClick={handleQuickSearchClick}
        onEnterpriseInquiryClick={() => openEnterpriseInquiry('catalogue_header_corporate_enquiry')}
        onNavigate={(path) => {
          if (path === '/e-learning/' || path === '/') {
            window.location.assign(path);
            return;
          }
          navigate(path);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentPath={location.pathname}
      />
      <main id="main-catalogue-content" className="flex-1 flex flex-col">
        <Suspense fallback={<div className="flex-1 grid place-items-center px-6 py-24" role="status">Loading page…</div>}>
        {isSeoLandingPage ? (
          <SeoLandingRoute
            pathname={location.pathname}
            programmeLinks={initialData?.programmeLinksPath === location.pathname ? initialData.programmeLinks : undefined}
          />
        ) : isInsightsPage ? (
          <InsightsPage />
        ) : insightArticleSlug ? (
          <InsightArticlePage
            slug={insightArticleSlug}
            initialContent={initialData?.insightSlug === insightArticleSlug ? initialData.insightContent : null}
            initialArticle={initialData?.insightSlug === insightArticleSlug ? initialData.insightArticle : null}
            onBack={() => navigate('/insights')}
          />
        ) : isCareersPage ? (
          <CareersPage onViewRole={(slug) => navigate(`/careers/${slug}`)} />
        ) : careerRoleSlug ? (
          <CareerRolePage slug={careerRoleSlug} onBack={() => navigate('/careers')} />
        ) : isTrainingRoiPage ? (
          <TrainingRoiPage />
        ) : isCatalogueRoute ? (
          <>
        {isProgrammeLoading && (
          <div className="flex-1 flex items-center justify-center py-24 px-6" role="status">
            <p className="text-base font-semibold text-[rgba(0,0,0,0.70)]">Loading programme…</p>
          </div>
        )}

        {selectedProgramme && selectedProgramme.id !== 'NOT_FOUND' && (
          <CourseDetail 
             programme={selectedProgramme} 
             onBack={handleBack} 
             relatedProgrammes={initialData?.programmeLinksPath === location.pathname ? initialData.programmeLinks : undefined}
           />
        )}

        {selectedProgramme && selectedProgramme.id === 'NOT_FOUND' && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
            <h1 className="text-3xl font-bold text-[#000000] mb-4">Programme not found</h1>
            <p className="text-[rgba(0,0,0,0.70)] mb-8">
              {programmeLoadError || 'The requested programme could not be found or has been removed.'}
            </p>
            <button 
              onClick={handleBack} 
              className="bg-[#01266A] hover:opacity-90 active:opacity-100 text-white px-6 py-3 rounded-lg font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#01266A]"
            >
              Back to Catalogue
            </button>
          </div>
        )}

        {!selectedProgramme && !isProgrammeLoading && cataloguePageNumber !== null && cataloguePageNumber > 1 && (
          <CatalogueDirectoryPage
            page={cataloguePageNumber}
            totalPages={initialData?.catalogueTotalPages ?? cataloguePageNumber}
            programmes={initialData?.programmeLinksPath === location.pathname ? initialData.programmeLinks ?? [] : []}
          />
        )}

        {!selectedProgramme && !isProgrammeLoading && cataloguePageNumber === 1 && (
        <div className="block">
          <IntroductionStructure />
          {initialData?.programmeLinksPath === '/catalogue' && initialData.programmeLinks?.length ? (
            <CatalogueDirectoryPage
              page={1}
              totalPages={initialData.catalogueTotalPages ?? 1}
              programmes={initialData.programmeLinks}
            />
          ) : null}
          <CategoryNavigation
            categories={CATEGORIES_ARCHITECTURE}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleCategorySelect}
          />
          <CatalogueGrid 
             activeCategoryId={activeCategoryId} 
             onViewDetail={handleSelectProgramme}
          />
        </div>
        )}
          </>
        ) : (
          <section className="flex-1 grid place-items-center px-6 py-24 text-center" aria-labelledby="not-found-heading">
            <div className="max-w-xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#01266A]">404 error</p>
              <h1 id="not-found-heading" className="mt-3 text-4xl font-bold text-[#000000]">Page not found</h1>
              <p className="mt-4 text-[rgba(0,0,0,0.70)]">The page may have moved, been retired, or the address may be incorrect.</p>
              <a className="mt-8 inline-flex rounded-lg bg-[#01266A] px-6 py-3 font-semibold text-white" href="/">Go to TechnoEdge home</a>
            </div>
          </section>
        )}
        </Suspense>
      </main>
      <FooterStructure 
        onSelectCategory={handleFooterCategorySelect}
        onOpenInquiry={() => openEnterpriseInquiry('catalogue_footer_contact_us')}
      />

      {(showNonCriticalUi || isEnterpriseInquiryOpen) && (
        <Suspense fallback={null}>
          <RfqModal
            isOpen={isEnterpriseInquiryOpen}
            onClose={() => setIsEnterpriseInquiryOpen(false)}
            ctaId={enterpriseInquiryCtaId}
          />
        </Suspense>
      )}
      {showNonCriticalUi && (
        <Suspense fallback={null}>
          <FloatingActions />
          <AnalyticsConsent />
        </Suspense>
      )}
    </div>
  );
}
