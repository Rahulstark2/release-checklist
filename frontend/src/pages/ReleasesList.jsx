import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import NewReleaseModal from "../components/NewReleaseModal";

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ReleasesList() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getReleases();
      setReleases(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(payload) {
    const created = await api.createRelease(payload);
    setReleases((prev) =>
      [...prev, created].sort((a, b) => new Date(b.date) - new Date(a.date))
    );
    setShowModal(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this release? This cannot be undone.")) return;
    try {
      await api.deleteRelease(id);
      setReleases((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">ReleaseCheck</h1>
          <p className="text-slate-500 mt-1">Your all-in-one release checklist tool</p>
        </header>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <span className="text-sm font-medium text-indigo-600">All releases</span>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-md"
            >
              New release
              <span className="text-base leading-none">+</span>
            </button>
          </div>

          {loading && <p className="text-center text-slate-400 py-10">Loading releases…</p>}
          {error && <p className="text-center text-rose-600 py-10">{error}</p>}

          {!loading && !error && releases.length === 0 && (
            <p className="text-center text-slate-400 py-10">
              No releases yet. Create your first one to get started.
            </p>
          )}

          {!loading && !error && releases.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b border-slate-200">
                  <th className="px-4 py-2 font-semibold">Release</th>
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2"></th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {releases.map((release) => (
                  <tr key={release.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-800">{release.name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(release.date)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={release.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/releases/${release.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(release.id)}
                        className="text-slate-500 hover:text-rose-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <NewReleaseModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
