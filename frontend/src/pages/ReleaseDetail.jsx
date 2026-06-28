import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";

function toLocalDatetimeInputValue(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function ReleaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [release, setRelease] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const saveTimeout = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [releaseData, stepsData] = await Promise.all([
          api.getRelease(id),
          api.getSteps(),
        ]);
        if (cancelled) return;
        setRelease(releaseData);
        setSteps(stepsData);
        setName(releaseData.name);
        setDate(toLocalDatetimeInputValue(releaseData.date));
        setAdditionalInfo(releaseData.additionalInfo || "");
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function persist(patch) {
    setSaveState("saving");
    try {
      const updated = await api.updateRelease(id, patch);
      setRelease(updated);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch (err) {
      setError(err.message);
      setSaveState("idle");
    }
  }

  function scheduleSave(patch) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => persist(patch), 600);
  }

  function handleNameChange(value) {
    setName(value);
    scheduleSave({ name: value });
  }

  function handleDateChange(value) {
    setDate(value);
    scheduleSave({ date: new Date(value).toISOString() });
  }

  function handleInfoChange(value) {
    setAdditionalInfo(value);
    scheduleSave({ additionalInfo: value });
  }

  function handleStepToggle(stepId) {
    const nextSteps = { ...release.steps, [stepId]: !release.steps[stepId] };
    setRelease((prev) => ({ ...prev, steps: nextSteps }));
    persist({ steps: { [stepId]: nextSteps[stepId] } });
  }

  async function handleDelete() {
    if (!confirm("Delete this release? This cannot be undone.")) return;
    try {
      await api.deleteRelease(id);
      navigate("/");
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading…</div>;
  }

  if (error || !release) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-rose-600">
        {error || "Release not found."}
      </div>
    );
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
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-indigo-600 hover:underline">
                All releases
              </Link>
              <span className="text-slate-400">›</span>
              <span className="text-slate-500">{release.name}</span>
            </div>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-md"
            >
              Delete
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <StatusBadge status={release.status} />
              <span className="text-xs text-slate-400 h-4">
                {saveState === "saving" && "Saving…"}
                {saveState === "saved" && "Saved"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Release</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              {steps.map((step) => (
                <label
                  key={step.id}
                  className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(release.steps[step.id])}
                    onChange={() => handleStepToggle(step.id)}
                    className="mt-0.5 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className={release.steps[step.id] ? "line-through text-slate-400" : ""}>
                    {step.label}
                  </span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Additional remarks / tasks
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => handleInfoChange(e.target.value)}
                placeholder="Please enter any other important notes for the release"
                rows={6}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
