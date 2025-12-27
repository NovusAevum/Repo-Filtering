import { RepositoryCategory, SearchType, SearchStatus, SortOption, SortDirection, NotificationType } from './enums';

// Repository data types
export interface Repository {
  repo_url: string;
  owner: string;
  repo: string;
  stars: number;
  forks: number;
  commits: number;
  contributors: number;
  has_ci: boolean;
  has_dockerfile: boolean;
  has_procfile: boolean;
  has_package_json: boolean;
  has_requirements: boolean;
  readme_len: number;
  license: string | null;
  score: number;
  category: RepositoryCategory;
  total_files: number;
  total_lines: number;
  trufflehog_findings: number;
  bandit_findings: number;
  pages_linking: string;
  last_processed: string;
}

// Search related types
export interface SearchHistoryItem {
  id: string;
  query: string;
  searchType: SearchType;
  timestamp: string;
  resultsCount: number;
}

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  searchType: SearchType;
  createdAt: string;
}

export interface SearchProgress {
  status: SearchStatus;
  currentStep: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  estimatedTimeRemaining: number;
  processedCount: number;
  totalCount: number;
}

// Dashboard analytics types
export interface LanguageDistribution {
  language: string;
  count: number;
  percentage: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  label: string;
}

export interface DashboardStats {
  totalRepositories: number;
  productionReady: number;
  nonProduction: number;
  securityIssues: number;
  languageBreakdown: { name: string; value: number }[];
  analysisTimeline: { date: string; count: number }[];
}

// Filter and sort types
export interface SearchFilters {
  searchType: SearchType;
  query: string;
  minStars: number;
  language: string;
  licenseType: string;
  category: RepositoryCategory | null;
  scoreRange: [number, number];
}

export interface SortConfig {
  field: SortOption;
  direction: SortDirection;
}

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}