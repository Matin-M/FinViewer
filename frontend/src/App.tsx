import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button } from '@mui/material';
import SearchStock from './components/SearchStock';
import BuySellStock from './components/BuySellStock';
import Portfolio from './components/Portfolio';
import theme from './theme';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" style={{ flexGrow: 1 }}>
              SellScale Challenge
            </Typography>
            <Button color="inherit" component={Link} to="/">
              Search Stock
            </Button>
            <Button color="inherit" component={Link} to="/portfolio">
              Portfolio
            </Button>
          </Toolbar>
        </AppBar>
        <Routes>
          <Route path="/" element={<SearchStock />} />
          <Route path="/trade" element={<BuySellStock />} />
          <Route path="/portfolio" element={<Portfolio />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;