import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
  CategoryId,
  BaseProgramme,
  CertificationProgramme,
  PeopleProcessProgramme,
  RoleBasedProgramme,
  ToolsTechProgramme,
} from '../types';
import {
  FilterGroupConfig,
  SortOption,
  RoleBasedFilterState,
  ToolsTechnologyFilterState,
  PeopleProcessFilterState,
  CertificationFilterState,
} from '../types/filters';
import {
  getRoleBasedActiveChips,
  getToolsTechnologyActiveChips,
  getPeopleProcessActiveChips,
  getCertificationActiveChips,
} from '../utils/catalogueFiltering';
import {
  CATALOGUE_PAGE_SIZE,
  fetchRoleFilterGroups,
  fetchRoleProgrammes,
  fetchToolsFilterGroups,
  fetchToolsProgrammes,
  fetchTechnicalFilterGroups,
  fetchTechnicalProgrammes,
  fetchCertificationFilterGroups,
  fetchCertificationProgrammes,
  fetchPeopleProcessFilterGroups,
  fetchPeopleProcessProgrammes,
} from '../api/catalogueApi';
import { CatalogueToolbar } from './discovery/CatalogueToolbar';
import { DynamicFilterPanel } from './discovery/DynamicFilterPanel';
import { CatalogueResults } from './discovery/CatalogueResults';

interface Props {
  activeCategoryId: CategoryId;
  onViewDetail: (programme: BaseProgramme) => void;
}

const INITIAL_RB_FILTERS: RoleBasedFilterState = {
  industries: [],
  departments: [],
  durations: [],
};

const INITIAL_TT_FILTERS: ToolsTechnologyFilterState = {
  technologies: [],
  toolCategories: [],
  durations: [],
};

const INITIAL_PP_FILTERS: PeopleProcessFilterState = {
  categories: [],
  portfolios: [],
  durations: [],
};

const INITIAL_CERTIFICATION_FILTERS: CertificationFilterState = {
  providers: [],
  productTechnologies: [],
  durations: [],
};

