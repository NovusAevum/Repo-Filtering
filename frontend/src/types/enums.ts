export enum SearchType {
  REPLIT_FIND = 'replit-find',
  GITHUB_SEARCH = 'github-search'
}

export enum SearchStatus {
  IDLE = 'idle',
  SEARCHING = 'searching',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum RepositoryCategory {
  PRODUCTION = 'production',
  NON_PRODUCTION = 'non-production'
}

export enum SortOption {
  SCORE = 'score',
  STARS = 'stars',
  FORKS = 'forks',
  COMMITS = 'commits',
  CONTRIBUTORS = 'contributors',
  UPDATED = 'last_processed',
  NAME = 'repo'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf'
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark'
}