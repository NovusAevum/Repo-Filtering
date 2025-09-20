import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Stack,
  Box,
  IconButton,
  Button,
  Checkbox,
  Tooltip,
  LinearProgress
} from '@mui/material';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import ForkRightOutlinedIcon from '@mui/icons-material/ForkRightOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Repository } from '../../types/interfaces';
import { RepositoryCategory } from '../../types/enums';

interface RepositoryCardProps {
  repository: Repository;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onViewDetails: () => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const RepositoryCard: React.FC<RepositoryCardProps> = ({
  repository,
  isSelected,
  onSelect,
  onViewDetails,
  onMenuClick
}) => {
  const isProduction = repository.category === RepositoryCategory.PRODUCTION;
  const scorePercentage = Math.min((repository.score / 50) * 100, 100);

  const getScoreColor = (score: number) => {
    if (score >= 30) return 'success';
    if (score >= 15) return 'warning';
    return 'error';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        },
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider'
      }}
    >
      {/* Selection Checkbox */}
      <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '50%',
            '&:hover': { bgcolor: 'background.paper' }
          }}
        />
      </Box>

      {/* Menu Button */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <IconButton
          size="small"
          onClick={onMenuClick}
          sx={{
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'background.paper' }
          }}
        >
          <MoreVertOutlinedIcon />
        </IconButton>
      </Box>

      <CardContent sx={{ flex: 1, pt: 5 }}>
        {/* Repository Header */}
        <Stack spacing={1} mb={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" fontWeight="bold" noWrap>
              {repository.repo}
            </Typography>
            {isProduction ? (
              <Tooltip title="Production Ready">
                <CheckCircleOutlinedIcon color="success" fontSize="small" />
              </Tooltip>
            ) : (
              <Tooltip title="Non-Production">
                <WarningAmberOutlinedIcon color="warning" fontSize="small" />
              </Tooltip>
            )}
          </Stack>
          
          <Typography variant="body2" color="text.secondary" noWrap>
            {repository.owner}
          </Typography>
        </Stack>

        {/* Production Score */}
        <Box mb={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Production Score
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={`${getScoreColor(repository.score)}.main`}>
              {repository.score}/50
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={scorePercentage}
            color={getScoreColor(repository.score)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Repository Stats */}
        <Stack direction="row" spacing={2} mb={2}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <StarOutlinedIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatNumber(repository.stars)}
            </Typography>
          </Stack>
          
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <ForkRightOutlinedIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatNumber(repository.forks)}
            </Typography>
          </Stack>
          
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <CodeOutlinedIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {repository.commits}
            </Typography>
          </Stack>
        </Stack>

        {/* Technology Indicators */}
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          {repository.has_ci && (
            <Chip label="CI/CD" size="small" color="success" variant="outlined" />
          )}
          {repository.has_dockerfile && (
            <Chip label="Docker" size="small" color="info" variant="outlined" />
          )}
          {repository.has_package_json && (
            <Chip label="Node.js" size="small" color="primary" variant="outlined" />
          )}
          {repository.has_requirements && (
            <Chip label="Python" size="small" color="secondary" variant="outlined" />
          )}
        </Stack>

        {/* License */}
        {repository.license && (
          <Chip
            label={repository.license}
            size="small"
            variant="filled"
            sx={{ bgcolor: 'grey.100', color: 'text.secondary' }}
          />
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<VisibilityOutlinedIcon />}
          onClick={onViewDetails}
        >
          View Details
        </Button>
        
        <Button
          size="small"
          href={repository.repo_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </Button>
      </CardActions>
    </Card>
  );
};