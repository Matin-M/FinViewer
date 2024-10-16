import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import SearchStock from './components/SearchStock';
import BuySellStock from './components/BuySellStock';
import Portfolio from './components/Portfolio';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

const App: React.FC = () => {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Stock Trading App
          </Typography>
          <Button color="inherit" component={Link} to="/">
            Search Stock
          </Button>
          <Button color="inherit" component={Link} to="/trade">
            Buy/Sell Stock
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
  );
};

export default App;