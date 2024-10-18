import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import PortfolioPerfChart from './charts/PortfolioPerfChart';


interface PortfolioItem {
  ticker: string;
  quantity: number;
  cost_basis: number;
  current_price: number;
  total_value: number;
  unrealized_pl: number;
}

interface PortfolioHistoryItem {
  date: string;
  total_value: number;
}

const Portfolio: React.FC = () => {
  const [portfolioDetails, setPortfolioDetails] = useState<PortfolioItem[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryItem[]>([]);
  const [transactionQuantities, setTransactionQuantities] = useState<{ [key: string]: number | '' }>({});
  const [transactionTypes, setTransactionTypes] = useState<{ [key: string]: 'buy' | 'sell' }>({});

  const handleTransaction = async (ticker: string) => {
    const quantity = transactionQuantities[ticker];
    const type = transactionTypes[ticker] || 'sell';
    if (!quantity) {
      alert('Please enter a quantity.');
      return;
    }

    try {
      await axios.post(`/${type}`, { ticker, quantity: Number(quantity) });
      alert(`Stock ${type} successful`);
      setTransactionQuantities((prev) => ({ ...prev, [ticker]: '' }));
    } catch (error) {
      console.error(`Error during ${type}:`, error);
      alert(`Failed to ${type} stock`);
    }
  };

  useEffect(() => {
    const fetchPortfolioDetails = async () => {
      try {
        const response = await axios.get('/portfolio_details');
        setPortfolioDetails(response.data);
      } catch (error) {
        console.error('Error fetching portfolio details:', error);
        alert('Failed to load portfolio details');
      }
    };

    const fetchPortfolioHistory = async () => {
      try {
        const response = await axios.get('/portfolio_history');
        setPortfolioHistory(response.data);
      } catch (error) {
        console.error('Error fetching portfolio history:', error);
        alert('Failed to load portfolio history');
      }
    };

    fetchPortfolioDetails();
    fetchPortfolioHistory();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4">Portfolio Performance</Typography>

      {/* Portfolio Performance Chart */}
      {portfolioHistory.length > 0 && (
        <PortfolioPerfChart
          data={portfolioHistory}
        />
      )}

      {/* Portfolio Table */}
      <Paper style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticker</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Cost Basis</TableCell>
              <TableCell align="right">Current Price</TableCell>
              <TableCell align="right">Total Value</TableCell>
              <TableCell align="right">Unrealized P&L</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {portfolioDetails.map((item) => (
              <TableRow key={item.ticker}>
                <TableCell component="th" scope="row">
                  {item.ticker}
                </TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">${item.cost_basis.toFixed(2)}</TableCell>
                <TableCell align="right">${item.current_price.toFixed(2)}</TableCell>
                <TableCell align="right">${item.total_value.toFixed(2)}</TableCell>
                <TableCell
                  align="right"
                  style={{ color: item.unrealized_pl >= 0 ? 'green' : 'red' }}
                >
                  ${item.unrealized_pl.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <FormControl style={{ marginRight: '10px', minWidth: '100px' }}>
                    <Select
                      value={transactionTypes[item.ticker] || 'sell'}
                      onChange={(e) =>
                        setTransactionTypes((prev) => ({
                          ...prev,
                          [item.ticker]: e.target.value as 'buy' | 'sell',
                        }))
                      }
                    >
                      <MenuItem value="buy">Buy</MenuItem>
                      <MenuItem value="sell">Sell</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={transactionQuantities[item.ticker] || ''}
                    onChange={(e) =>
                      setTransactionQuantities((prev) => ({
                        ...prev,
                        [item.ticker]: e.target.value ? Number(e.target.value) : '',
                      }))
                    }
                    style={{ marginRight: '10px', width: '80px' }}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleTransaction(item.ticker)}
                    style={{ height: '56px' }}
                  >
                    Execute
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
};

export default Portfolio;
