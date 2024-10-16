// src/components/StockChart.tsx

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Typography } from '@mui/material';
import { format } from 'date-fns';

interface DataPoint {
  date: number; // Using timestamp
  close: number;
}

interface StockChartProps {
  data: DataPoint[];
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({ data, ticker }) => {
  // Convert date strings to timestamps
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).getTime(),
  }));

  // Log the formatted data for debugging
  console.log('Formatted Data:', formattedData);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <Typography variant="h6">{ticker} Stock Price History</Typography>
      <ResponsiveContainer>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
            tickFormatter={(timestamp) => format(new Date(timestamp), 'MM/dd/yyyy')}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            labelFormatter={(timestamp) => format(new Date(timestamp), 'MM/dd/yyyy')}
            formatter={(value: number) => `$${value.toFixed(2)}`}
          />
          <Line type="monotone" dataKey="close" stroke="#8884d8" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;