import type { IconButtonProps } from '@mui/material/IconButton';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemButton from '@mui/material/ListItemButton';

import { useRouter } from 'src/routes/hooks';

import { useNotifications, type AppNotification } from 'src/hooks/use-notifications';

import { fToNow } from 'src/utils/format-time';

import { useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type NotificationsPopoverProps = IconButtonProps;

// Notification type → { icon, color }
const NOTIF_META: Record<AppNotification['type'], { icon: string; color: string }> = {
  overdue: { icon: 'solar:bill-cross-bold-duotone', color: 'error.main' },
  'due-soon': { icon: 'solar:calendar-date-bold-duotone', color: 'warning.main' },
  'out-of-stock': { icon: 'solar:box-minimalistic-broken', color: 'error.main' },
  'low-stock': { icon: 'solar:box-minimalistic-bold-duotone', color: 'warning.main' },
  expiry: { icon: 'solar:calendar-mark-bold-duotone', color: 'warning.dark' },
  'supplier-due': { icon: 'solar:wallet-bold-duotone', color: 'info.main' },
  'new-purchase': { icon: 'solar:cart-plus-bold-duotone', color: 'success.main' },
  'payment-received': { icon: 'solar:dollar-minimalistic-bold-duotone', color: 'success.main' },
  expense: { icon: 'solar:tag-price-bold-duotone', color: 'info.dark' },
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// ----------------------------------------------------------------------

export function NotificationsPopover({ sx, ...other }: NotificationsPopoverProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const computed = useNotifications();

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('notification_read_ids');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set<string>(parsed);
      }
    } catch {
      // ignore corrupt data
    }
    return new Set<string>();
  });

  // Persist readIds to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('notification_read_ids', JSON.stringify(Array.from(readIds)));
    } catch {
      // ignore write errors
    }
  }, [readIds]);

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const notifications = useMemo(
    () =>
      computed
        .filter((n) => !readIds.has(n.id))
        .sort((a, b) => b.postedAt - a.postedAt),
    [computed, readIds]
  );

  const totalUnRead = notifications.filter((n) => n.isUnRead).length;

  const cutoff = Date.now() - SEVEN_DAYS_MS;
  const recentNotifications = notifications.filter((n) => n.postedAt >= cutoff);
  const olderNotifications = notifications.filter((n) => n.postedAt < cutoff);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setReadIds(new Set(computed.map((n) => n.id)));
  }, [computed]);

  const handleNotificationClick = useCallback(
    (notification: AppNotification) => {
      setReadIds((prev) => new Set([...prev, notification.id]));
      handleClosePopover();
      router.push(notification.href);
    },
    [router, handleClosePopover]
  );

  return (
    <>
      <IconButton
        color={openPopover ? 'primary' : 'default'}
        onClick={handleOpenPopover}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={totalUnRead} color="error">
          <Iconify width={24} icon="solar:bell-bing-bold-duotone" />
        </Badge>
      </IconButton>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            py: 2,
            paddingInlineStart: 2.5,
            paddingInlineEnd: 1.5,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1">{t('layout.notifications')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('layout.unreadMessages', { count: totalUnRead })}
            </Typography>
          </Box>

          {totalUnRead > 0 && (
            <Tooltip title={t('layout.markAllRead')}>
              <IconButton color="primary" onClick={handleMarkAllAsRead}>
                <Iconify icon="eva:done-all-fill" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ overflowY: 'auto', minHeight: 240, maxHeight: { xs: 360, sm: 480 } }}>
          {notifications.length === 0 ? (
            <Box
              sx={{
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: 'text.secondary',
                gap: 1,
              }}
            >
              <Iconify icon="solar:bell-off-bold-duotone" width={48} sx={{ opacity: 0.4 }} />
              <Typography variant="body2">{t('layout.notifications')}</Typography>
            </Box>
          ) : (
            <>
              {recentNotifications.length > 0 && (
                <List
                  disablePadding
                  subheader={
                    <ListSubheader disableSticky sx={{ py: 1, px: 2.5, typography: 'overline' }}>
                      {t('layout.new')}
                    </ListSubheader>
                  }
                >
                  {recentNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </List>
              )}

              {olderNotifications.length > 0 && (
                <List
                  disablePadding
                  subheader={
                    <ListSubheader disableSticky sx={{ py: 1, px: 2.5, typography: 'overline' }}>
                      {t('layout.beforeThat')}
                    </ListSubheader>
                  }
                >
                  {olderNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </List>
              )}
            </>
          )}
        </Box>
      </Popover>
    </>
  );
}

// ----------------------------------------------------------------------

function NotificationItem({
  notification,
  onClick,
}: {
  notification: AppNotification;
  onClick: (n: AppNotification) => void;
}) {
  const meta = NOTIF_META[notification.type] ?? {
    icon: 'solar:bell-bold-duotone',
    color: 'text.secondary',
  };

  return (
    <ListItemButton
      onClick={() => onClick(notification)}
      sx={{
        py: 1.5,
        px: 2.5,
        mt: '1px',
        alignItems: 'flex-start',
        cursor: 'pointer',
        ...(notification.isUnRead && {
          bgcolor: 'action.selected',
        }),
      }}
    >
      {/* Icon avatar */}
      <Box
        sx={{
          mr: 2,
          mt: 0.25,
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.neutral',
        }}
      >
        <Iconify icon={meta.icon} width={22} sx={{ color: meta.color }} />
      </Box>

      <ListItemText
        primary={
          <Typography variant="subtitle2" sx={{ mb: 0.25 }}>
            {notification.title}
            {notification.isUnRead && (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  ml: 1,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  verticalAlign: 'middle',
                }}
              />
            )}
          </Typography>
        }
        secondary={
          <>
            <Typography
              component="span"
              variant="body2"
              sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}
            >
              {notification.description}
            </Typography>
            <Typography
              component="span"
              variant="caption"
              sx={{
                gap: 0.5,
                display: 'flex',
                alignItems: 'center',
                color: 'text.disabled',
              }}
            >
              <Iconify width={14} icon="solar:clock-circle-outline" />
              {fToNow(notification.postedAt)}
            </Typography>
          </>
        }
        disableTypography
      />
    </ListItemButton>
  );
}
