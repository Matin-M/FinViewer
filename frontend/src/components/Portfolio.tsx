import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { Typography, List, ListItem, ListItemText } from '@mui/material';

const Portfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await axios.get('/portfolio');
        setPortfolio(response.data);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        alert('Failed to load portfolio');
      }
    };
    fetchPortfolio();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4">Your Portfolio</Typography>
      <List>
        {Object.entries(portfolio).map(([ticker, quantity]) => (
          <ListItem key={ticker}>
            <ListItemText primary={`${ticker}: ${quantity} shares`} />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default Portfolio;