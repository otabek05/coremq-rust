import Box from '@mui/material/Box';

type NavHeaderProps = {
  collapsed?: boolean;
};

export function NavHeader({ collapsed }: NavHeaderProps) {
  return (
    <Box sx={{ pt: collapsed ? 1.5 : 2, pb: 1.5, minHeight: collapsed ? 40 : 48 }} />
  );
}