export const CatalogueGrid: React.FC<Props> = ({ activeCategoryId, onViewDetail }) => {
  const isPeopleCategory = activeCategoryId === 'process-based' || activeCategoryId === 'people-behavioural';
  const isPlannedCategory = false;
  // Discovery State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sortBy, setSortBy] = useState<SortOption>('Recommended');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Category-Specific Filter States
  const [roleBasedFilters, setRoleBasedFilters] = useState<RoleBasedFilterState>(INITIAL_RB_FILTERS);
  const [toolsTechFilters, setToolsTechFilters] = useState<ToolsTechnologyFilterState>(INITIAL_TT_FILTERS);
  const [technicalFilters, setTechnicalFilters] = useState<ToolsTechnologyFilterState>(INITIAL_TT_FILTERS);
  const [peopleProcessFilters, setPeopleProcessFilters] = useState<PeopleProcessFilterState>(INITIAL_PP_FILTERS);
  const [certificationFilters, setCertificationFilters] = useState<CertificationFilterState>(INITIAL_CERTIFICATION_FILTERS);

  // AI Tools is database-backed so it can scale beyond a browser bundle.
  const [toolsProgrammes, setToolsProgrammes] = useState<ToolsTechProgramme[]>([]);
  const [toolsTotal, setToolsTotal] = useState(0);
  const [toolsPage, setToolsPage] = useState(1);
  const [toolsFilterGroups, setToolsFilterGroups] = useState<FilterGroupConfig[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [toolsReloadToken, setToolsReloadToken] = useState(0);

  const [technicalProgrammes, setTechnicalProgrammes] = useState<ToolsTechProgramme[]>([]);
  const [technicalTotal, setTechnicalTotal] = useState(0);
  const [technicalPage, setTechnicalPage] = useState(1);
  const [technicalFilterGroups, setTechnicalFilterGroups] = useState<FilterGroupConfig[]>([]);
  const [technicalLoading, setTechnicalLoading] = useState(false);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [technicalReloadToken, setTechnicalReloadToken] = useState(0);

  // Role-Based is also database-backed so departments and future course volumes stay server-side.
  const [roleProgrammes, setRoleProgrammes] = useState<RoleBasedProgramme[]>([]);
  const [roleTotal, setRoleTotal] = useState(0);
  const [rolePage, setRolePage] = useState(1);
  const [roleFilterGroups, setRoleFilterGroups] = useState<FilterGroupConfig[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleReloadToken, setRoleReloadToken] = useState(0);

  const [certificationProgrammes, setCertificationProgrammes] = useState<CertificationProgramme[]>([]);
  const [certificationTotal, setCertificationTotal] = useState(0);
  const [certificationPage, setCertificationPage] = useState(1);
  const [certificationFilterGroups, setCertificationFilterGroups] = useState<FilterGroupConfig[]>([]);
  const [certificationLoading, setCertificationLoading] = useState(false);
  const [certificationError, setCertificationError] = useState<string | null>(null);
  const [certificationReloadToken, setCertificationReloadToken] = useState(0);

  // Process and People & Behavioural catalogue records are database-backed so
  // each track can scale without embedding course TOCs in the browser bundle.
  const [peopleProcessProgrammes, setPeopleProcessProgrammes] = useState<PeopleProcessProgramme[]>([]);
  const [peopleProcessTotal, setPeopleProcessTotal] = useState(0);
  const [peopleProcessPage, setPeopleProcessPage] = useState(1);
  const [peopleProcessFilterGroups, setPeopleProcessFilterGroups] = useState<FilterGroupConfig[]>([]);
  const [peopleProcessLoading, setPeopleProcessLoading] = useState(false);
  const [peopleProcessError, setPeopleProcessError] = useState<string | null>(null);
  const [peopleProcessReloadToken, setPeopleProcessReloadToken] = useState(0);

  // Requirement 20 & 21: Reset filters, search query, and sort on category change
  useEffect(() => {
    setSearchQuery('');
    setSortBy('Recommended');
    setRoleBasedFilters(INITIAL_RB_FILTERS);
    setToolsTechFilters(INITIAL_TT_FILTERS);
    setTechnicalFilters(INITIAL_TT_FILTERS);
    setPeopleProcessFilters(INITIAL_PP_FILTERS);
    setCertificationFilters(INITIAL_CERTIFICATION_FILTERS);
    setPeopleProcessFilterGroups([]);
    setToolsPage(1);
    setTechnicalPage(1);
    setRolePage(1);
    setCertificationPage(1);
    setPeopleProcessPage(1);
    setIsMobileFiltersOpen(false);
  }, [activeCategoryId]);

  useEffect(() => {
    if (activeCategoryId !== 'ai-tools' || toolsFilterGroups.length > 0) return;
    const controller = new AbortController();

    fetchToolsFilterGroups(controller.signal)
      .then(setToolsFilterGroups)
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setToolsError(error.message);
      });

    return () => controller.abort();
  }, [activeCategoryId, toolsFilterGroups.length, toolsReloadToken]);

  useEffect(() => {
    if (activeCategoryId !== 'tools-technology' || technicalFilterGroups.length > 0) return;
    const controller = new AbortController();

    fetchTechnicalFilterGroups(controller.signal)
      .then(setTechnicalFilterGroups)
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setTechnicalError(error.message);
      });

    return () => controller.abort();
  }, [activeCategoryId, technicalFilterGroups.length, technicalReloadToken]);

  useEffect(() => {
    if (activeCategoryId !== 'role-based' || roleFilterGroups.length > 0) return;
    const controller = new AbortController();

    fetchRoleFilterGroups(controller.signal)
      .then(setRoleFilterGroups)
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setRoleError(error.message);
      });

    return () => controller.abort();
  }, [activeCategoryId, roleFilterGroups.length, roleReloadToken]);

  useEffect(() => {
    if (activeCategoryId !== 'certifications' || certificationFilterGroups.length > 0) return;
    const controller = new AbortController();

    fetchCertificationFilterGroups(controller.signal)
      .then(setCertificationFilterGroups)
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setCertificationError(error.message);
      });

    return () => controller.abort();
  }, [activeCategoryId, certificationFilterGroups.length, certificationReloadToken]);

  useEffect(() => {
    if (!isPeopleCategory || peopleProcessFilterGroups.length > 0) return;
    const controller = new AbortController();
    const subType = activeCategoryId === 'process-based' ? 'Process' : 'People';
    const category = activeCategoryId === 'process-based' ? 'people-process' : 'people-behavioural';

    fetchPeopleProcessFilterGroups(category, subType, controller.signal)
      .then(setPeopleProcessFilterGroups)
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setPeopleProcessError(error.message);
      });

    return () => controller.abort();
  }, [activeCategoryId, isPeopleCategory, peopleProcessFilterGroups.length, peopleProcessReloadToken]);

  useEffect(() => {
    if (activeCategoryId !== 'ai-tools') return;
    const controller = new AbortController();
    setToolsLoading(true);
    setToolsError(null);

    fetchToolsProgrammes({
      query: debouncedSearchQuery,
      filters: toolsTechFilters,
      sort: sortBy,
      page: toolsPage,
      signal: controller.signal,
    })
      .then((response) => {
        setToolsProgrammes(response.data);
        setToolsTotal(response.pagination.total);
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') {
          setToolsProgrammes([]);
          setToolsTotal(0);
          setToolsError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setToolsLoading(false);
      });

    return () => controller.abort();
  }, [activeCategoryId, debouncedSearchQuery, sortBy, toolsTechFilters, toolsPage, toolsReloadToken]);

  useEffect(() => {
    if (activeCategoryId !== 'tools-technology') return;
    const controller = new AbortController();
    setTechnicalLoading(true);
    setTechnicalError(null);

    fetchTechnicalProgrammes({
      query: debouncedSearchQuery,
      filters: technicalFilters,
      sort: sortBy,
      page: technicalPage,
      signal: controller.signal,
    })
      .then((response) => {
        setTechnicalProgrammes(response.data);
        setTechnicalTotal(response.pagination.total);
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') {
          setTechnicalProgrammes([]);
          setTechnicalTotal(0);
          setTechnicalError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setTechnicalLoading(false);
      });

    return () => controller.abort();
  }, [activeCategoryId, debouncedSearchQuery, sortBy, technicalFilters, technicalPage, technicalReloadToken]);

  useEffect(() => {
    if (activeCategoryId !== 'role-based') return;
    const controller = new AbortController();
    setRoleLoading(true);
    setRoleError(null);

    fetchRoleProgrammes({
      query: debouncedSearchQuery,
      filters: roleBasedFilters,
      sort: sortBy,
      page: rolePage,
      signal: controller.signal,
    })
      .then((response) => {
        setRoleProgrammes(response.data);
        setRoleTotal(response.pagination.total);
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') {
          setRoleProgrammes([]);
          setRoleTotal(0);
          setRoleError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setRoleLoading(false);
      });

    return () => controller.abort();
  }, [activeCategoryId, debouncedSearchQuery, sortBy, roleBasedFilters, rolePage, roleReloadToken]);

  useEffect(() => {
    if (activeCategoryId !== 'certifications') return;
    const controller = new AbortController();
    setCertificationLoading(true);
    setCertificationError(null);

    fetchCertificationProgrammes({
      query: debouncedSearchQuery,
      filters: certificationFilters,
      sort: sortBy,
      page: certificationPage,
      signal: controller.signal,
    })
      .then((response) => {
        setCertificationProgrammes(response.data);
        setCertificationTotal(response.pagination.total);
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') {
          setCertificationProgrammes([]);
          setCertificationTotal(0);
          setCertificationError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCertificationLoading(false);
      });

    return () => controller.abort();
  }, [activeCategoryId, certificationFilters, certificationPage, certificationReloadToken, debouncedSearchQuery, sortBy]);

  useEffect(() => {
    if (!isPeopleCategory) return;
    const controller = new AbortController();
    const subType = activeCategoryId === 'process-based' ? 'Process' : 'People';
    const category = activeCategoryId === 'process-based' ? 'people-process' : 'people-behavioural';
    setPeopleProcessLoading(true);
    setPeopleProcessError(null);

    fetchPeopleProcessProgrammes({
      category,
      subType,
      query: debouncedSearchQuery,
      filters: peopleProcessFilters,
      sort: sortBy,
      page: peopleProcessPage,
      signal: controller.signal,
    })
      .then((response) => {
        setPeopleProcessProgrammes(response.data.map((programme) => ({
          ...programme,
          category: activeCategoryId,
          badge: activeCategoryId === 'process-based' ? 'Process Based' : 'People & Behavioural',
        })));
        setPeopleProcessTotal(response.pagination.total);
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') {
          setPeopleProcessProgrammes([]);
          setPeopleProcessTotal(0);
          setPeopleProcessError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setPeopleProcessLoading(false);
      });

    return () => controller.abort();
  }, [activeCategoryId, debouncedSearchQuery, isPeopleCategory, peopleProcessFilters, peopleProcessPage, peopleProcessReloadToken, sortBy]);

  // Handle filter toggles dynamically by group ID
  const handleToggleFilter = (groupId: string, value: string) => {
    if (activeCategoryId === 'role-based') {
      setRolePage(1);
      setRoleBasedFilters((prev) => {
        if (groupId === 'industry') {
          const exists = prev.industries.includes(value);
          return {
            ...prev,
            industries: exists ? prev.industries.filter((v) => v !== value) : [...prev.industries, value],
          };
        }
        if (groupId === 'department') {
          const exists = prev.departments.includes(value);
          return {
            ...prev,
            departments: exists ? prev.departments.filter((v) => v !== value) : [...prev.departments, value],
          };
        }
        if (groupId === 'duration') {
          const exists = prev.durations.includes(value);
          return {
            ...prev,
            durations: exists ? prev.durations.filter((v) => v !== value) : [...prev.durations, value],
          };
        }
        return prev;
      });
    } else if (activeCategoryId === 'ai-tools' || activeCategoryId === 'tools-technology') {
      const isTechnical = activeCategoryId === 'tools-technology';
      if (isTechnical) setTechnicalPage(1);
      else setToolsPage(1);
      const setFilters = isTechnical ? setTechnicalFilters : setToolsTechFilters;
      setFilters((prev) => {
        if (groupId === 'technology') {
          const exists = prev.technologies.includes(value);
          return {
            ...prev,
            technologies: exists ? prev.technologies.filter((v) => v !== value) : [...prev.technologies, value],
          };
        }
        if (groupId === 'toolCategory') {
          const exists = prev.toolCategories.includes(value);
          return {
            ...prev,
            toolCategories: exists ? prev.toolCategories.filter((v) => v !== value) : [...prev.toolCategories, value],
          };
        }
        if (groupId === 'duration') {
          const exists = prev.durations.includes(value);
          return {
            ...prev,
            durations: exists ? prev.durations.filter((v) => v !== value) : [...prev.durations, value],
          };
        }
        return prev;
      });
    } else if (isPeopleCategory) {
      setPeopleProcessPage(1);
      setPeopleProcessFilters((prev) => {
        if (groupId === 'category') {
          const exists = prev.categories.includes(value);
          return {
            ...prev,
            categories: exists ? prev.categories.filter((v) => v !== value) : [...prev.categories, value],
          };
        }
        if (groupId === 'portfolio') {
          const exists = prev.portfolios.includes(value);
          return {
            ...prev,
            portfolios: exists ? prev.portfolios.filter((v) => v !== value) : [...prev.portfolios, value],
          };
        }
        if (groupId === 'duration') {
          const exists = prev.durations.includes(value);
          return {
            ...prev,
            durations: exists ? prev.durations.filter((v) => v !== value) : [...prev.durations, value],
          };
        }
        return prev;
      });
    } else if (activeCategoryId === 'certifications') {
      setCertificationPage(1);
      setCertificationFilters((prev) => {
        const toggle = (values: string[]) => values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value];
        if (groupId === 'provider') return { ...prev, providers: toggle(prev.providers) };
        if (groupId === 'productTechnology') return { ...prev, productTechnologies: toggle(prev.productTechnologies) };
        if (groupId === 'duration') return { ...prev, durations: toggle(prev.durations) };
        return prev;
      });
    }
  };

  // Clear filters for the current category
  const handleClearCategoryFilters = () => {
    if (activeCategoryId === 'role-based') {
      setRolePage(1);
      setRoleBasedFilters(INITIAL_RB_FILTERS);
    } else if (activeCategoryId === 'ai-tools') {
      setToolsPage(1);
      setToolsTechFilters(INITIAL_TT_FILTERS);
    } else if (activeCategoryId === 'tools-technology') {
      setTechnicalPage(1);
      setTechnicalFilters(INITIAL_TT_FILTERS);
    } else if (isPeopleCategory) {
      setPeopleProcessPage(1);
      setPeopleProcessFilters(INITIAL_PP_FILTERS);
    } else if (activeCategoryId === 'certifications') {
      setCertificationPage(1);
      setCertificationFilters(INITIAL_CERTIFICATION_FILTERS);
    }
  };

  // Remove individual chip
  const handleRemoveChip = (groupId: string, value: string) => {
    handleToggleFilter(groupId, value);
  };

  // Selected filters map for accordion checkboxes
  const selectedFiltersMap: { [groupId: string]: string[] } = useMemo(() => {
    if (activeCategoryId === 'role-based') {
      return {
        industry: roleBasedFilters.industries,
        department: roleBasedFilters.departments,
        duration: roleBasedFilters.durations,
      };
    }
    if (activeCategoryId === 'ai-tools') {
      return {
        technology: toolsTechFilters.technologies,
        toolCategory: toolsTechFilters.toolCategories,
        duration: toolsTechFilters.durations,
      };
    }
    if (activeCategoryId === 'tools-technology') {
      return {
        technology: technicalFilters.technologies,
        toolCategory: technicalFilters.toolCategories,
        duration: technicalFilters.durations,
      };
    }
    if (isPeopleCategory) {
      return {
        category: peopleProcessFilters.categories,
        portfolio: peopleProcessFilters.portfolios,
        duration: peopleProcessFilters.durations,
      };
    }
    if (activeCategoryId === 'certifications') {
      return {
        provider: certificationFilters.providers,
        productTechnology: certificationFilters.productTechnologies,
        duration: certificationFilters.durations,
      };
    }
    return {};
  }, [activeCategoryId, certificationFilters, roleBasedFilters, technicalFilters, toolsTechFilters, peopleProcessFilters]);

  // Active filter chips
  const activeChips = useMemo(() => {
    if (activeCategoryId === 'role-based') {
      return getRoleBasedActiveChips(roleBasedFilters);
    }
    if (activeCategoryId === 'ai-tools') {
      return getToolsTechnologyActiveChips(toolsTechFilters);
    }
    if (activeCategoryId === 'tools-technology') {
      return getToolsTechnologyActiveChips(technicalFilters);
    }
    if (isPeopleCategory) {
      return getPeopleProcessActiveChips(peopleProcessFilters);
    }
    if (activeCategoryId === 'certifications') {
      return getCertificationActiveChips(certificationFilters);
    }
    return [];
  }, [activeCategoryId, certificationFilters, roleBasedFilters, technicalFilters, toolsTechFilters, peopleProcessFilters]);

  // Filtered programme results based on active category, search, filters and sort
  const filteredProgrammes = useMemo(() => {
    if (activeCategoryId === 'role-based') {
      return roleProgrammes;
    }
    if (activeCategoryId === 'ai-tools') {
      return toolsProgrammes;
    }
    if (activeCategoryId === 'tools-technology') {
      return technicalProgrammes;
    }
    if (isPeopleCategory) return peopleProcessProgrammes;
    if (activeCategoryId === 'certifications') return certificationProgrammes;
    return [];
  }, [activeCategoryId, certificationProgrammes, isPeopleCategory, peopleProcessProgrammes, roleProgrammes, technicalProgrammes, toolsProgrammes]);

  // Category Total Metadata
  const totalCategoryCount = useMemo(() => {
    if (activeCategoryId === 'role-based') return roleTotal;
    if (activeCategoryId === 'ai-tools') return toolsTotal;
    if (activeCategoryId === 'tools-technology') return technicalTotal;
    if (isPeopleCategory) return peopleProcessTotal;
    if (activeCategoryId === 'certifications') return certificationTotal;
    return 0;
  }, [activeCategoryId, certificationTotal, isPeopleCategory, peopleProcessTotal, roleTotal, technicalTotal, toolsTotal]);

  const handleSearchChange = (value: string) => {
    if (activeCategoryId === 'ai-tools') setToolsPage(1);
    if (activeCategoryId === 'tools-technology') setTechnicalPage(1);
    if (activeCategoryId === 'role-based') setRolePage(1);
    if (activeCategoryId === 'certifications') setCertificationPage(1);
    if (isPeopleCategory) setPeopleProcessPage(1);
    setSearchQuery(value);
  };

  const handleSortChange = (value: SortOption) => {
    if (activeCategoryId === 'ai-tools') setToolsPage(1);
    if (activeCategoryId === 'tools-technology') setTechnicalPage(1);
    if (activeCategoryId === 'role-based') setRolePage(1);
    if (activeCategoryId === 'certifications') setCertificationPage(1);
    if (isPeopleCategory) setPeopleProcessPage(1);
    setSortBy(value);
  };

  const handleClearSearch = () => {
    if (activeCategoryId === 'ai-tools') setToolsPage(1);
    if (activeCategoryId === 'tools-technology') setTechnicalPage(1);
    if (activeCategoryId === 'role-based') setRolePage(1);
    if (activeCategoryId === 'certifications') setCertificationPage(1);
    setSearchQuery('');
  };

  const totalCatalogueCapacity = useMemo(() => {
    if (activeCategoryId === 'role-based') return 3000;
    if (activeCategoryId === 'ai-tools') return 188;
    if (activeCategoryId === 'tools-technology') return technicalTotal;
    if (isPeopleCategory) return peopleProcessTotal;
    if (activeCategoryId === 'certifications') return certificationTotal;
    return 0;
  }, [activeCategoryId, certificationTotal, isPeopleCategory, peopleProcessTotal, technicalTotal]);

  const hasActiveSearch = searchQuery.trim().length > 0;
  const hasActiveFilters = activeChips.length > 0;

  return (
    <section
      id="programme-catalogue-section"
      className="w-full bg-white shrink-0 flex-grow"
      aria-label="Programme catalogue discovery"
    >
      {/* CONSTANT STICKY SEARCH & DISCOVERY BAR AT TOP OF CATALOGUE */}
      {!isPlannedCategory && (
        <div
          id="sticky-catalogue-search-bar-wrapper"
          className="sticky top-[64px] z-30 w-full bg-[#2666C8] backdrop-blur-md border-b border-[rgba(1,38,106,0.12)] shadow-[0_6px_22px_rgba(1,38,106,0.07)] px-4 sm:px-8 lg:px-10 py-3 sm:py-4 transition-all"
        >
          <div className="max-w-7xl mx-auto">
            <CatalogueToolbar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchClear={handleClearSearch}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              activeFilterCount={activeChips.length}
              onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
        {activeCategoryId === 'ai-tools' && toolsError && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <span>Unable to load the AI Tools catalogue: {toolsError}</span>
            <button
              type="button"
              className="shrink-0 font-semibold underline"
              onClick={() => setToolsReloadToken((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        )}
        {activeCategoryId === 'tools-technology' && technicalError && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <span>Unable to load the Tools &amp; Technology catalogue: {technicalError}</span>
            <button
              type="button"
              className="shrink-0 font-semibold underline"
              onClick={() => setTechnicalReloadToken((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        )}
        {activeCategoryId === 'role-based' && roleError && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <span>Unable to load the Role-Based catalogue: {roleError}</span>
            <button
              type="button"
              className="shrink-0 font-semibold underline"
              onClick={() => setRoleReloadToken((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        )}
        {activeCategoryId === 'certifications' && certificationError && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <span>Unable to load the Certifications catalogue: {certificationError}</span>
            <button
              type="button"
              className="shrink-0 font-semibold underline"
              onClick={() => setCertificationReloadToken((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        )}
        {isPeopleCategory && peopleProcessError && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <span>Unable to load the {activeCategoryId === 'process-based' ? 'Process-Based' : 'People & Behavioural'} catalogue: {peopleProcessError}</span>
            <button
              type="button"
              className="shrink-0 font-semibold underline"
              onClick={() => setPeopleProcessReloadToken((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        )}
        {/* MAIN BODY: Dynamic Filter Sidebar + Catalogue Results */}
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {/* Dynamic Filter Panel (Desktop Sidebar & Mobile Drawer) */}
          {!isPlannedCategory && (
            <DynamicFilterPanel
              activeCategoryId={activeCategoryId}
              selectedFilters={selectedFiltersMap}
              onToggleFilter={handleToggleFilter}
              onClearAll={handleClearCategoryFilters}
              activeCount={activeChips.length}
              isMobileOpen={isMobileFiltersOpen}
              onCloseMobile={() => setIsMobileFiltersOpen(false)}
              totalResultsCount={activeCategoryId === 'ai-tools'
                ? toolsTotal
                : activeCategoryId === 'tools-technology'
                  ? technicalTotal
                : activeCategoryId === 'role-based'
                  ? roleTotal
                  : activeCategoryId === 'certifications'
                    ? certificationTotal
                    : isPeopleCategory
                      ? peopleProcessTotal
                      : filteredProgrammes.length}
              groupsOverride={activeCategoryId === 'ai-tools' && toolsFilterGroups.length > 0
                ? toolsFilterGroups
                : activeCategoryId === 'tools-technology' && technicalFilterGroups.length > 0
                  ? technicalFilterGroups
                : activeCategoryId === 'role-based' && roleFilterGroups.length > 0
                  ? roleFilterGroups
                  : activeCategoryId === 'certifications' && certificationFilterGroups.length > 0
                    ? certificationFilterGroups
                    : isPeopleCategory && peopleProcessFilterGroups.length > 0
                      ? peopleProcessFilterGroups
                    : undefined}
            />
          )}

          {/* Results Column (Active Chips + Result Count + Grid or Empty State) */}
          <CatalogueResults
            activeCategoryId={activeCategoryId}
            programmes={filteredProgrammes}
            totalCategoryCount={totalCategoryCount}
            totalCatalogueCapacity={totalCatalogueCapacity}
            activeChips={activeChips}
            searchQuery={searchQuery}
            sortBy={sortBy}
            onRemoveChip={handleRemoveChip}
            onClearFilters={handleClearCategoryFilters}
            onClearSearch={handleClearSearch}
            hasActiveSearch={hasActiveSearch}
            hasActiveFilters={hasActiveFilters}
            onViewDetail={onViewDetail}
            totalResultsCount={activeCategoryId === 'ai-tools'
              ? toolsTotal
              : activeCategoryId === 'tools-technology'
                ? technicalTotal
              : activeCategoryId === 'role-based'
                ? roleTotal
                : activeCategoryId === 'certifications'
                  ? certificationTotal
                  : isPeopleCategory
                    ? peopleProcessTotal
                  : undefined}
            currentPage={activeCategoryId === 'ai-tools'
              ? toolsPage
              : activeCategoryId === 'tools-technology'
                ? technicalPage
              : activeCategoryId === 'role-based'
                ? rolePage
                : activeCategoryId === 'certifications'
                  ? certificationPage
                  : isPeopleCategory
                    ? peopleProcessPage
                  : undefined}
            pageSize={['ai-tools', 'tools-technology', 'role-based', 'certifications', 'process-based', 'people-behavioural'].includes(activeCategoryId) ? CATALOGUE_PAGE_SIZE : undefined}
            onPageChange={activeCategoryId === 'ai-tools'
              ? setToolsPage
              : activeCategoryId === 'tools-technology'
                ? setTechnicalPage
              : activeCategoryId === 'role-based'
                ? setRolePage
                : activeCategoryId === 'certifications'
                  ? setCertificationPage
                  : isPeopleCategory
                    ? setPeopleProcessPage
                  : undefined}
            isLoading={activeCategoryId === 'ai-tools'
              ? toolsLoading
              : activeCategoryId === 'tools-technology'
                ? technicalLoading
              : activeCategoryId === 'role-based'
                ? roleLoading
                : activeCategoryId === 'certifications'
                  ? certificationLoading
                  : isPeopleCategory
                    ? peopleProcessLoading
                  : undefined}
            isCataloguePlanned={isPlannedCategory}
          />
        </div>
      </div>
    </section>
  );
};
