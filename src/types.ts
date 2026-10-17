/**
 * TechnoEdge Corporate Training Catalogue - Information Architecture Types & Contracts
 */

export type CategoryId =
  | 'role-based'
  | 'tools-technology'
  | 'process-based'
  | 'certifications'
  | 'ai-tools'
  | 'people-behavioural';

export type LegacyCategoryId = 'people-process';

export type ProgrammePrefix = 'RB' | 'PP' | 'PI' | 'BS' | 'TT' | 'TC' | 'CER';

export type ProficiencyLevel = 'Awareness' | 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';

export interface CategoryArchitecture {
  id: CategoryId;
  name: string;
  count: number;
  idPrefix: string;
  idFormatExample: string;
  templateName: string;
  referenceImage: string;
  description: string;
  sampleId: string;
  sampleTitle: string;
  sampleLevel: ProficiencyLevel;
  filterDimensions: string[];
  structuralRules: {
    leftElements: string[];
    rightElements: string[];
    topElements: string[];
    bottomElements: string[];
    specialRule: string;
  };
}

export interface ProgrammeModule {
  id: string;
  title: string;
  description?: string;
  learningPathTitle?: string;
  learningPathDescription?: string;
  learningOutcomes?: string[];
  concepts?: string[];
  practicalActivities?: string[];
  duration?: string;
  appliedExercise?: {
    title: string;
    content: string | string[];
  };
}

export interface ProgrammeScenario {
  title: string;
  content: string | string[];
  workflow?: string;
  description?: string;
}

export interface ProgrammeDetails {
  summary?: string;
  objective?: string;
  objectives?: string[];
  audience?: string[];
  prerequisitesList?: string[];
  delivery?: string;
  approach?: string;
  format?: string;
  toolsCovered?: string[];
  provider?: string;
  providerCourseCode?: string;
  examCode?: string;
  courseUrl?: string;
  productTechnologies?: string[];
  roles?: string[];
  subjects?: string[];
  languageCodes?: string[];
  certificationInformation?: string;
  recordKind?: 'training-course' | 'credential';
  credentialType?: string;
  credentialClassification?: string;
  credentialStatus?: string;
  credentialLevel?: string;
  categoryTrack?: string;
  examFormatDelivery?: string;
  examDuration?: string;
  timeLimit?: string;
  price?: string;
  retakeFee?: string;
  validityRenewal?: string;
  requiredExamPathway?: string;
  exams?: CertificationExam[];
  certificationObjectives?: CertificationObjective[];
  certificationRequirements?: CertificationRequirement[];
  trainingResources?: CertificationTrainingResource[];
  lifecycle?: CertificationLifecycleItem[];
  modules?: ProgrammeModule[];
  scenarios?: ProgrammeScenario[];
  [key: string]: any; // Allow flexible payload for future details
}

export interface BaseProgramme {
  id: string; // Must match prefix: RBxxxx, PPxxxx, or TTxxxx
  title: string;
  category: CategoryId | LegacyCategoryId;
  level: ProficiencyLevel | string;
  duration?: string;
  format?: 'Instructor-Led' | 'Virtual Class' | 'Self-Paced' | 'Blended' | string;
  details?: ProgrammeDetails; // Full programme content for future view
  seoIndexable?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface RoleBasedProgramme extends BaseProgramme {
  category: 'role-based';
  categoryBadge: 'Role-Based Programme';
  imageUrl: string;
  relatedSkills: string[];
  industry?: string;
  department?: string;
  functionName?: string;
  roleTitle?: string;
}

export interface PeopleProcessProgramme extends BaseProgramme {
  category: 'people-process' | 'process-based' | 'people-behavioural';
  badge: 'People and Process' | 'Process Based' | 'People & Behavioural';
  topicCategory: string; // e.g. "People & Communication Skills"
  imageUrl: string;
  subType?: 'People' | 'Process';
  portfolio?: string;
  icons?: string[];
}

export interface ToolsTechProgramme extends BaseProgramme {
  category: 'tools-technology' | 'ai-tools';
  imageUrl?: string;
  toolLogoUrl: string;
  toolName: string; // Official brand name e.g. "ChatGPT", "Microsoft Copilot", "Power BI"
  vendor: string; // e.g. "OpenAI", "Microsoft", "Databricks", "AWS"
  categoryBadge: 'Tool or Technology';
  skillArea?: string;
  technologyCategory?: string[];
}

export interface CertificationProgramme extends BaseProgramme {
  category: 'certifications';
  categoryBadge: 'Certification Programme';
  imageUrl?: string;
  provider: string;
  providerCourseCode?: string;
  examCode?: string;
  courseUrl?: string;
  productTechnologies: string[];
  roles: string[];
  recordKind?: 'training-course' | 'credential';
  credentialType?: string;
  credentialClassification?: string;
  credentialStatus?: string;
  credentialLevel?: string;
  examDuration?: string;
  validityRenewal?: string;
}

export interface CertificationExam {
  examCode?: string;
  examName?: string;
  status?: string;
  requirementType?: string;
  duration?: string;
  deliveryFormat?: string;
  deliveryProvider?: string;
  proctored?: string;
  languages: string[];
  price?: string;
  currency?: string;
  passingScore?: string;
  url?: string;
  notes?: string;
}

export interface CertificationObjective {
  groupTitle?: string;
  objective: string;
  weight?: string;
  level?: string;
  code?: string;
}

export interface CertificationRequirement {
  type?: string;
  group?: string;
  requirement: string;
  url?: string;
  qualifier?: string;
  notes?: string;
}

export interface CertificationTrainingResource {
  type?: string;
  title: string;
  url?: string;
  duration?: string;
  itemCount?: string;
  relationship?: string;
  notes?: string;
}

export interface CertificationLifecycleItem {
  recordType?: string;
  status?: string;
  validityRenewal?: string;
  retirementTransition?: string;
  details?: string;
  scenario?: string;
  option?: string;
  action?: string;
  outcome?: string;
}

export type AnyProgramme = RoleBasedProgramme | PeopleProcessProgramme | ToolsTechProgramme | CertificationProgramme;

export interface PageSectionInfo {
  id: string;
  title: string;
  phase: string;
  status: 'Phase 1 - Structural Wireframe' | 'Pending Phase' | 'Architected';
  notes: string;
}
