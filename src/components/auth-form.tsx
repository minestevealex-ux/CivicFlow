"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  mode: "login" | "register";
};

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register" ? { name, email, password } : { email, password }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Something went wrong.");
        return;
      }

      const meResponse = await fetch("/api/auth/me");
      const meData = await meResponse.json();
      const role = meData.user?.role || meData.role;

      router.push(role === "admin" ? "/admin" : "/");
      router.refresh();
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "register" && (
        <label>
          Full name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            required
            autoComplete="name"
          />
        </label>
      )}

      <label>
        Email address
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />
      </label>

      {error && <p className="auth-error">{error}</p>}

      <button className="auth-submit" type="submit" disabled={loading}>
        {loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
