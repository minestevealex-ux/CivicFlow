"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Worker = {
  worker_id: number;
  name: string;
  department: string;
};

export default function IssueControls({
  issueId,
  currentStatus,
  currentPriority,
  workers,
}: {
  issueId: number;
  currentStatus: string;
  currentPriority: string;
  workers: Worker[];
}) {
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);
  const [workerId, setWorkerId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function saveChanges(nextStatus = status) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, priority }),
      });
      const data = await response.json();
      setMessage(data.message || "Update failed.");
      if (data.success) {
        setStatus(nextStatus);
        router.refresh();
      }
    } catch {
      setMessage("Could not update the issue. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function assignWorker() {
    if (!workerId) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/issues/${issueId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: Number(workerId) }),
      });
      const data = await response.json();
      setMessage(data.message || "Assignment failed.");
      if (data.success) {
        setWorkerId("");
        router.refresh();
      }
    } catch {
      setMessage("Could not assign the worker.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel admin-manage-panel" style={{ marginTop: 18 }}>
      <div className="panel-heading">
        <div>
          <h2>Manage issue</h2>
          <p>Update priority, workflow status or assign a municipal worker.</p>
        </div>
      </div>

      <div className="control-grid">
        <label>
          <span>Issue status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {["submitted", "under_review", "assigned", "in_progress", "resolved", "rejected"].map((s) => (
              <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Priority</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {["low", "medium", "high", "critical"].map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </label>

        <div className="admin-control-actions">
          <button
            disabled={busy || (status === currentStatus && priority === currentPriority)}
            onClick={() => saveChanges()}
          >
            Save changes
          </button>
          <button
            className="resolve-issue-button"
            disabled={busy || status === "resolved"}
            onClick={() => saveChanges("resolved")}
          >
            {status === "resolved" ? "Issue resolved" : "Mark as resolved"}
          </button>
        </div>

        <label>
          <span>Assign available worker</span>
          <select value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
            <option value="">Select a worker</option>
            {workers.map((w) => (
              <option key={w.worker_id} value={w.worker_id}>
                {w.name} — {w.department}
              </option>
            ))}
          </select>
          <button disabled={busy || !workerId} onClick={assignWorker}>
            Assign worker
          </button>
        </label>
      </div>

      {message && <p className="control-message" role="status">{message}</p>}
    </section>
  );
}
