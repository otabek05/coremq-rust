import type { Breakpoint } from '@mui/material/styles';

import { useState } from 'react';
import { merge } from 'es-toolkit';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { NavMobile, NavDesktop } from './nav';
import { layoutClasses } from '../core/classes';
import { _account } from '../nav-config-account';
import { dashboardLayoutVars } from './css-vars';
import { useNavData } from '../nav-config-dashboard';
import { MainSection } from '../core/main-section';
import { MenuButton } from '../components/menu-button';
import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';
import { AccountPopover } from '../components/account-popover';
import { LanguagePopover } from '../components/language-popover';

import type { MainSectionProps } from '../core/main-section';
import type { HeaderSectionProps } from '../core/header-section';
import type { LayoutSectionProps } from '../core/layout-section';

export const _langs = [
    {
        value: 'en',
        label: 'English',
        icon: '/assets/icons/flags/us.png',
    },
    {
        value: 'uz',
        label: "O'zbekcha",
        icon: '/assets/icons/flags/uz.png',
    },
    {
        value: 'ko',
        label: '한국어',
        icon: '/assets/icons/flags/kr.png',
    },
];

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type DashboardLayoutProps = LayoutBaseProps & {
    layoutQuery?: Breakpoint;
    slotProps?: {
        header?: HeaderSectionProps;
        main?: MainSectionProps;
    };
};

export function DashboardLayout({ sx, cssVars, children, slotProps, layoutQuery = 'lg' }: DashboardLayoutProps) {
    const theme = useTheme();
    const navData = useNavData();

    /** Mobile drawer */
    const { value: mobileOpen, onFalse: onMobileClose, onTrue: onMobileOpen } = useBoolean();

    /** Desktop collapse */
    const [collapsed, setCollapsed] = useState(false);
    const toggleCollapsed = () => setCollapsed((prev) => !prev);

    const navWidth = collapsed ? '72px' : '260px';

    const renderHeader = () => {
        const headerSlotProps: HeaderSectionProps['slotProps'] = {
            container: {
                maxWidth: false,
            },
        };

        const headerSlots: HeaderSectionProps['slots'] = {
            leftArea: (
                <MenuButton
                    onClick={onMobileOpen}
                    sx={{ mr: 1, ml: -1, [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
                />
            ),
            rightArea: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <LanguagePopover data={_langs} />
                    <AccountPopover data={_account} />
                </Box>
            ),
        };

        return (
            <HeaderSection
                disableElevation
                layoutQuery={layoutQuery}
                {...slotProps?.header}
                slots={{ ...headerSlots, ...slotProps?.header?.slots }}
                slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
                sx={slotProps?.header?.sx}
            />
        );
    };

    const renderMain = () => <MainSection {...slotProps?.main}>{children}</MainSection>;

    return (
        <LayoutSection
            headerSection={renderHeader()}
            sidebarSection={
                <>
                    <NavDesktop
                        data={navData}
                        layoutQuery={layoutQuery}
                        collapsed={collapsed}
                        onToggle={toggleCollapsed}
                    />
                    <NavMobile data={navData} open={mobileOpen} onClose={onMobileClose} />
                </>
            }
            footerSection={null}
            cssVars={{
                ...dashboardLayoutVars(theme),
                '--layout-nav-vertical-width': navWidth,
                ...cssVars,
            }}
            sx={[
                {
                    [`& .${layoutClasses.sidebarContainer}`]: {
                        [theme.breakpoints.up(layoutQuery)]: {
                            pl: navWidth,
                            transition: 'padding-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        },
                    },
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {renderMain()}
        </LayoutSection>
    );
}
