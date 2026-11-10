import Link from "next/link";
import AuthForm from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-brand">CivicFlow</Link>
        <p className="auth-eyebrow">CITIZEN PORTAL</p>
        <h1>Welcome back</h1>
        <p className="auth-description">Sign in to report issues and track their progress.</p>
        <AuthForm mode="login" />
        <p className="auth-switch">
          Don&apos;t have an account? <Link href="/register">Create one</Link>
        </p>
        <Link href="/" className="auth-back">Back to CivicFlow</Link>
      </section>
    </main>
  );
}
