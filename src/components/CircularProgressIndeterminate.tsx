import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function CircularIndeterminate() {
  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '80vh', justifyContent: 'center', alignItems: 'center' }}>
      <CircularProgress  size="5rem"/>
    </Box>
  );
}