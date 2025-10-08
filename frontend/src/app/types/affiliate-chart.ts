
export const chartData = [
  { month: 'Tháng 1', conversions: 45 },
  { month: 'Tháng 2', conversions: 52 },
  { month: 'Tháng 3', conversions: 61 },
  { month: 'Tháng 4', conversions: 58 },
  { month: 'Tháng 5', conversions: 70 },
  { month: 'Tháng 6', conversions: 85 },
];

export const chartConfig = {
  data: chartData,
  xField: 'month',
  yField: 'conversions',
  smooth: true,
  color: '#1890ff',
  point: {
    size: 5,
    shape: 'circle',
  },
  label: {
    style: {
      fill: '#aaa',
    },
  },
};


export interface AffiliateStat {
  date: string;
  clicks: number;
  conversions: number;
  earnings: number;
}

export interface AffiliateData {
  programName: string;
  stats: AffiliateStat[];
}