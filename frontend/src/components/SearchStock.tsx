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
import StockChart from './charts/StockChart';

const SearchStock: React.FC = () => {
  const [ticker, setTicker] = useState('SPY');
  const [stockData, setStockData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState('1mo');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [additionalInfo, setAdditionalInfo] = useState<any>(null);

  // Load recent searches from localStorage and automatically search the most recent one
  useEffect(() => {
    const storedSearches = localStorage.getItem('recentSearches');
    if (storedSearches) {
      const recentSearchesArray = JSON.parse(storedSearches);
      setRecentSearches(recentSearchesArray);
      if (recentSearchesArray.length > 0) {
        const mostRecentTicker = recentSearchesArray[0]; // Get the most recent search
        setTicker(mostRecentTicker);
        handleSearch(undefined, mostRecentTicker); // Automatically search the most recent ticker
      }
    }
  }, []);

  // Modify the handleSearch function to take a ticker argument (optional)
  const handleSearch = async (event?: React.MouseEvent<HTMLButtonElement>, searchTicker?: string) => {
    const tickerToSearch = searchTicker || ticker; // Use provided ticker or current state ticker
    try {
      const stockResponse = await axios.get(`/stock/${tickerToSearch}`);
      setStockData(stockResponse.data.info);
      setAdditionalInfo(stockResponse.data.additional_info);

      const historyResponse = await axios.get(
        `/stock_history/${tickerToSearch}?range=${timeRange}`
      );
      setHistoricalData(historyResponse.data);

      // Update recent searches
      setRecentSearches((prev) => {
        const updated = [tickerToSearch, ...prev.filter((t) => t !== tickerToSearch)];
        const limited = updated.slice(0, 10);
        localStorage.setItem('recentSearches', JSON.stringify(limited)); // Save to localStorage
        return limited;
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
                  Current Price: ${stockData.currentPrice ? stockData.currentPrice : "--"}
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

              {/* Additional Stock Information in Grid */}
              {additionalInfo && (
                <Card style={{ marginTop: '20px', padding: '20px' }}>
                  <Typography
                    variant="h6"
                    style={{
                      marginBottom: '10px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#3f51b5',
                    }}
                  >
                    Additional Statistics
                  </Typography>
                  <Grid container spacing={2} style={{ marginTop: '20px' }}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">Previous Close</Typography>
                      <Typography variant="h6">{additionalInfo.previous_close || '--'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">Open</Typography>
                      <Typography variant="h6">{additionalInfo.open || '--'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">Market Cap</Typography>
                      <Typography variant="h6">${additionalInfo.market_cap || '--'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">Volume</Typography>
                      <Typography variant="h6">{additionalInfo.volume || '--'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">Day's Range</Typography>
                      <Typography variant="h6">{additionalInfo.days_range || '--'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">52 Week Range</Typography>
                      <Typography variant="h6">{additionalInfo['52_week_range'] || '--'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">P/E Ratio</Typography>
                      <Typography variant="h6">{additionalInfo.pe_ratio || '--'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">EPS</Typography>
                      <Typography variant="h6">{additionalInfo.eps || '--'}</Typography>
                    </Grid>
                  </Grid>
                </Card>
              )}
            </>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={3}>
          <Typography variant="h4" style={{ marginBottom: '20px' }}>Quote Lookup</Typography>
          <TextField
            label="Ticker Symbol"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            fullWidth
            style={{ marginBottom: '10px' }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={(event) => handleSearch(event)}
            fullWidth
          >
            Search
          </Button>

          {recentSearches.length > 0 && (
            <Card style={{ marginTop: '20px' }}>
              <CardContent>
                <Typography variant="h6" style={{ marginBottom: '10px' }}>Recent Searches</Typography>
                <List>
                  {recentSearches.map((searchTicker) => (
                    <ListItemButton
                      key={searchTicker}
                      onClick={() => {
                        setTicker(searchTicker);
                        handleSearch(undefined, searchTicker);
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s',
                      }}
                    >
                      <ListItemText
                        primary={searchTicker}
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </div>
  );
};

export default SearchStock;