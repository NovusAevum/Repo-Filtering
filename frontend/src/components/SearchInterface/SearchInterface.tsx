import React, { useState } from 'react';
import {
  Card,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Chip,
  Autocomplete,
  Typography,
  Box,
  Slider,
  Switch,
  FormControlLabel
} from '@mui/material';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { SearchType, RepositoryCategory } from '../../types/enums';
import { SearchFilters } from '../../types/interfaces';

interface SearchInterfaceProps {
  onSearch: (filters: SearchFilters) => void;
  isSearching: boolean;
  searchHistory: string[];
}

const PROGRAMMING_LANGUAGES = [
  'All Languages', 'JavaScript', 'Python', 'TypeScript', 'Java', 'Go', 'Rust', 'C++', 'C#', 'PHP'
];

const LICENSE_TYPES = [
  'All Licenses', 'MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC', 'LGPL-2.1'
];

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  onSearch,
  isSearching,
  searchHistory
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchType: SearchType.REPLIT_FIND,
    query: '',
    minStars: 0,
    language: 'All Languages',
    licenseType: 'All Licenses',
    category: null,
    scoreRange: [0, 50]
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleFilterChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchType: SearchType.REPLIT_FIND,
      query: '',
      minStars: 0,
      language: 'All Languages',
      licenseType: 'All Licenses',
      category: null,
      scoreRange: [0, 50]
    });
  };

  return (
    <Card 
      sx={{ 
        p: 4, 
        mb: 4,
        background: (theme) => theme.palette.mode === 'light' 
          ? 'linear-gradient(145deg, #ffffff 0%, #fafbff 100%)'
          : 'linear-gradient(145deg, #1a1f36 0%, #0f1419 100%)',
        border: (theme) => `1px solid ${theme.palette.mode === 'light' 
          ? 'rgba(102, 126, 234, 0.08)' 
          : 'rgba(129, 140, 248, 0.12)'}`,
      }}
    >
      <Stack spacing={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              🔍 Repository Discovery
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Search and analyze production-ready repositories across platforms
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'primary.main',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    background: (theme) => theme.palette.gradient?.primary,
                  },
                }}
              />
            }
            label="Advanced Filters"
            sx={{ 
              '& .MuiFormControlLabel-label': { 
                fontWeight: 500,
                fontSize: '0.875rem' 
              } 
            }}
          />
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Search Type</InputLabel>
            <Select
              value={filters.searchType}
              onChange={(e) => handleFilterChange('searchType', e.target.value)}
              label="Search Type"
            >
              <MenuItem value={SearchType.REPLIT_FIND}>Replit Find</MenuItem>
              <MenuItem value={SearchType.GITHUB_SEARCH}>GitHub Search</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            freeSolo
            options={searchHistory}
            value={filters.query}
            onInputChange={(_, value) => handleFilterChange('query', value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Query"
                placeholder="Enter search query or leave blank for replit-find with dorks.txt"
                sx={{ flex: 1 }}
              />
            )}
            sx={{ flex: 1 }}
          />

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={isSearching}
            startIcon={<TravelExploreOutlinedIcon />}
            sx={{ minWidth: 120 }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </Stack>

        {showAdvanced && (
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={filters.language}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                  label="Language"
                >
                  {PROGRAMMING_LANGUAGES.map((lang) => (
                    <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>License</InputLabel>
                <Select
                  value={filters.licenseType}
                  onChange={(e) => handleFilterChange('licenseType', e.target.value)}
                  label="License"
                >
                  {LICENSE_TYPES.map((license) => (
                    <MenuItem key={license} value={license}>{license}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || null)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value={RepositoryCategory.PRODUCTION}>Production</MenuItem>
                  <MenuItem value={RepositoryCategory.NON_PRODUCTION}>Non-Production</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
              <Box sx={{ minWidth: 200 }}>
                <Typography gutterBottom>Minimum Stars</Typography>
                <Slider
                  value={filters.minStars}
                  onChange={(_, value) => handleFilterChange('minStars', value)}
                  min={0}
                  max={10000}
                  step={100}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: '0' },
                    { value: 1000, label: '1k' },
                    { value: 5000, label: '5k' },
                    { value: 10000, label: '10k' }
                  ]}
                />
              </Box>

              <Box sx={{ minWidth: 200 }}>
                <Typography gutterBottom>Score Range</Typography>
                <Slider
                  value={filters.scoreRange}
                  onChange={(_, value) => handleFilterChange('scoreRange', value)}
                  min={0}
                  max={50}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: '0' },
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                    { value: 50, label: '50' }
                  ]}
                />
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={clearFilters}
                startIcon={<FilterAltOutlinedIcon />}
              >
                Clear Filters
              </Button>
            </Stack>
          </Stack>
        )}

        {/* Active Filters Display */}
        {(filters.language !== 'All Languages' || 
          filters.licenseType !== 'All Licenses' || 
          filters.category || 
          filters.minStars > 0) && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Active Filters:
            </Typography>
            {filters.language !== 'All Languages' && (
              <Chip
                label={`Language: ${filters.language}`}
                onDelete={() => handleFilterChange('language', 'All Languages')}
                size="small"
              />
            )}
            {filters.licenseType !== 'All Licenses' && (
              <Chip
                label={`License: ${filters.licenseType}`}
                onDelete={() => handleFilterChange('licenseType', 'All Licenses')}
                size="small"
              />
            )}
            {filters.category && (
              <Chip
                label={`Category: ${filters.category}`}
                onDelete={() => handleFilterChange('category', null)}
                size="small"
              />
            )}
            {filters.minStars > 0 && (
              <Chip
                label={`Min Stars: ${filters.minStars}`}
                onDelete={() => handleFilterChange('minStars', 0)}
                size="small"
              />
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};