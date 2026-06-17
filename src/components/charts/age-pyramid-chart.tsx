'use client';

import {
  BarChart,
  Bar,
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
import type { AgePyramidData } from '@/types';

interface AgePyramidChartProps {
  data: AgePyramidData[];
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
      <p className="mb-2 text-sm font-semibold text-foreground">
        Tranche {label}
      </p>
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
            {Math.abs(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function AgePyramidChart({ data }: AgePyramidChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pyramide des Âges</CardTitle>
        <CardDescription>
          Répartition par tranche d&apos;âge et genre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              stackOffset="sign"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted/30"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                tickFormatter={(value: number) => `${Math.abs(value)}`}
              />
              <YAxis
                type="category"
                dataKey="tranche"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={50}
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
              <ReferenceLine x={0} className="stroke-muted-foreground/50" />
              <Bar
                dataKey="femmes"
                fill="#ec4899"
                radius={[4, 0, 0, 4]}
                barSize={16}
              />
              <Bar
                dataKey="hommes"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
