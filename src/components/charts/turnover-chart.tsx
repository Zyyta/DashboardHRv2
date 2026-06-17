'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { MonthlyTurnover } from '@/types';

interface TurnoverChartProps {
  data: MonthlyTurnover[];
}

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
            {entry.dataKey === 'taux' ? 'Taux mensuel' : 'Moyenne 12 mois'}:
          </span>
          <span className="font-medium text-foreground">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
};

export function TurnoverChart({ data }: TurnoverChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Taux de Turnover</CardTitle>
        <CardDescription>
          Taux mensuel avec moyenne glissante sur 12 mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted/30"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                tickFormatter={(value: number) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) =>
                  value === 'taux' ? 'Taux mensuel' : 'Moyenne 12 mois'
                }
              />
              <ReferenceLine
                y={5}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: 'Objectif 5%',
                  position: 'right',
                  fill: '#f59e0b',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
              <Bar
                dataKey="taux"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                barSize={28}
                opacity={0.9}
              />
              <Line
                type="monotone"
                dataKey="moyenne"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: '#ec4899' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
