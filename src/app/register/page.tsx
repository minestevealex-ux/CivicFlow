import Link from "next/link";
import AuthForm from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-brand">CivicFlow</Link>
        <p className="auth-eyebrow">JOIN YOUR COMMUNITY</p>
        <h1>Create an account</h1>
        <p className="auth-description">Register to submit civic complaints and follow their resolution.</p>
        <AuthForm mode="register" />
        <p className="auth-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
        <Link href="/" className="auth-back">Back to CivicFlow</Link>
      </section>
    </main>
  );
}
