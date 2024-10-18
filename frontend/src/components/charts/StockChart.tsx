// src/components/StockChart.tsx

import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
  Bar,
} from 'recharts';
import { Typography } from '@mui/material';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';

interface DataPoint {
  date: number; // Using timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma?: number; // Moving Average
}

interface StockChartProps {
  data: DataPoint[];
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({ data, ticker }) => {
  const theme = useTheme();

  // Convert date strings to timestamps
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).getTime(),
  }));

  // Calculate Moving Average (e.g., 10-day MA)
  const calculateMovingAverage = (data: DataPoint[], period: number) => {
    return data.map((item, index, array) => {
      if (index < period - 1) {
        return { ...item, ma: null };
      }
      const sum = array
        .slice(index - period + 1, index + 1)
        .reduce((acc, curr) => acc + curr.close, 0);
      return { ...item, ma: sum / period };
    });
  };

  const dataWithMA = calculateMovingAverage(formattedData, 10);

  // Determine if the data spans multiple years
  const dates = dataWithMA.map((item) => item.date);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const years = new Set(dates.map((timestamp) => new Date(timestamp).getFullYear()));
  const multipleYears = years.size > 1;

  // Generate fixed number of ticks (e.g., 5)
  const NUMBER_OF_TICKS = 5;
  const tickInterval = (maxDate - minDate) / (NUMBER_OF_TICKS - 1);
  const ticks = Array.from({ length: NUMBER_OF_TICKS }, (_, index) => minDate + index * tickInterval);

  // Custom Axis Tick
  const CustomAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const timestamp = payload.value;
    const label = format(new Date(timestamp), multipleYears ? 'MM/dd/yyyy' : 'MM/dd');

    return (
      <g transform={`translate(${x},${y}) rotate(-45)`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          style={{
            fontSize: theme.typography.body2.fontSize,
            fontFamily: theme.typography.fontFamily,
            fill: theme.palette.text.primary,
          }}
        >
          {label}
        </text>
      </g>
    );
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = format(new Date(label), 'MM/dd/yyyy');
      const { open, high, low, close, volume } = payload[0].payload;

      return (
        <div
          style={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            padding: '10px',
          }}
        >
          <Typography variant="body2">{date}</Typography>
          <Typography variant="body2">Open: ${open.toFixed(2)}</Typography>
          <Typography variant="body2">High: ${high.toFixed(2)}</Typography>
          <Typography variant="body2">Low: ${low.toFixed(2)}</Typography>
          <Typography variant="body2">Close: ${close.toFixed(2)}</Typography>
          <Typography variant="body2">Volume: {volume.toLocaleString()}</Typography>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ width: '100%', height: 500 }}>
      <Typography variant="h6">{ticker} Stock Price History</Typography>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={dataWithMA}>
          <defs>
            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
              <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="date"
            type="number"
            domain={[minDate, maxDate]}
            scale="time"
            ticks={ticks}
            tick={<CustomAxisTick />}
            height={80}
          />
          <YAxis
            yAxisId="left"
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            tick={{
              fontSize: theme.typography.body2.fontSize,
              fontFamily: theme.typography.fontFamily,
              fill: theme.palette.text.primary,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={['auto', 'auto']}
            tickFormatter={(value) => `${(value / 1e6).toFixed(1)}M`}
            tick={{
              fontSize: theme.typography.body2.fontSize,
              fontFamily: theme.typography.fontFamily,
              fill: theme.palette.text.primary,
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span style={{ color: theme.palette.text.primary }}>{value}</span>
            )}
          />
          <Bar
            yAxisId="right"
            dataKey="volume"
            fill={theme.palette.secondary.main}
            opacity={0.3}
            barSize={20}
            name="Volume"
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="close"
            stroke={theme.palette.primary.main}
            fillOpacity={1}
            fill="url(#colorClose)"
            dot={false}
            name="Price"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ma"
            stroke={theme.palette.secondary.main}
            dot={false}
            name="10-Day MA"
          />
          <Brush />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;