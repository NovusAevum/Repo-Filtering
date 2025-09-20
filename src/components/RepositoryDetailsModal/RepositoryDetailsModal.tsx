import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Card,
  CardContent,
  Link
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import ForkRightOutlinedIcon from '@mui/icons-material/ForkRightOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Repository } from '../../types/interfaces';
import { RepositoryCategory } from '../../types/enums';

interface RepositoryDetailsModalProps {
  repository: Repository | null;
  open: boolean;
  onClose: () => void;
}

export const RepositoryDetailsModal: React.FC<RepositoryDetailsModalProps> = ({
  repository,
  open,
  onClose
}) => {
  if (!repository) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {repository.owner}/{repository.repo}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Repository Details
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseOutlinedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Production Score Section */}
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Production Score
                </Typography>
                <Chip
                  label={isProduction ? 'Production Ready' : 'Non-Production'}
                  color={isProduction ? 'success' : 'warning'}
                  variant="filled"
                />
              </Stack>
              
              <Box mb={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Overall Score
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color={`${getScoreColor(repository.score)}.main`}>
                    {repository.score}/50
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={scorePercentage}
                  color={getScoreColor(repository.score)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Repository Statistics */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Repository Statistics
              </Typography>
              
              <Stack direction="row" spacing={4} flexWrap="wrap">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <StarOutlinedIcon color="action" />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {formatNumber(repository.stars)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stars
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <ForkRightOutlinedIcon color="action" />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {formatNumber(repository.forks)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Forks
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <CodeOutlinedIcon color="action" />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {repository.commits}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Commits
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <PeopleOutlinedIcon color="action" />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {repository.contributors}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contributors
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Technology Stack */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Technology Stack & Features
              </Typography>
              
              <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                {repository.has_ci && (
                  <Chip label="CI/CD Pipeline" color="success" variant="outlined" />
                )}
                {repository.has_dockerfile && (
                  <Chip label="Docker Support" color="info" variant="outlined" />
                )}
                {repository.has_procfile && (
                  <Chip label="Procfile" color="secondary" variant="outlined" />
                )}
                {repository.has_package_json && (
                  <Chip label="Node.js/npm" color="primary" variant="outlined" />
                )}
                {repository.has_requirements && (
                  <Chip label="Python/pip" color="warning" variant="outlined" />
                )}
                {repository.license && (
                  <Chip label={`License: ${repository.license}`} variant="filled" />
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Code Quality & Security */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Code Quality & Security
              </Typography>
              
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <DescriptionOutlinedIcon color="action" />
                    <Typography variant="body1">README Length</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight="bold">
                    {repository.readme_len} characters
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CodeOutlinedIcon color="action" />
                    <Typography variant="body1">Total Files</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight="bold">
                    {repository.total_files}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CodeOutlinedIcon color="action" />
                    <Typography variant="body1">Lines of Code</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight="bold">
                    {repository.total_lines.toLocaleString()}
                  </Typography>
                </Stack>

                <Divider />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SecurityOutlinedIcon color="action" />
                    <Typography variant="body1">TruffleHog Findings</Typography>
                  </Stack>
                  <Chip
                    label={repository.trufflehog_findings}
                    color={repository.trufflehog_findings > 0 ? 'error' : 'success'}
                    size="small"
                  />
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BugReportOutlinedIcon color="action" />
                    <Typography variant="body1">Bandit Findings</Typography>
                  </Stack>
                  <Chip
                    label={repository.bandit_findings}
                    color={repository.bandit_findings > 0 ? 'error' : 'success'}
                    size="small"
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Additional Information
              </Typography>
              
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Last Processed</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(repository.last_processed)}
                  </Typography>
                </Stack>

                {repository.pages_linking && (
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      Linked Pages
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {repository.pages_linking.split(';').length} pages link to this repository
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          href={repository.repo_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </Button>
      </DialogActions>
    </Dialog>
  );
};