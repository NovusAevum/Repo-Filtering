import { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Stack,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Chip
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import Brightness4OutlinedIcon from '@mui/icons-material/Brightness4Outlined';
import Brightness7OutlinedIcon from '@mui/icons-material/Brightness7Outlined';

// Components
import { SearchInterface } from './components/SearchInterface/SearchInterface';
import { DashboardCharts } from './components/DashboardCharts/DashboardCharts';
import { RepositoryList } from './components/RepositoryList/RepositoryList';
import { RepositoryDetailsModal } from './components/RepositoryDetailsModal/RepositoryDetailsModal';
import { ProgressTracker } from './components/ProgressTracker/ProgressTracker';
import { NotificationSystem } from './components/NotificationSystem/NotificationSystem';
import { ConnectionBadge } from './components/ConnectionBadge/ConnectionBadge';

// Data and types

import { Repository, SearchFilters, Notification, SearchProgress } from './types/interfaces';
import { SearchStatus, NotificationType, ExportFormat, ThemeMode } from './types/enums';

// Services
import { apiService } from './services/api';
import { wsService, ProgressUpdateEvent, SearchCompleteEvent } from './services/websocket';

// Theme
import lightTheme, { darkTheme } from './theme/theme';

export default function ReplitFinderApp() {
  // State management
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepositories, setSelectedRepositories] = useState<Set<string>>(new Set());
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress>({
    status: SearchStatus.IDLE,
    currentStep: '',
    progress: 0,
    totalSteps: 5,
    completedSteps: 0,
    estimatedTimeRemaining: 0,
    processedCount: 0,
    totalCount: 0
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.LIGHT);
  const [searchHistory] = useState<string[]>(['react typescript', 'python django', 'node.js express']);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Theme selection
  const currentTheme = themeMode === ThemeMode.LIGHT ? lightTheme : darkTheme;

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Connect to WebSocket
        wsService.connect();

        // Check API health
        const healthResponse = await apiService.healthCheck();
        if (healthResponse.error) {
          console.warn('Backend API is not available, using mock data');
          // Use mock data when backend is not available
          setRepositories([
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
              category: 'production' as any,
              total_files: 45,
              total_lines: 12500,
              trufflehog_findings: 0,
              bandit_findings: 0,
              pages_linking: 'https://repl.co/example1;https://repl.co/example2',
              last_processed: '2024-01-15T10:30:00Z'
            }
          ]);
          setApiError('Backend API is not available - showing demo data');
          setIsLoading(false);
          return;
        }

        // Load initial repositories
        const reposResponse = await apiService.getRepositories();
        if (reposResponse.data) {
          setRepositories(reposResponse.data.items);
        }

        setApiError(null);
      } catch (error) {
        console.warn('Failed to connect to backend, using mock data');
        // Fallback to mock data
        setRepositories([
          {
            repo_url: 'https://github.com/example/demo-project',
            owner: 'example',
            repo: 'demo-project',
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
            category: 'production' as any,
            total_files: 32,
            total_lines: 8900,
            trufflehog_findings: 1,
            bandit_findings: 0,
            pages_linking: 'https://repl.co/demo1',
            last_processed: '2024-01-14T15:45:00Z'
          }
        ]);
        setApiError('Backend connection failed - showing demo data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Setup WebSocket listeners
    const handleProgressUpdate = (data: ProgressUpdateEvent) => {
      if (data.search_id === currentSearchId) {
        setSearchProgress({
          status: data.status as SearchStatus,
          currentStep: data.current_step,
          progress: data.progress,
          totalSteps: data.total_steps,
          completedSteps: data.completed_steps,
          estimatedTimeRemaining: 0,
          processedCount: data.processed_count,
          totalCount: data.total_count
        });
      }
    };

    const handleSearchComplete = async (data: SearchCompleteEvent) => {
      if (data.search_id === currentSearchId) {
        // Refresh repositories
        const reposResponse = await apiService.getRepositories();
        if (reposResponse.data) {
          setRepositories(reposResponse.data.items);
        }

        setIsSearching(false);
        setCurrentSearchId(null);

        // Add completion notification
        const completionNotification: Notification = {
          id: Date.now().toString(),
          type: NotificationType.SUCCESS,
          title: 'Search Completed',
          message: `Found ${data.result_count} repositories matching your criteria`,
          timestamp: new Date().toISOString(),
          read: false
        };
        setNotifications(prev => [completionNotification, ...prev]);
      }
    };

    wsService.on('progress_update', handleProgressUpdate);
    wsService.on('search_complete', handleSearchComplete);

    const handleStatusChange = (status: any) => {
      // force rerender by toggling state
      setConnectionStatus(status as any);
    };
    wsService.on('status_change', handleStatusChange);

    return () => {
      wsService.off('progress_update', handleProgressUpdate);
      wsService.off('search_complete', handleSearchComplete);
      wsService.off('status_change', handleStatusChange);
      wsService.disconnect();
    };
  }, [currentSearchId]);

  // Search functionality
  const [connectionStatus, setConnectionStatus] = useState<any>('connecting');

  const handleSearch = async (filters: SearchFilters) => {
    try {
      setIsSearching(true);
      
      // Add notification
      const searchNotification: Notification = {
        id: Date.now().toString(),
        type: NotificationType.INFO,
        title: 'Search Started',
        message: `Searching for repositories with query: "${filters.query || 'default dorks'}"`,
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [searchNotification, ...prev]);

      // Start search via API
      const response = await apiService.startSearch(filters);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setCurrentSearchId(response.data.search_id);
        wsService.setActiveSearch(response.data.search_id);
        setSearchProgress({
          status: SearchStatus.SEARCHING,
          currentStep: 'Starting search...',
          progress: 0,
          totalSteps: 5,
          completedSteps: 0,
          estimatedTimeRemaining: 0,
          processedCount: 0,
          totalCount: 0
        });
      }
    } catch (error) {
      setIsSearching(false);
      const errorNotification: Notification = {
        id: Date.now().toString(),
        type: NotificationType.ERROR,
        title: 'Search Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [errorNotification, ...prev]);
    }
  };

  // Repository selection
  const handleRepositorySelect = (repository: Repository, selected: boolean) => {
    setSelectedRepositories(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(repository.repo_url);
      } else {
        newSet.delete(repository.repo_url);
      }
      return newSet;
    });
  };

  // Repository details
  const handleViewDetails = (repository: Repository) => {
    setSelectedRepository(repository);
    setIsDetailsModalOpen(true);
  };

  // Export functionality
  const handleExport = (repositories: Repository[], format: ExportFormat) => {
    const exportNotification: Notification = {
      id: Date.now().toString(),
      type: NotificationType.SUCCESS,
      title: 'Export Started',
      message: `Exporting ${repositories.length} repositories as ${format.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [exportNotification, ...prev]);

    // Simulate export process
    setTimeout(() => {
      const completionNotification: Notification = {
        id: (Date.now() + 1).toString(),
        type: NotificationType.SUCCESS,
        title: 'Export Completed',
        message: `Successfully exported ${repositories.length} repositories`,
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [completionNotification, ...prev]);
    }, 1000);
  };

  // Cancel search
  const handleCancelSearch = async () => {
    if (currentSearchId) {
      try {
        await apiService.cancelSearch(currentSearchId);
        setIsSearching(false);
        setCurrentSearchId(null);
        wsService.setActiveSearch(null);
        setSearchProgress(prev => ({
          ...prev,
          status: SearchStatus.CANCELLED
        }));

        const cancelNotification: Notification = {
          id: Date.now().toString(),
          type: NotificationType.WARNING,
          title: 'Search Cancelled',
          message: 'Search operation was cancelled by user',
          timestamp: new Date().toISOString(),
          read: false
        };
        setNotifications(prev => [cancelNotification, ...prev]);
      } catch (error) {
        console.error('Error cancelling search:', error);
      }
    }
  };

  // Notification management
  const handleCloseNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Theme toggle
  const handleThemeToggle = () => {
    setThemeMode(prev => prev === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT);
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // Show loading state
  if (isLoading) {
    return (
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Loading Replit Production Finder...
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connecting to backend services...
          </Typography>
        </Container>
      </ThemeProvider>
    );
  }

  // Show API error state but still render the app with demo data
  const showApiWarning = apiError && repositories.length === 0;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Replit Production Finder
          </Typography>
          
          <Stack direction="row" alignItems="center" spacing={1}>
            <ConnectionBadge status={connectionStatus} />
            <FormControlLabel
              control={
                <Switch
                  checked={themeMode === ThemeMode.DARK}
                  onChange={handleThemeToggle}
                  icon={<Brightness7OutlinedIcon />}
                  checkedIcon={<Brightness4OutlinedIcon />}
                />
              }
              label=""
            />
            
            <IconButton color="inherit">
              <Badge badgeContent={unreadNotificationCount} color="error">
                <NotificationsOutlinedIcon />
              </Badge>
            </IconButton>
            
            <IconButton color="inherit">
              <SettingsOutlinedIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* API Warning */}
          {apiError && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'warning.light',
                borderRadius: 1,
                border: 1,
                borderColor: 'warning.main'
              }}
            >
              <Typography variant="body2" color="warning.dark">
                ⚠️ {apiError}
              </Typography>
            </Box>
          )}

          {/* Hero Section */}
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              background: (theme) => theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(129, 140, 248, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%)',
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.mode === 'light' 
                ? 'rgba(102, 126, 234, 0.12)' 
                : 'rgba(129, 140, 248, 0.12)'}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: (theme) => theme.palette.mode === 'light'
                  ? 'radial-gradient(circle at 30% 20%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%)'
                  : 'radial-gradient(circle at 30% 20%, rgba(129, 140, 248, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(167, 139, 250, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h1" 
                component="h1" 
                fontWeight="800" 
                gutterBottom
                sx={{
                  background: (theme) => theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  letterSpacing: '-0.02em',
                }}
              >
                Repository Intelligence
              </Typography>
              <Typography 
                variant="h5" 
                color="text.secondary" 
                sx={{ 
                  maxWidth: '800px', 
                  mx: 'auto',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  mb: 2
                }}
              >
                Discover, analyze, and evaluate production-ready repositories with AI-powered insights from Replit and GitHub ecosystems
              </Typography>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                justifyContent="center" 
                alignItems="center"
                sx={{ mt: 4 }}
              >
                <Chip
                  label="🚀 Production-Ready Analysis"
                  variant="filled"
                  sx={{ 
                    background: (theme) => theme.palette.gradient?.primary,
                    color: 'white',
                    fontWeight: 600,
                    px: 2,
                    py: 0.5
                  }}
                />
                <Chip
                  label="📊 Real-time Analytics"
                  variant="outlined"
                  sx={{ 
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    fontWeight: 600
                  }}
                />
                <Chip
                  label="🔒 Security Scanning"
                  variant="outlined"
                  sx={{ 
                    borderColor: 'success.main',
                    color: 'success.main',
                    fontWeight: 600
                  }}
                />
              </Stack>
            </Box>
          </Box>

          {/* Search Interface */}
          <SearchInterface
            onSearch={handleSearch}
            isSearching={isSearching}
            searchHistory={searchHistory}
          />

          {/* Progress Tracker */}
          {(isSearching || searchProgress.status !== SearchStatus.IDLE) && (
            <ProgressTracker
              progress={searchProgress}
              onCancel={handleCancelSearch}
            />
          )}

          {/* Dashboard Charts */}
          <DashboardCharts />

          {/* Repository List */}
          <RepositoryList
            repositories={repositories}
            onRepositorySelect={handleRepositorySelect}
            selectedRepositories={selectedRepositories}
            onViewDetails={handleViewDetails}
            onExport={handleExport}
          />

          {/* Repository Details Modal */}
          <RepositoryDetailsModal
            repository={selectedRepository}
            open={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedRepository(null);
            }}
          />

          {/* Notification System */}
          <NotificationSystem
            notifications={notifications}
            onClose={handleCloseNotification}
            onClearAll={handleClearAllNotifications}
          />
        </Stack>
      </Container>
    </ThemeProvider>
  );
}