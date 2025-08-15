import { PieChart, Pie, Tooltip, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import type { Charts } from "../types";

export default function ChartsBoard({ charts }: { charts: Charts }) {
  const tiers = Object.entries(charts.tiers).map(([name, value]) => ({ name, value }));
  const counties = Object.entries(charts.top_counties).map(([name, count]) => ({ name, count }));
  const petTypes = Object.entries(charts.petition_types).map(([name, count]) => ({ name, count }));

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="p-4 rounded-2xl border">
        <h3 className="font-semibold mb-2">Tier distribution</h3>
        <PieChart width={320} height={240}>
          <Pie data={tiers} dataKey="value" nameKey="name" outerRadius={90} label />
          <Tooltip />
        </PieChart>
        <div className="text-sm text-gray-600 mt-2">Absentee rate: {(charts.absentee_rate*100).toFixed(1)}%</div>
      </div>

      <div className="p-4 rounded-2xl border">
        <h3 className="font-semibold mb-2">Top Counties</h3>
        <BarChart width={360} height={240} data={counties}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </div>

      <div className="p-4 rounded-2xl border">
        <h3 className="font-semibold mb-2">Petition Types</h3>
        <BarChart width={360} height={240} data={petTypes}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </div>

      <div className="md:col-span-3 p-4 rounded-2xl border">
        <h3 className="font-semibold mb-2">Filings by Month</h3>
        <LineChart width={920} height={260} data={charts.by_month}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" />
        </LineChart>
      </div>
    </div>
  );
}
