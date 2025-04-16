import { useState, useCallback, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

const mapIndexToRoute: Record<number, string> = {
  0: '/bundled',
  1: '/lazy-loaded',
  2: '/lazy-loaded-with-error-boundary',
  3: '/lazy-loaded-with-retries',
  4: '/lazy-loaded-with-refresh',
  5: '/lazy-loaded-prefetch',
};

const mapRouteToIndex: Record<string, number> = {
  '/bundled': 0,
  '/lazy-loaded': 1,
  '/lazy-loaded-with-error-boundary': 2,
  '/lazy-loaded-with-retries': 3,
  '/lazy-loaded-with-refresh': 4,
  '/lazy-loaded-prefetch': 5,
};

const App = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const currentPath = location.pathname;
    const index = mapRouteToIndex[currentPath];
    if (index !== undefined) {
      setSelectedIndex(index);
    } else {
      setSelectedIndex(0); // Default to the first tab if the path doesn't match
    }
  }, [location.pathname]);

  const handleChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setSelectedIndex(newValue);
    navigate(`${mapIndexToRoute[newValue]}`);
  }, [navigate]);

  const prefetchBunny = useCallback(() => {
    import('./components/Bunny6.tsx');
  }, []);

  return (
    <>
      <h1>Lazy loading techniques demo</h1>
      <Box sx={{ width: '100%', height: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedIndex} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="Bundled" />
            <Tab label="Lazy Loaded" />
            <Tab label="Lazy Loaded With Error Boundary" />
            <Tab label="Lazy Loaded With Retries" />
            <Tab label="Lazy Loaded With Refresh" />
            <Tab label="Pre Fetch" onMouseEnter={prefetchBunny}/>
          </Tabs>
        </Box>
          <Outlet/>
      </Box>
    </>
  )
}

export default App
