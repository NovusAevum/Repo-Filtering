import React from 'react';
import {
  Card,
  LinearProgress,
  Typography,
  Stack,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { SearchProgress } from '../../types/interfaces';
import { SearchStatus } from '../../types/enums';
import { formatSearchStatus, formatDuration } from '../../utils/formatters';

interface ProgressTrackerProps {
  progress: SearchProgress;
  onCancel: () => void;
}

const SEARCH_STEPS = [
  'Initializing Search',
  'Fetching Candidates',
  'Analyzing Repositories',
  'Processing Results'
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  onCancel
}) => {
  const isActive = progress.status === SearchStatus.SEARCHING || progress.status === SearchStatus.PROCESSING;
  const isCompleted = progress.status === SearchStatus.COMPLETED;
  const isFailed = progress.status === SearchStatus.FAILED;
  const isCancelled = progress.status === SearchStatus.CANCELLED;

  const getStatusColor = () => {
    if (isCompleted) return 'success';
    if (isFailed || isCancelled) return 'error';
    return 'primary';
  };

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            Search Progress
          </Typography>
          {isActive && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelOutlinedIcon />}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </Stack>

        {/* Progress Bar */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              {formatSearchStatus(progress.status)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress.progress}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress.progress}
            color={getStatusColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Current Step */}
        {isActive && (
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={20} />
            <Typography variant="body1">
              {progress.currentStep}
            </Typography>
          </Stack>
        )}

        {/* Step Progress */}
        <Stepper activeStep={progress.completedSteps} alternativeLabel>
          {SEARCH_STEPS.map((label, index) => (
            <Step key={label} completed={index < progress.completedSteps}>
              <StepLabel
                error={isFailed && index === progress.completedSteps}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Statistics */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Processed
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {progress.processedCount} / {progress.totalCount}
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Completed Steps
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {progress.completedSteps} / {progress.totalSteps}
            </Typography>
          </Box>
          
          {isActive && progress.estimatedTimeRemaining > 0 && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Time Remaining
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatDuration(progress.estimatedTimeRemaining)}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Status Messages */}
        {isCompleted && (
          <Box
            sx={{
              p: 2,
              bgcolor: 'success.light',
              borderRadius: 1,
              border: 1,
              borderColor: 'success.main'
            }}
          >
            <Typography variant="body2" color="success.dark">
              ✅ Search completed successfully! Found {progress.processedCount} repositories.
            </Typography>
          </Box>
        )}

        {isFailed && (
          <Box
            sx={{
              p: 2,
              bgcolor: 'error.light',
              borderRadius: 1,
              border: 1,
              borderColor: 'error.main'
            }}
          >
            <Typography variant="body2" color="error.dark">
              ❌ Search failed. Please try again or check your search parameters.
            </Typography>
          </Box>
        )}

        {isCancelled && (
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
              ⚠️ Search was cancelled. Partial results may be available.
            </Typography>
          </Box>
        )}
      </Stack>
    </Card>
  );
};