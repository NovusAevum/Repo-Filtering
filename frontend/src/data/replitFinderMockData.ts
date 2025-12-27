import { Repository, DashboardStats } from '../types/interfaces';
import { RepositoryCategory } from '../types/enums';

export const mockRepositories: Repository[] = [
  {
    repo_url: 'https://github.com/example/awesome-project',
    owner: 'example',
    repo: 'awesome-project',
    stars: 1250,
    forks: 340,
    commits: 156,
    contributors: 8,
    has_ci: true,
    has_dockerfile: true,
    has_procfile: false,
    has_package_json: true,
    has_requirements: false,
    readme_len: 2500,
    license: 'MIT',
    score: 35,
    category: RepositoryCategory.PRODUCTION,
    total_files: 45,
    total_lines: 12500,
    trufflehog_findings: 0,
    bandit_findings: 0,
    pages_linking: 'https://repl.co/example1;https://repl.co/example2',
    last_processed: '2024-01-15T10:30:00Z'
  },
  {
    repo_url: 'https://github.com/demo/web-app',
    owner: 'demo',
    repo: 'web-app',
    stars: 890,
    forks: 120,
    commits: 89,
    contributors: 5,
    has_ci: false,
    has_dockerfile: true,
    has_procfile: true,
    has_package_json: true,
    has_requirements: true,
    readme_len: 1800,
    license: 'Apache-2.0',
    score: 28,
    category: RepositoryCategory.PRODUCTION,
    total_files: 32,
    total_lines: 8900,
    trufflehog_findings: 1,
    bandit_findings: 0,
    pages_linking: 'https://repl.co/demo1',
    last_processed: '2024-01-14T15:45:00Z'
  },
  {
    repo_url: 'https://github.com/test/simple-api',
    owner: 'test',
    repo: 'simple-api',
    stars: 45,
    forks: 12,
    commits: 23,
    contributors: 2,
    has_ci: false,
    has_dockerfile: false,
    has_procfile: false,
    has_package_json: false,
    has_requirements: true,
    readme_len: 450,
    license: null,
    score: 8,
    category: RepositoryCategory.NON_PRODUCTION,
    total_files: 8,
    total_lines: 1200,
    trufflehog_findings: 0,
    bandit_findings: 2,
    pages_linking: 'https://repl.co/test1',
    last_processed: '2024-01-13T09:20:00Z'
  }
];

export const mockDashboardStats: DashboardStats = {
  totalRepositories: 150,
  productionRepos: 65,
  nonProductionRepos: 85,
  averageScore: 18.5,
  totalStars: 45600,
  languageDistribution: [
    { language: 'JavaScript', count: 45, percentage: 30 },
    { language: 'Python', count: 38, percentage: 25.3 },
    { language: 'TypeScript', count: 25, percentage: 16.7 },
    { language: 'Java', count: 18, percentage: 12 },
    { language: 'Go', count: 12, percentage: 8 },
    { language: 'Rust', count: 8, percentage: 5.3 },
    { language: 'C++', count: 4, percentage: 2.7 }
  ],
  scoreDistribution: [
    { range: '0-10', count: 45, label: 'Low' },
    { range: '11-20', count: 38, label: 'Medium' },
    { range: '21-30', count: 42, label: 'High' },
    { range: '31-40', count: 20, label: 'Very High' },
    { range: '41-50', count: 5, label: 'Excellent' }
  ]
};