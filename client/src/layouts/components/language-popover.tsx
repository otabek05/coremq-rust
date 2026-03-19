import type { IconButtonProps } from '@mui/material/IconButton';

import { useState, useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';

export type LanguagePopoverProps = IconButtonProps & {
    data?: {
        value: string;
        label: string;
        icon: string;
    }[];
};

export function LanguagePopover({ data = [], sx, ...other }: LanguagePopoverProps) {
    const { open, anchorEl, onClose, onOpen } = usePopover();

    const [locale, setLocale] = useState(data[0].value);
    const { i18n } = useTranslation();

    const handleChangeLang = useCallback(
        (newLang: string) => {
            setLocale(newLang);
            i18n.changeLanguage(newLang);
            onClose();
        },
        [onClose, i18n],
    );

    const currentLang = data.find((lang) => lang.value === locale);

    const renderFlag = (label?: string, icon?: string) => (
        <Box
            component="img"
            alt={label}
            src={icon}
            sx={{ width: 20, height: 15, borderRadius: 0.25, objectFit: 'cover' }}
        />
    );

    return (
        <>
            <IconButton
                aria-label="Languages button"
                onClick={onOpen}
                sx={{
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    borderRadius: 1,
                    bgcolor: open ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.08)',
                    border: '1px solid rgba(148,163,184,0.1)',
                    '&:hover': { bgcolor: 'rgba(148,163,184,0.14)' },
                    ...sx,
                }}
                {...other}
            >
                <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', lineHeight: 1 }}>
                    {currentLang?.value.toUpperCase()}
                </Box>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={onClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: { mt: 1 },
                    },
                }}
            >
                <MenuList
                    sx={{
                        p: 0.75,
                        gap: '2px',
                        width: 180,
                        display: 'flex',
                        flexDirection: 'column',
                        [`& .${menuItemClasses.root}`]: {
                            px: 1.25,
                            py: 0.75,
                            gap: 1.5,
                            borderRadius: 1,
                            fontSize: '0.835rem',
                            color: '#94A3B8',
                            '&:hover': { color: '#E2E8F0' },
                            [`&.${menuItemClasses.selected}`]: {
                                bgcolor: 'rgba(148,163,184,0.1)',
                                color: '#E2E8F0',
                                fontWeight: 600,
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
                            <Typography
                                variant="body2"
                                sx={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}
                            >
                                {option.label}
                            </Typography>
                            {option.value === currentLang?.value && (
                                <Icon icon="lucide:check" width={14} style={{ marginLeft: 'auto' }} />
                            )}
                        </MenuItem>
                    ))}
                </MenuList>
            </Popover>
        </>
    );
}
