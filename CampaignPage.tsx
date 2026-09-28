import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, Campaign, Link as RefLink, linkUrl, Signup } from "../api";

interface Detail { campaign: Campaign; links: RefLink[]; recentSignups: Signup[] }

export default function CampaignPage() {
  const { id } = useParams();
  const [data, setData] = useState<Detail | null>(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const load = () => api<Detail>(`/campaigns/${id}`).then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]);

  async function addLink() {
    await api(`/campaigns/${id}/links`, { method: "POST", body: JSON.stringify({ label: label || undefined }) });
    setLabel("");
    load();
  }

  async function toggleStatus() {
    if (!data) return;
    const status = data.campaign.status === "active" ? "paused" : "active";
    await api(`/campaigns/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  function copy(code: string) {
    navigator.clipboard.writeText(linkUrl(code));
    setCopied(code);
    setTimeout(() => setCopied(""), 1500);
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading...</p>;
  const { campaign: c, links, recentSignups } = data;

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-indigo-600">&larr; All campaigns</Link>
      <div className="flex items-start justify-between rounded-lg bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">{c.name}</h1>
          <p className="text-sm text-slate-500">{c.description || "No description"}</p>
          <p className="mt-2 text-sm">
            {c.clicks} clicks · {c.signups} signups · {c.conversionRate}% conversion · ${c.rewardAmount.toFixed(2)} per signup · ${c.totalReward.toFixed(2)} credited
          </p>
        </div>
        <button onClick={toggleStatus} className="rounded border px-3 py-1 text-sm hover:bg-slate-50">
          {c.status === "active" ? "Pause" : "Activate"}
        </button>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Referral links</h2>
        <div className="mb-4 flex gap-2">
          <input className="flex-1 rounded border border-slate-300 px-3 py-2" placeholder="Label (e.g. Twitter, Newsletter)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <button onClick={addLink} className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Generate link</button>
        </div>
        <ul className="divide-y text-sm">
          {links.map((l) => (
            <li key={l.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{l.label ?? "Untitled link"}</p>
                <p className="text-slate-500">{linkUrl(l.code)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span>{l.clicks} clicks · {l.signups} signups</span>
                <button onClick={() => copy(l.code)} className="rounded border px-2 py-1 hover:bg-slate-50">{copied === l.code ? "Copied" : "Copy"}</button>
              </div>
            </li>
          ))}
          {links.length === 0 && <li className="py-4 text-center text-slate-400">No links yet.</li>}
        </ul>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Recent signups</h2>
        <ul className="divide-y text-sm">
          {recentSignups.map((s, i) => (
            <li key={i} className="flex justify-between py-2">
              <span>{s.name} ({s.email})</span>
              <span className="text-slate-500">+${s.rewardAmount.toFixed(2)} via {s.code}</span>
            </li>
          ))}
          {recentSignups.length === 0 && <li className="py-4 text-center text-slate-400">No signups yet.</li>}
        </ul>
      </div>
    </div>
  );
}
