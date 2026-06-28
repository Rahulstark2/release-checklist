const STYLES = {
  planned: "bg-slate-100 text-slate-600",
  ongoing: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

const LABELS = {
  planned: "Planned",
  ongoing: "Ongoing",
  done: "Done",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.planned;
  const label = LABELS[status] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
