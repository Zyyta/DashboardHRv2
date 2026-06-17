'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import type { MonthlyAbsence } from '@/types';

interface AbsenceChartProps {
  data: MonthlyAbsence[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  const value = payload[0].value;
  let statusColor = '#10b981';
  let statusText = 'Normal';

  if (value >= 6) {
    statusColor = '#ef4444';
    statusText = 'Critique';
  } else if (value >= 3) {
    statusColor = '#f59e0b';
    statusText = 'Attention';
  }

  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-xl backdrop-blur-sm">
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Taux:</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <span style={{ color: statusColor }} className="text-xs font-medium">
          {statusText}
        </span>
      </div>
    </div>
  );
};

export function AbsenceChart({ data }: AbsenceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Taux d&apos;Absentéisme</CardTitle>
        <CardDescription>
          Évolution mensuelle avec seuils d&apos;alerte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradientAbsence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
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
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={3}
                stroke="#10b981"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: 'Seuil acceptable (3%)',
                  position: 'right',
                  fill: '#10b981',
                  fontSize: 10,
                  fontWeight: 500,
                }}
              />
              <ReferenceLine
                y={6}
                stroke="#ef4444"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: 'Seuil critique (6%)',
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontWeight: 500,
                }}
              />
              <Area
                type="monotone"
                dataKey="taux"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#gradientAbsence)"
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2, fill: '#8b5cf6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
