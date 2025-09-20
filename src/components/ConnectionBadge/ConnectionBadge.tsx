import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { ConnectionStatus } from '../../services/websocket';

export const ConnectionBadge: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const map = {
    connected: { label: 'Live', color: 'success' as const, desc: 'Real-time updates via WebSocket' },
    reconnecting: { label: 'Reconnecting', color: 'warning' as const, desc: 'Trying to restore connection' },
    fallback: { label: 'Fallback', color: 'default' as const, desc: 'Using REST polling fallback' },
    disconnected: { label: 'Offline', color: 'error' as const, desc: 'No connection to backend' },
    connecting: { label: 'Connecting', color: 'info' as const, desc: 'Establishing connection' },
  } as const;
  const cfg = map[status];
  return (
    <Tooltip title={cfg.desc}>
      <Chip label={cfg.label} color={cfg.color} size="small" variant={status === 'fallback' ? 'outlined' : 'filled'} />
    </Tooltip>
  );
};
