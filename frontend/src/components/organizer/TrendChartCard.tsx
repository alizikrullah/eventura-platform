import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OrganizerChartPoint } from "@/types/organizerDashboard";

interface TrendChartCardProps {
  title: string;
  description: string;
  data: OrganizerChartPoint[];
  dataKey: string;
  color: string;
  emptyMessage: string;
  formatValue?: (value: number) => string;
}

export default function TrendChartCard({
  title,
  description,
  data,
  dataKey,
  color,
  emptyMessage,
  formatValue,
}: TrendChartCardProps) {
  const hasAnyValue = data.some((item) => item.value > 0);
  const yAxisWidth = formatValue ? 104 : 56;

  return (
    <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      {!hasAnyValue ? (
        <div className="flex items-center justify-center px-6 text-center h-72 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: 12, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
              <YAxis
                width={yAxisWidth}
                tick={{ fill: "#334155", fontSize: 12 }}
                tickLine={{ stroke: "#94a3b8" }}
                axisLine={{ stroke: "#94a3b8" }}
                tickMargin={8}
                tickFormatter={
                  formatValue
                    ? (value) => formatValue(Number(value))
                    : undefined
                }
              />
              <Tooltip
                formatter={(value: number) =>
                  formatValue
                    ? formatValue(value)
                    : value.toLocaleString("id-ID")
                }
                contentStyle={{ borderRadius: "12px", borderColor: "#e5e7eb" }}
              />
              <Legend />
              <Bar
                dataKey="value"
                name={dataKey}
                fill={color}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
