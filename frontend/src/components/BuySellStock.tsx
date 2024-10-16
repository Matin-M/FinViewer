import React, { useState } from 'react';
import axios from '../axiosConfig';
import { TextField, Button, Typography } from '@mui/material';

const BuySellStock: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');

  const handleTransaction = async (type: 'buy' | 'sell') => {
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

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4">Buy/Sell Stock</Typography>
      <TextField
        label="Ticker Symbol"
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        style={{ marginRight: '10px' }}
      />
      <TextField
        label="Quantity"
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
        style={{ marginRight: '10px' }}
      />
      <Button variant="contained" color="primary" onClick={() => handleTransaction('buy')}>
        Buy
      </Button>
      <Button variant="contained" color="secondary" onClick={() => handleTransaction('sell')} style={{ marginLeft: '10px' }}>
        Sell
      </Button>
    </div>
  );
};

export default BuySellStock;