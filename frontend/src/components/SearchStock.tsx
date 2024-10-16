import React, { useState } from 'react';
import axios from '../axiosConfig';
import { TextField, Button, Typography, Card, CardContent } from '@mui/material';

const SearchStock: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState<any>(null);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`/stock/${ticker}`);
      setStockData(response.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      alert('Stock not found');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4">Search Stock</Typography>
      <TextField
        label="Ticker Symbol"
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        style={{ marginRight: '10px' }}
      />
      <Button variant="contained" color="primary" onClick={handleSearch}>
        Search
      </Button>
      {stockData && (
        <Card style={{ marginTop: '20px' }}>
          <CardContent>
            <Typography variant="h5">
              {stockData.longName} ({stockData.symbol})
            </Typography>
            <Typography variant="body1">Current Price: ${stockData.currentPrice}</Typography>
            {/* Display other relevant data if needed */}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchStock;