export default function EmptyState({ children = "Nothing here yet." }) {
  return <div className="wo-empty">{children}</div>;
}
