// src/components/SearchStock.tsx

import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import {
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItemText,
  ListItemButton,
  ButtonGroup,
} from '@mui/material';
import StockChart from './StockChart';

const SearchStock: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState('1mo');
  const [quantity, setQuantity] = useState<number | ''>(''); // New state for quantity

  const handleSearch = async () => {
    try {
      const stockResponse = await axios.get(`/stock/${ticker}`);
      setStockData(stockResponse.data);

      const historyResponse = await axios.get(
        `/stock_history/${ticker}?range=${timeRange}`
      );
      setHistoricalData(historyResponse.data);

      // Update recent searches
      setRecentSearches((prev) => {
        const updated = [ticker, ...prev.filter((t) => t !== ticker)];
        return updated.slice(0, 5);
      });
    } catch (error) {
      console.error('Error fetching stock data:', error);
      alert('Stock not found');
    }
  };

  const handleTransaction = async (type: 'buy') => {
    if (!ticker || !quantity) {
      alert('Please enter a ticker and quantity.');
      return;
    }

    try {
      await axios.post(`/${type}`, { ticker, quantity: Number(quantity) });
      alert(`Stock ${type} successful`);
      setTicker('');
      setQuantity('');
    } catch (error) {
      console.error(`Error during ${type}:`, error);
      alert(`Failed to ${type} stock`);
    }
  };

  useEffect(() => {
    if (ticker) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  return (
    <div style={{ padding: '20px' }}>
      <Grid container spacing={2}>
        {/* Left Column */}
        <Grid item xs={12} md={9}>
          {stockData && (
            <Card style={{ marginBottom: '20px' }}>
              <CardContent>
                <Typography variant="h5">
                  {stockData.longName} ({stockData.symbol})
                </Typography>
                <Typography variant="body1">
                  Current Price: ${stockData.currentPrice}
                </Typography>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                    style={{ marginRight: '10px' }}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleTransaction('buy')}
                  >
                    Buy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {historicalData.length > 0 && (
            <>
              {/* Time Range Selection */}
              <div style={{ marginBottom: '10px' }}>
                <Typography variant="body1">Select Time Range:</Typography>
                <ButtonGroup variant="outlined" color="primary">
                  {['1mo', '3mo', '6mo', '1y', '5y', 'max'].map((range) => (
                    <Button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      variant={timeRange === range ? 'contained' : 'outlined'}
                    >
                      {range.toUpperCase()}
                    </Button>
                  ))}
                </ButtonGroup>
              </div>
              <StockChart data={historicalData} ticker={ticker} />
            </>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={3}>
          <Typography variant="h4">Quote Lookup</Typography>
          <TextField
            label="Ticker Symbol"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            fullWidth
            style={{ marginBottom: '10px' }}
          />
          <Button variant="contained" color="primary" onClick={handleSearch} fullWidth>
            Search
          </Button>

          {recentSearches.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <Typography variant="h6">Recent Searches</Typography>
              <List>
                {recentSearches.map((searchTicker) => (
                  <ListItemButton
                    key={searchTicker}
                    onClick={() => {
                      setTicker(searchTicker);
                      handleSearch();
                    }}
                  >
                    <ListItemText primary={searchTicker} />
                  </ListItemButton>
                ))}
              </List>
            </div>
          )}
        </Grid>
      </Grid>
    </div>
  );
};

export default SearchStock;
