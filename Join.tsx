import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API } from "../api";

/** Public landing page a referred visitor arrives on after clicking a referral link. */
export default function Join() {
  const [params] = useSearchParams();
  const code = params.get("ref") ?? "";
  const [campaign, setCampaign] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/public/ref/${encodeURIComponent(code)}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setCampaign(d.campaignName); })
      .catch((e) => setError(e.message));
  }, [code]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`${API}/api/public/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, ...form }),
    });
    const d = await res.json();
    if (!res.ok) return setError(d.error ?? "Something went wrong");
    setMessage(d.message);
    setDone(true);
  }

  return (
    <div className="mx-auto mt-20 max-w-sm rounded-lg bg-white p-6 shadow">
      <h1 className="mb-1 text-xl font-semibold">You've been referred!</h1>
      {campaign && <p className="mb-4 text-sm text-slate-500">Campaign: {campaign}</p>}
      {done ? (
        <p className="text-green-700">{message}. Thanks for signing up!</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="w-full rounded border border-slate-300 px-3 py-2" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700" disabled={!campaign}>Sign up</button>
        </form>
      )}
    </div>
  );
}
