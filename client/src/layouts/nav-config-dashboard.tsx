import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

const icon = (name: string) => <Icon icon={name} width={18} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navData: NavItem[] = [];

export const useNavData = (): NavGroup[] => {
  const { t } = useTranslation();

  return [
    {
      label: t('nav.home'),
      items: [
        { title: t('nav.home'), path: '/', icon: icon('lucide:house') },
      ],
    },
    {
      label: 'Monitoring',
      items: [
        { title: t('nav.sessions'), path: '/sessions', icon: icon('lucide:users') },
        { title: t('nav.listeners'), path: '/listeners', icon: icon('lucide:radio-tower') },
      ],
    },
    {
      label: 'Tools',
      items: [
        { title: t('nav.websocket'), path: '/websockets', icon: icon('lucide:cable') },
        { title: t('nav.webhook'), path: '/webhooks', icon: icon('lucide:webhook') },
      ],
    },
    {
      label: 'Settings',
      items: [
        { title: t('nav.admin'), path: '/admins', icon: icon('lucide:shield') },
      ],
    },
  ];
};
