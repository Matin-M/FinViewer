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
import { format } from 'date-fns';

interface PortfolioChartProps {
  data: { date: string; total_value: number }[];
}

const PortfolioPerfChart: React.FC<PortfolioChartProps> = ({ data }) => {
  // Format the data for recharts
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).getTime(),
  }));
 
  // Custom tooltip to display date and value
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = format(new Date(label), 'MM/dd/yyyy');
      const { total_value } = payload[0].payload;

      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
          <p>{date}</p>
          <p>Total Value: ${total_value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(timestamp) => format(new Date(timestamp), 'MM/dd')}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="total_value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PortfolioPerfChart;