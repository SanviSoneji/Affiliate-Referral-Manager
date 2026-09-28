import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Campaign, Summary } from "../api";

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg bg-white p-4 shadow-sm">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="text-2xl font-semibold">{value}</p>
  </div>
);

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<Summary>({ clicks: 0, signups: 0, totalReward: 0, conversionRate: 0 });
  const [form, setForm] = useState({ name: "", description: "", rewardAmount: "5" });
  const [error, setError] = useState("");

  const load = () =>
    api<{ campaigns: Campaign[]; summary: Summary }>("/campaigns")
      .then((d) => { setCampaigns(d.campaigns); setSummary(d.summary); })
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/campaigns", {
        method: "POST",
        body: JSON.stringify({ ...form, rewardAmount: Number(form.rewardAmount) }),
      });
      setForm({ name: "", description: "", rewardAmount: "5" });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const input = "rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total clicks" value={summary.clicks} />
        <Stat label="Signups" value={summary.signups} />
        <Stat label="Conversion" value={`${summary.conversionRate}%`} />
        <Stat label="Rewards credited" value={`$${summary.totalReward.toFixed(2)}`} />
      </div>

      <form onSubmit={create} className="flex flex-wrap gap-3 rounded-lg bg-white p-4 shadow-sm">
        <input className={`${input} flex-1`} placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={`${input} flex-1`} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className={`${input} w-28`} type="number" min="0" step="0.01" placeholder="Reward $" value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })} required />
        <button className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Create campaign</button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3">Campaign</th><th className="p-3">Status</th><th className="p-3">Clicks</th>
              <th className="p-3">Signups</th><th className="p-3">Conv.</th><th className="p-3">Reward</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3"><Link className="font-medium text-indigo-600" to={`/campaigns/${c.id}`}>{c.name}</Link></td>
                <td className="p-3">{c.status}</td>
                <td className="p-3">{c.clicks}</td>
                <td className="p-3">{c.signups}</td>
                <td className="p-3">{c.conversionRate}%</td>
                <td className="p-3">${c.totalReward.toFixed(2)}</td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr><td className="p-6 text-center text-slate-400" colSpan={6}>No campaigns yet. Create your first one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
