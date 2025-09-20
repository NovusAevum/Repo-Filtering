import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Stack,
  IconButton,
  Typography,
  Box,
  Fade,
  Slide
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ClearAllOutlinedIcon from '@mui/icons-material/ClearAllOutlined';
import { Notification } from '../../types/interfaces';
import { NotificationType } from '../../types/enums';

interface NotificationSystemProps {
  notifications: Notification[];
  onClose: (notificationId: string) => void;
  onClearAll: () => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onClose,
  onClearAll
}) => {
  const unreadNotifications = notifications.filter(n => !n.read);
  const latestNotification = unreadNotifications[0];

  const getSeverity = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'success';
      case NotificationType.ERROR:
        return 'error';
      case NotificationType.WARNING:
        return 'warning';
      case NotificationType.INFO:
      default:
        return 'info';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Main notification snackbar */}
      <Snackbar
        open={!!latestNotification}
        autoHideDuration={6000}
        onClose={() => latestNotification && onClose(latestNotification.id)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'left' }}
      >
        {latestNotification && (
          <Alert
            severity={getSeverity(latestNotification.type)}
            onClose={() => onClose(latestNotification.id)}
            sx={{ minWidth: 300, maxWidth: 500 }}
          >
            <AlertTitle>{latestNotification.title}</AlertTitle>
            {latestNotification.message}
            <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
              {formatTime(latestNotification.timestamp)}
            </Typography>
          </Alert>
        )}
      </Snackbar>

      {/* Notification stack for multiple notifications */}
      {unreadNotifications.length > 1 && (
        <Box
          sx={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 1400,
            maxWidth: 400,
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <Stack spacing={1}>
            {/* Clear all button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton
                size="small"
                onClick={onClearAll}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <ClearAllOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Additional notifications (excluding the latest one shown in snackbar) */}
            {unreadNotifications.slice(1, 4).map((notification, index) => (
              <Fade
                key={notification.id}
                in={true}
                timeout={300}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Alert
                  severity={getSeverity(notification.type)}
                  onClose={() => onClose(notification.id)}
                  sx={{
                    boxShadow: 2,
                    '& .MuiAlert-message': {
                      width: '100%'
                    }
                  }}
                >
                  <AlertTitle sx={{ fontSize: '0.875rem' }}>
                    {notification.title}
                  </AlertTitle>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
                    {formatTime(notification.timestamp)}
                  </Typography>
                </Alert>
              </Fade>
            ))}

            {/* Show count if there are more notifications */}
            {unreadNotifications.length > 4 && (
              <Alert
                severity="info"
                sx={{
                  boxShadow: 1,
                  bgcolor: 'grey.100',
                  color: 'text.secondary'
                }}
              >
                <Typography variant="body2" textAlign="center">
                  +{unreadNotifications.length - 4} more notifications
                </Typography>
              </Alert>
            )}
          </Stack>
        </Box>
      )}
    </>
  );
};