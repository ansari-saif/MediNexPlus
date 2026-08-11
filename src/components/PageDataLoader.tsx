export function PageDataLoader({
  ui,
  label = "Loading...",
  minHeight = 180,
}: {
  ui?: string;
  label?: string;
  minHeight?: number;
}) {
  return (
    <div
      data-ui={ui}
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight,
        color: "#64748b",
        fontSize: 13,
        flex: 1,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          border: "3px solid #B3E0E0",
          borderTopColor: "#0E898F",
          borderRadius: "50%",
          animation: "page-data-spin 0.8s linear infinite",
          flexShrink: 0,
        }}
      />
      <style>{`@keyframes page-data-spin{to{transform:rotate(360deg)}}`}</style>
      {label}
    </div>
  );
}
