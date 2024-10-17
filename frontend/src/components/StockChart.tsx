import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Typography } from '@mui/material';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';

interface DataPoint {
  date: number; // Using timestamp
  close: number;
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

  // Determine the data range
  const dates = formattedData.map((item) => item.date);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);

  // Generate fixed number of ticks (e.g., 5)
  const NUMBER_OF_TICKS = 20;
  const tickInterval = (maxDate - minDate) / (NUMBER_OF_TICKS - 1);
  const ticks = Array.from({ length: NUMBER_OF_TICKS }, (_, index) => minDate + index * tickInterval);

  // Determine if the data spans multiple years
  const years = new Set(dates.map((timestamp) => new Date(timestamp).getFullYear()));
  const multipleYears = years.size > 1;

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

  return (
    <div style={{ width: '100%', height: 400 }}>
      <Typography variant="h6">{ticker} Stock Price History</Typography>
      <ResponsiveContainer>
        <LineChart data={formattedData}>
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
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            tick={{
              fontSize: theme.typography.body2.fontSize,
              fontFamily: theme.typography.fontFamily,
              fill: theme.palette.text.primary,
            }}
          />
          <Tooltip
            labelFormatter={(timestamp) => format(new Date(timestamp), 'MM/dd/yyyy')}
            formatter={(value: number) => `$${value.toFixed(2)}`}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.divider,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.body2.fontSize,
            }}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke={theme.palette.primary.main}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;