import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, auth } from "../api";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const isLogin = mode === "login";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const body = isLogin ? { email: form.email, password: form.password } : form;
      const { token } = await api<{ token: string }>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
      auth.set(token);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const input = "w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  return (
    <div className="mx-auto mt-20 max-w-sm rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">{isLogin ? "Log in" : "Create account"}</h1>
      <form onSubmit={submit} className="space-y-3">
        {!isLogin && (
          <input className={input} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        )}
        <input className={input} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className={input} type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700">
          {isLogin ? "Log in" : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        {isLogin ? "No account? " : "Already registered? "}
        <Link className="text-indigo-600" to={isLogin ? "/register" : "/login"}>{isLogin ? "Sign up" : "Log in"}</Link>
      </p>
    </div>
  );
}
