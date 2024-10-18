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
        <div style={{ backgroundColor: '#26229e', padding: '10px', border: '1px solid #ccc' }}>
          <p style={{ margin: 0 }}>{date}</p>
          <p style={{ margin: 0 }}>Total Value: ${total_value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tickFormatter={(timestamp) => format(new Date(timestamp), 'MM/dd')}
          interval="preserveStartEnd"
          minTickGap={50}
        />
        
        {/* Y-axis with currency formatting */}
        <YAxis
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        
        {/* Custom tooltip */}
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone" // Smoother line
          dataKey="total_value"
          stroke="#8884d8"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PortfolioPerfChart;