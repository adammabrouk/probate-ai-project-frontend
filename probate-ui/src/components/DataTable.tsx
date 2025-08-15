import type { RecordRow } from "../types";

export default function DataTable({ rows }: { rows: RecordRow[] }) {
  return (
    <div className="overflow-auto border rounded-2xl">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {[
              "Score","Tier","County","Case","Owner","Address","City","State","ZIP",
              "Petitioner","Mailing","Petition Type","Petition Date","Death Date",
              "Absentee","Days Since Petition","Days Since Death","Holdings","Source","Why"
            ].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50 align-top">
              <td className="px-3 py-2 font-semibold">{r.score}</td>
              <td className="px-3 py-2 capitalize">{r.tier}</td>
              <td className="px-3 py-2">{r.county}</td>
              <td className="px-3 py-2">{r.case_no}</td>
              <td className="px-3 py-2">{r.owner_name}</td>
              <td className="px-3 py-2">{r.property_address}</td>
              <td className="px-3 py-2">{r.city}</td>
              <td className="px-3 py-2">{r.state}</td>
              <td className="px-3 py-2">{r.zip}</td>
              <td className="px-3 py-2">{r.party}</td>
              <td className="px-3 py-2">{r.mailing_address}</td>
              <td className="px-3 py-2">{r.petition_type}</td>
              <td className="px-3 py-2">{r.petition_date?.slice(0,10)}</td>
              <td className="px-3 py-2">{r.death_date?.slice(0,10)}</td>
              <td className="px-3 py-2">{r.absentee_flag ? "Yes" : "No"}</td>
              <td className="px-3 py-2">{r.days_since_petition}</td>
              <td className="px-3 py-2">{r.days_since_death}</td>
              <td className="px-3 py-2">{r.holdings_in_file}</td>
              <td className="px-3 py-2">
                <a className="text-blue-600 underline" href={r.source_url} target="_blank" rel="noreferrer">Link</a>
              </td>
              <td className="px-3 py-2 max-w-[360px]">{r.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
