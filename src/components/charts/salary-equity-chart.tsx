'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { SalaryEquity } from '@/types';

interface SalaryEquityChartProps {
  data: SalaryEquity[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatAxisCurrency = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k€`;
  }
  return `${value}€`;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  const hommes = payload.find((p) => p.dataKey === 'hommes')?.value ?? 0;
  const femmes = payload.find((p) => p.dataKey === 'femmes')?.value ?? 0;
  const gap = hommes > 0 ? (((hommes - femmes) / hommes) * 100).toFixed(1) : '0';
  const gapDirection = hommes > femmes ? 'en faveur des hommes' : 'en faveur des femmes';

  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-xl backdrop-blur-sm">
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.dataKey === 'hommes' ? 'Hommes' : 'Femmes'}:
          </span>
          <span className="font-medium text-foreground">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
      <div className="mt-2 border-t pt-2">
        <p className="text-xs text-muted-foreground">
          Écart:{' '}
          <span
            className="font-semibold"
            style={{
              color: Math.abs(Number(gap)) <= 2 ? '#10b981' : '#f59e0b',
            }}
          >
            {Math.abs(Number(gap))}%
          </span>{' '}
          {gapDirection}
        </p>
      </div>
    </div>
  );
};

export function SalaryEquityChart({ data }: SalaryEquityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parité Salariale</CardTitle>
        <CardDescription>
          Salaire moyen par département et genre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted/30"
                vertical={false}
              />
              <XAxis
                dataKey="dept"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                tickFormatter={formatAxisCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) =>
                  value === 'hommes' ? 'Hommes' : 'Femmes'
                }
              />
              <Bar
                dataKey="hommes"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="femmes"
                fill="#ec4899"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
