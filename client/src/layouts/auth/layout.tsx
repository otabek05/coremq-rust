import type { Breakpoint } from '@mui/material/styles';

import { merge } from 'es-toolkit';

import Box from '@mui/material/Box';

import { Logo } from 'src/components/logo';

import { AuthContent } from './content';
import { MainSection } from '../core/main-section';
import { LayoutSection } from '../core/layout-section';
import { HeaderSection } from '../core/header-section';

import type { AuthContentProps } from './content';
import type { MainSectionProps } from '../core/main-section';
import type { HeaderSectionProps } from '../core/header-section';
import type { LayoutSectionProps } from '../core/layout-section';
import { useEffect, useState } from 'react';
import { LinearProgress } from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import Cookies from 'js-cookie';

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type AuthLayoutProps = LayoutBaseProps & {
    layoutQuery?: Breakpoint;
    slotProps?: {
        header?: HeaderSectionProps;
        main?: MainSectionProps;
        content?: AuthContentProps;
    };
};

export function AuthLayout({ sx, cssVars, children, slotProps, layoutQuery = 'md' }: AuthLayoutProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = Cookies.get('access_token');
        if (token) {
            router.push('/');
        } else {
            setLoading(false);
        }
    }, [router]);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    bgcolor: '#0B0F19',
                }}
            >
                <LinearProgress
                    sx={{
                        width: 1,
                        maxWidth: 320,
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: '#00A76F',
                        },
                        backgroundColor: 'rgba(0, 167, 111, 0.15)',
                    }}
                />
            </Box>
        );
    }

    const renderHeader = () => {
        const headerSlotProps: HeaderSectionProps['slotProps'] = { container: { maxWidth: false } };

        const headerSlots: HeaderSectionProps['slots'] = {
            leftArea: <Logo />,
            rightArea: <Box />,
        };

        return (
            <HeaderSection
                disableElevation
                layoutQuery={layoutQuery}
                {...slotProps?.header}
                slots={{ ...headerSlots, ...slotProps?.header?.slots }}
                slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
                sx={[
                    { position: { [layoutQuery]: 'fixed' } },
                    ...(Array.isArray(slotProps?.header?.sx) ? (slotProps?.header?.sx ?? []) : [slotProps?.header?.sx]),
                ]}
            />
        );
    };

    const renderMain = () => (
        <MainSection
            {...slotProps?.main}
            sx={[
                (theme) => ({
                    alignItems: 'center',
                    p: theme.spacing(3, 2, 10, 2),
                    [theme.breakpoints.up(layoutQuery)]: {
                        justifyContent: 'center',
                        p: theme.spacing(10, 0, 10, 0),
                    },
                }),
                ...(Array.isArray(slotProps?.main?.sx) ? (slotProps?.main?.sx ?? []) : [slotProps?.main?.sx]),
            ]}
        >
            <AuthContent {...slotProps?.content}>{children}</AuthContent>
        </MainSection>
    );

    return (
        <LayoutSection
            headerSection={renderHeader()}
            footerSection={null}
            cssVars={{ '--layout-auth-content-width': '420px', ...cssVars }}
            sx={[
                () => ({
                    position: 'relative',
                    minHeight: '100vh',
                    background: '#0B0F19',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 167, 111, 0.08) 0%, transparent 60%)',
                        pointerEvents: 'none',
                    },
                }),
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {renderMain()}
        </LayoutSection>
    );
}
