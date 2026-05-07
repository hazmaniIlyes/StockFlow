import type { Language } from 'src/contexts';
import type { IconButtonProps } from '@mui/material/IconButton';

import { useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { useI18n } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type LanguagePopoverProps = IconButtonProps & {
  data?: {
    value: string;
    label: string;
    code: string;
    color: string;
  }[];
};

export function LanguagePopover({ data = [], sx, ...other }: LanguagePopoverProps) {
  const { open, anchorEl, onClose, onOpen } = usePopover();
  const { language, setLanguage } = useI18n();
  const theme = useTheme();

  const handleChangeLang = useCallback(
    (newLang: string) => {
      setLanguage(newLang as Language);
      onClose();
    },
    [onClose, setLanguage]
  );

  const currentLang = data.find((lang) => lang.value === language);

  const renderMenuList = () => (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            mt: 0.75,
            overflow: 'hidden',
            borderRadius: 2,
            border: `1px solid ${theme.vars.palette.divider}`,
            boxShadow: theme.vars.customShadows.z20,
          },
        },
      }}
    >
      <MenuList
        sx={{
          p: 0.75,
          gap: 0.25,
          width: 168,
          display: 'flex',
          flexDirection: 'column',
          [`& .${menuItemClasses.root}`]: {
            px: 1.5,
            py: 1,
            gap: 1.5,
            borderRadius: 1.5,
            [`&.${menuItemClasses.selected}`]: {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              fontWeight: 'fontWeightSemiBold',
            },
          },
        }}
      >
        {data?.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === currentLang?.value}
            onClick={() => handleChangeLang(option.value)}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: option.color,
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" fontWeight={option.value === currentLang?.value ? 600 : 400} sx={{ flex: 1 }}>
              {option.label}
            </Typography>
            {option.value === currentLang?.value && (
              <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'primary.main' }} />
            )}
          </MenuItem>
        ))}
      </MenuList>
    </Popover>
  );

  return (
    <>
      <ButtonBase
        aria-label="Languages button"
        onClick={onOpen}
        sx={{
          height: 36,
          px: 1.5,
          gap: 1,
          borderRadius: 1.5,
          border: `1px solid ${open ? theme.vars.palette.primary.main : theme.vars.palette.divider}`,
          bgcolor: open ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
          color: open ? 'primary.main' : 'text.secondary',
          transition: 'all 150ms ease',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            borderColor: theme.vars.palette.primary.main,
            color: 'primary.main',
          },
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: currentLang?.color ?? 'text.disabled',
            flexShrink: 0,
          }}
        />
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1 }}>
          {currentLang?.label ?? ''}
        </Typography>
        <Iconify
          icon={open ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
          width={14}
        />
      </ButtonBase>

      {renderMenuList()}
    </>
  );
}

