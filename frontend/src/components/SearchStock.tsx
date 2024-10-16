import React, { useState } from 'react';
import axios from '../axiosConfig';
import { TextField, Button, Typography, Card, CardContent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SearchStock: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const handleSearch = async () => {
    try {
      const stockResponse = await axios.get(`/stock/${ticker}`);
      setStockData(stockResponse.data);

      const historyResponse = await axios.get(`/stock_history/${ticker}`);
      setHistoricalData(historyResponse.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      alert('Stock not found');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4">Quote Lookup</Typography>
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
      {historicalData.length > 0 && (
        <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
          <Typography variant="h6">{ticker} Stock Price History</Typography>
          <ResponsiveContainer>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="close" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SearchStock;