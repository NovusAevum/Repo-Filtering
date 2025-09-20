import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { PieChart, BarChart } from '@mui/x-charts';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import StarOutlined from '@mui/icons-material/StarOutlined';
import { apiService } from '../../services/api';
import { DashboardStats } from '../../types/interfaces';

export const DashboardCharts: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDashboardStats();
        if (response.data) {
          setStats(response.data);
        } else {
          setError(response.error || 'Failed to fetch dashboard stats');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats) {
    return <Alert severity="error">{error || 'Could not load dashboard data.'}</Alert>;
  }

  const categoryData = [
    { id: 0, value: stats.productionReady, label: 'Production', color: '#4caf50' },
    { id: 1, value: stats.nonProduction, label: 'Non-Production', color: '#ff9800' }
  ];

  const languageChartData = stats.languageBreakdown.map((lang, index) => ({
    language: lang.name,
    count: lang.value,
    color: `hsl(${index * 45}, 70%, 50%)`
  }));

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📊 Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time insights and metrics from repository analysis
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Card 
          sx={{ 
            flex: 1,
            background: (theme) => theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(102, 126, 234, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(129, 140, 248, 0.05) 0%, rgba(129, 140, 248, 0.1) 100%)',
            border: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(129, 140, 248, 0.2)'}`,
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: (theme) => theme.palette.gradient?.primary,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CodeOutlinedIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  {stats.totalRepositories.toLocaleString()}
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                  Total Repositories
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                  ↑ 12% vs last month
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            flex: 1,
            background: (theme) => theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.1) 100%)',
            border: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.2)'}`,
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: (theme) => theme.palette.gradient?.success,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUpOutlinedIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  {stats.productionReady}
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                  Production Ready
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                  ↑ 8% vs last month
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            flex: 1,
            background: (theme) => theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 152, 0, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 152, 0, 0.1) 100%)',
            border: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.2)'}`,
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: (theme) => theme.palette.gradient?.warning,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StarOutlined fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold" color="warning.main">
                  {stats.securityIssues}
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                  Security Issues
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                  ↓ 15% vs last month
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Charts Row */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4}>
        {/* Category Distribution */}
        <Card 
          sx={{ 
            flex: 1,
            background: (theme) => theme.palette.mode === 'light'
              ? 'linear-gradient(145deg, #ffffff 0%, #fafbff 100%)'
              : 'linear-gradient(145deg, #1a1f36 0%, #0f1419 100%)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📊 Repository Categories
              </Typography>
              <Chip 
                label="Live Data" 
                size="small" 
                color="success" 
                variant="outlined"
                sx={{ ml: 'auto' }}
              />
            </Box>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stats.totalRepositories > 0 ? (
                <PieChart
                  series={[
                    {
                      data: categoryData,
                      highlightScope: { faded: 'global', highlighted: 'item' },
                      faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                    },
                  ]}
                  width={300}
                  height={200}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} justifyContent="center" mt={2}>
              <Chip
                label={`Production: ${stats.productionReady}`}
                size="small"
                sx={{ bgcolor: '#4caf50', color: 'white' }}
              />
              <Chip
                label={`Non-Production: ${stats.nonProduction}`}
                size="small"
                sx={{ bgcolor: '#ff9800', color: 'white' }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Language Distribution */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Top Programming Languages
            </Typography>
            <Box sx={{ height: 300 }}>
              {languageChartData.length > 0 ? (
                <BarChart
                  dataset={languageChartData}
                  xAxis={[{ scaleType: 'band', dataKey: 'language' }]}
                  series={[{ dataKey: 'count', color: '#2196f3' }]}
                  width={400}
                  height={250}
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    No language data available
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Stack>

      {/* Analysis Timeline */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Analysis Timeline (Last 30 Days)
          </Typography>
          <Box sx={{ height: 300 }}>
            {stats.analysisTimeline.length > 0 ? (
              <BarChart
                dataset={stats.analysisTimeline}
                xAxis={[{ scaleType: 'band', dataKey: 'date' }]}
                series={[{ dataKey: 'count', color: '#9c27b0' }]}
                width={800}
                height={250}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  No analysis data available
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
};