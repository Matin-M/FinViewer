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
} from '@mui/material';
import PortfolioPerfChart from './PortfolioPerfChart';


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
      <Typography variant="h4">Your Portfolio</Typography>

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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
};

export default Portfolio;
