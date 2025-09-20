import React, { useState, useMemo } from 'react';
import {
  Stack,
  Typography,
  Box,
  Pagination,
  Chip,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import { RepositoryCard } from '../RepositoryCard/RepositoryCard';
import { Repository } from '../../types/interfaces';
import { SortOption, SortDirection, RepositoryCategory, ExportFormat } from '../../types/enums';

interface RepositoryListProps {
  repositories: Repository[];
  onRepositorySelect: (repository: Repository, selected: boolean) => void;
  selectedRepositories: Set<string>;
  onViewDetails: (repository: Repository) => void;
  onExport: (repositories: Repository[], format: ExportFormat) => void;
}

const ITEMS_PER_PAGE = 12;

export const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories,
  onRepositorySelect,
  selectedRepositories,
  onViewDetails,
  onExport
}) => {
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortOption>(SortOption.SCORE);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.DESC);
  const [categoryFilter, setCategoryFilter] = useState<RepositoryCategory | 'all'>('all');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Filter and sort repositories
  const filteredAndSortedRepositories = useMemo(() => {
    let filtered = repositories;

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(repo => repo.category === categoryFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle special cases
      if (sortField === SortOption.UPDATED) {
        aValue = new Date(a.last_processed).getTime();
        bValue = new Date(b.last_processed).getTime();
      } else {
        aValue = a[sortField as keyof Repository];
        bValue = b[sortField as keyof Repository];
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === SortDirection.ASC) {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  }, [repositories, categoryFilter, sortField, sortDirection]);

  // Paginate repositories
  const paginatedRepositories = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedRepositories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedRepositories, page]);

  const totalPages = Math.ceil(filteredAndSortedRepositories.length / ITEMS_PER_PAGE);

  const handleSelectAll = () => {
    const allSelected = paginatedRepositories.every(repo => 
      selectedRepositories.has(repo.repo_url)
    );
    
    paginatedRepositories.forEach(repo => {
      onRepositorySelect(repo, !allSelected);
    });
  };

  const handleExport = (format: ExportFormat) => {
    const selectedRepos = repositories.filter(repo => 
      selectedRepositories.has(repo.repo_url)
    );
    onExport(selectedRepos.length > 0 ? selectedRepos : repositories, format);
    setExportMenuAnchor(null);
  };

  const selectedCount = selectedRepositories.size;
  const allCurrentPageSelected = paginatedRepositories.every(repo => 
    selectedRepositories.has(repo.repo_url)
  );

  return (
    <Stack spacing={3}>
      {/* Header with controls */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Found Repositories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredAndSortedRepositories.length} repositories
            {selectedCount > 0 && ` (${selectedCount} selected)`}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          {/* Sort Menu */}
          <Button
            variant="outlined"
            startIcon={<SortOutlinedIcon />}
            onClick={(e) => setSortMenuAnchor(e.currentTarget)}
          >
            Sort
          </Button>
          <Menu
            anchorEl={sortMenuAnchor}
            open={Boolean(sortMenuAnchor)}
            onClose={() => setSortMenuAnchor(null)}
          >
            <MenuItem onClick={() => { setSortField(SortOption.SCORE); setSortDirection(SortDirection.DESC); setSortMenuAnchor(null); }}>
              Score (High to Low)
            </MenuItem>
            <MenuItem onClick={() => { setSortField(SortOption.SCORE); setSortDirection(SortDirection.ASC); setSortMenuAnchor(null); }}>
              Score (Low to High)
            </MenuItem>
            <MenuItem onClick={() => { setSortField(SortOption.STARS); setSortDirection(SortDirection.DESC); setSortMenuAnchor(null); }}>
              Stars (High to Low)
            </MenuItem>
            <MenuItem onClick={() => { setSortField(SortOption.STARS); setSortDirection(SortDirection.ASC); setSortMenuAnchor(null); }}>
              Stars (Low to High)
            </MenuItem>
            <MenuItem onClick={() => { setSortField(SortOption.UPDATED); setSortDirection(SortDirection.DESC); setSortMenuAnchor(null); }}>
              Recently Updated
            </MenuItem>
          </Menu>

          {/* Filter Menu */}
          <Button
            variant="outlined"
            startIcon={<FilterAltOutlinedIcon />}
            onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
          >
            Filter
          </Button>
          <Menu
            anchorEl={filterMenuAnchor}
            open={Boolean(filterMenuAnchor)}
            onClose={() => setFilterMenuAnchor(null)}
          >
            <MenuItem onClick={() => { setCategoryFilter('all'); setFilterMenuAnchor(null); }}>
              All Categories
            </MenuItem>
            <MenuItem onClick={() => { setCategoryFilter(RepositoryCategory.PRODUCTION); setFilterMenuAnchor(null); }}>
              Production Only
            </MenuItem>
            <MenuItem onClick={() => { setCategoryFilter(RepositoryCategory.NON_PRODUCTION); setFilterMenuAnchor(null); }}>
              Non-Production Only
            </MenuItem>
          </Menu>

          {/* Export Menu */}
          <Button
            variant="outlined"
            startIcon={<GetAppOutlinedIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={repositories.length === 0}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleExport(ExportFormat.CSV)}>
              Export as CSV
            </MenuItem>
            <MenuItem onClick={() => handleExport(ExportFormat.JSON)}>
              Export as JSON
            </MenuItem>
            <MenuItem onClick={() => handleExport(ExportFormat.PDF)}>
              Export as PDF
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>

      {/* Active filters */}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        {categoryFilter !== 'all' && (
          <Chip
            label={`Category: ${categoryFilter}`}
            onDelete={() => setCategoryFilter('all')}
            size="small"
          />
        )}
        <Typography variant="body2" color="text.secondary">
          Sorted by {sortField} ({sortDirection === SortDirection.DESC ? 'descending' : 'ascending'})
        </Typography>
      </Stack>

      {/* Bulk actions */}
      {paginatedRepositories.length > 0 && (
        <Stack direction="row" alignItems="center" spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={allCurrentPageSelected}
                indeterminate={selectedCount > 0 && !allCurrentPageSelected}
                onChange={handleSelectAll}
              />
            }
            label={`Select all on page (${paginatedRepositories.length})`}
          />
          {selectedCount > 0 && (
            <Typography variant="body2" color="primary">
              {selectedCount} repositories selected
            </Typography>
          )}
        </Stack>
      )}

      {/* Repository grid */}
      {paginatedRepositories.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 3
          }}
        >
          {paginatedRepositories.map((repository) => (
            <RepositoryCard
              key={repository.repo_url}
              repository={repository}
              isSelected={selectedRepositories.has(repository.repo_url)}
              onSelect={(selected) => onRepositorySelect(repository, selected)}
              onViewDetails={() => onViewDetails(repository)}
              onMenuClick={(event) => {
                // Handle repository menu actions
                event.stopPropagation();
              }}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary'
          }}
        >
          <Typography variant="h6" gutterBottom>
            No repositories found
          </Typography>
          <Typography variant="body2">
            Try adjusting your search criteria or filters
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ pt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Stack>
      )}
    </Stack>
  );
};