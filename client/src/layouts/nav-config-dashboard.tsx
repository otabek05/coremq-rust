import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

const icon = (name: string) => <Icon icon={name} width={22} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const navData: NavItem[] = [];

export const useNavData = () => {
  const { t } = useTranslation();

  return [
    { title: t('nav.home'), path: '/', icon: icon('solar:home-2-bold') },
    { title: t('nav.sessions'), path: '/sessions', icon: icon('mdi:account-group') },
    { title: t('nav.listeners'), path: '/listeners', icon: icon('mdi:server-network') },
    { title: t('nav.admin'), path: '/admins', icon: icon('mdi:shield-account') },
    { title: t('nav.webhook'), path: '/webhooks', icon: icon('mdi:webhook') },
    { title: t('nav.websocket'), path: '/websockets', icon: icon('mdi:connection') },
  ];
};
