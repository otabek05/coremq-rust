import { useState, useCallback } from 'react';

import Typography from '@mui/material/Typography';


import { DashboardContent } from 'src/layouts/dashboard';



export function AdminView() {
  const [sortBy, setSortBy] = useState('latest');

  const handleSort = useCallback((newSort: string) => {
    setSortBy(newSort);
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      <Typography>This is gonna be connected clients</Typography>
    </DashboardContent>
  );
}
