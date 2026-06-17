'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { GenderDistribution } from '@/types';

interface GenderChartProps {
  data: GenderDistribution[];
}

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="fill-muted-foreground text-sm font-medium"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export function GenderChart({ data }: GenderChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const CenterLabel = ({
    viewBox,
  }: {
    viewBox?: { cx: number; cy: number };
  }) => {
    if (!viewBox) return null;
    const { cx, cy } = viewBox;

    return (
      <g>
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-3xl font-bold"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground text-xs"
        >
          Employés
        </text>
      </g>
    );
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: GenderDistribution; value: number }>;
  }) => {
    if (!active || !payload?.length) return null;

    const entry = payload[0];
    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';

    return (
      <div className="rounded-lg border bg-background/95 p-3 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.payload.color }}
          />
          <span className="text-sm font-semibold text-foreground">
            {entry.payload.name}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {entry.value} employés ({pct}%)
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par Genre</CardTitle>
        <CardDescription>Parité hommes/femmes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={70}
                outerRadius={105}
                paddingAngle={4}
                dataKey="value"
                label={renderCustomLabel}
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <CenterLabel />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
