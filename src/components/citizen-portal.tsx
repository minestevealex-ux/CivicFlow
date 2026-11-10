"use client";

import { useState } from "react";
import Link from "next/link";

type Category = { category_id: number; name: string };
type Ward = { ward_id: number; name: string; zone: string };
type User = { id: number; name: string; email: string; role: "citizen" | "admin" };
type SimilarIssue = {
  issue_id: number;
  description: string;
  category: string;
  ward: string;
  status: string;
  priority: string;
  similarity: number | string;
};

type Complaint = {
  issue_id: number;
  description: string;
  category: string;
  ward: string;
  status: string;
  reported_at: string;
};

export default function CitizenPortal({
  categories,
  wards,
  user,
  complaints,
}: {
  categories: Category[];
  wards: Ward[];
  user: User | null;
  complaints: Complaint[];
}) {
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [wardId, setWardId] = useState("");
  const [anonymous, setAnonymous] = useState(!user);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsMessage, setGpsMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<number | null>(null);
  const [similarityChecked, setSimilarityChecked] = useState(false);
  const [similarMatches, setSimilarMatches] = useState<SimilarIssue[]>([]);
  const [similarityWarning, setSimilarityWarning] = useState("");

  function captureLocation() {
    if (!navigator.geolocation) {
      setGpsMessage("GPS is not supported by this browser.");
      return;
    }

    setGpsMessage("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsMessage("Location captured successfully.");
      },
      () => setGpsMessage("Location access denied or unavailable. Enter the address manually."),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function submitComplaint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      if (!similarityChecked) {
        const response = await fetch("/api/issues/similar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
        });

        const data = await response.json();

        setSimilarMatches(data.matches || []);
        setSimilarityWarning(data.warning || "");
        setSimilarityChecked(true);
        return;
      }

      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          address,
          categoryId,
          wardId,
          latitude,
          longitude,
          isAnonymous: anonymous,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not submit your complaint.");
        return;
      }

      setSuccess(data.issue.id);
      setDescription("");
      setAddress("");
      setCategoryId("");
      setWardId("");
      setLatitude(null);
      setLongitude(null);
      setGpsMessage("");
      setSimilarityChecked(false);
      setSimilarMatches([]);
      setSimilarityWarning("");
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function formatStatus(status: string) {
    return status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <main className="citizen-page">
      <header className="citizen-header">
        <Link href="/" className="citizen-logo">CivicFlow</Link>
        <nav className="citizen-nav">
          <a href="#report" className="citizen-nav-link">File a report</a>
          <a href="#services" className="citizen-nav-link">Our services</a>
          {user?.role === "admin" && <Link href="/admin" className="citizen-nav-link">Admin dashboard</Link>}
          {user ? (
            <>
              <span className="citizen-welcome">Hello, {user.name}</span>
              <button
                className="citizen-nav-logout"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/";
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="citizen-nav-link">Sign in</Link>
              <Link href="/register" className="citizen-nav-logout">Create account</Link>
            </>
          )}
        </nav>
      </header>

      <section className="citizen-hero">
        <p className="citizen-eyebrow">YOUR CITY. YOUR VOICE.</p>
        <h1>Make your neighbourhood better.</h1>
        
      </section>

      <div className="citizen-content">
        <section className="citizen-form-card" id="report">
          <div className="citizen-section-heading">
            <div>
              
              <h2>Report an issue</h2>
            </div>
            
          </div>

          {success !== null ? (
            <div className="citizen-success">
              <div className="citizen-success-mark">✓</div>
              <h3>Report submitted successfully</h3>
              <p>Your complaint reference number is <strong>#{success}</strong>.</p>
              <p>The municipal team can now review your report.</p>
              <button onClick={() => setSuccess(null)}>Submit another report</button>
            </div>
          ) : (
            <form className="citizen-form" onSubmit={submitComplaint}>
              <label>
                Issue category
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_id}>{category.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Describe the issue
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setSimilarityChecked(false);
                    setSimilarMatches([]);
                    setSimilarityWarning("");
                  }}
                  placeholder="Describe what happened, how severe it is, and any useful details..."
                  minLength={10}
                  maxLength={5000}
                  rows={5}
                  required
                />
                <span className="citizen-hint">{description.length}/5000 characters</span>
              </label>

              <div className="citizen-location-heading">
                <label>Location of the issue</label>
                <button type="button" onClick={captureLocation}>◎ Use my current location</button>
              </div>

              <p className="citizen-gps-message">{gpsMessage}</p>

              {latitude !== null && longitude !== null && (
                <p className="citizen-coordinates">
                  GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              )}

              <label>
                Street address or landmark
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Bellandur Lake, Bengaluru"
                  maxLength={500}
                  required
                />
              </label>

              <label>
                Ward
                <select value={wardId} onChange={(e) => setWardId(e.target.value)} required>
                  <option value="">Select your ward</option>
                  {wards.map((ward) => (
                    <option key={ward.ward_id} value={ward.ward_id}>
                      {ward.name} — {ward.zone}
                    </option>
                  ))}
                </select>
              </label>

              <label className="citizen-anonymous">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                />
                <span>
                  <strong>Submit anonymously</strong>
                  <small>Your account will not be linked to this complaint.</small>
                </span>
              </label>

              {!user && !anonymous && (
                <p className="citizen-inline-note">
                  <Link href="/login">Sign in</Link> to submit a report linked to your account.
                </p>
              )}

              {error && <p className="citizen-error">{error}</p>}

              {similarityChecked && (
                <section className="citizen-info-card" aria-live="polite">
                  <h3>Similar complaints</h3>
                  {similarityWarning && (
                    <p className="citizen-inline-note">{similarityWarning}</p>
                  )}
                  {similarMatches.length > 0 ? (
                    <>
                      <p>We found reports that may describe the same issue:</p>
                      <div className="citizen-history-list">
                        {similarMatches.map((match) => (
                          <article key={match.issue_id}>
                            <strong>Issue #{match.issue_id} · {match.category}</strong>
                            <p>{match.description}</p>
                            <small>
                              {match.ward} · {formatStatus(match.status)} ·
                              {" "}{Math.round(Number(match.similarity) * 100)}% similarity
                            </small>
                          </article>
                        ))}
                      </div>
                      <p className="citizen-hint">
                        These are possible matches, not confirmed duplicates.
                      </p>
                    </>
                  ) : (
                    <p>No similar complaints were found. You can continue.</p>
                  )}
                </section>
              )}

              <button className="citizen-submit" type="submit" disabled={loading}>
                {loading ? "Please wait..." : similarityChecked ? "Submit complaint anyway" : "Check for similar complaints"}
              </button>
            </form>
          )}
        </section>

        <aside className="citizen-side">
          <section className="citizen-info-card">
            <h3>How it works</h3>
            <ol>
              <li><span>1</span><div><strong>Report an issue</strong><p>Describe the problem and provide its location.</p></div></li>
              <li><span>2</span><div><strong>Municipal review</strong><p>The relevant department reviews your complaint.</p></div></li>
              <li><span>3</span><div><strong>Action and resolution</strong><p>Track progress until the issue is resolved.</p></div></li>
            </ol>
          </section>

          <section className="citizen-info-card citizen-tip">
            <h3>Help us respond faster</h3>
            <p>Include a nearby landmark, accurate address, and clear details about the problem.</p>
          </section>
        </aside>
      </div>

      {user && (
        <section className="citizen-history">
          <div className="citizen-section-heading">
            <div>
              <p className="citizen-eyebrow">YOUR ACTIVITY</p>
              <h2>Your reported issues</h2>
            </div>
            <span>{complaints.length} reports</span>
          </div>

          {complaints.length === 0 ? (
            <p className="citizen-empty">You haven't submitted any identified complaints yet.</p>
          ) : (
            <div className="citizen-history-list">
              {complaints.map((complaint) => (
                <article key={complaint.issue_id} className="citizen-history-item">
                  <div>
                    <strong>#{complaint.issue_id} · {complaint.category}</strong>
                    <p>{complaint.description}</p>
                    <small>{complaint.ward} · {new Date(complaint.reported_at).toLocaleDateString("en-IN")}</small>
                  </div>
                  <span className={`citizen-status status-${complaint.status}`}>
                    {formatStatus(complaint.status)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="citizen-services" id="services">
        <div className="citizen-services-inner">
          <p className="citizen-eyebrow">WHAT CIVICFLOW SUPPORTS</p>
          <h2>Services for better neighbourhoods</h2>
          <p className="citizen-services-intro">Report common civic problems and help municipal teams identify where action is needed.</p>
          <div className="citizen-services-grid">
            <article><span>01</span><h3>Road maintenance</h3><p>Report potholes, damaged roads and unsafe road conditions.</p></article>
            <article><span>02</span><h3>Waste management</h3><p>Flag uncollected garbage and overflowing public bins.</p></article>
            <article><span>03</span><h3>Water supply</h3><p>Report water leaks, pipe damage and supply disruptions.</p></article>
            <article><span>04</span><h3>Street lighting</h3><p>Identify broken street lights and poorly lit public areas.</p></article>
            <article><span>05</span><h3>Drainage</h3><p>Report blocked drains, flooding and waterlogging.</p></article>
            <article><span>06</span><h3>Issue tracking</h3><p>Follow the progress of complaints submitted through your account.</p></article>
          </div>
          <a href="#report" className="citizen-services-cta">Report an issue</a>
        </div>
      </section>

      <footer className="citizen-footer">CivicFlow · Building better neighbourhoods together</footer>
    </main>
  );
}
