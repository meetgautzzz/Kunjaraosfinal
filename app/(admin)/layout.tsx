export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0e27", color: "#e0f7ff" }}>
      {children}
    </div>
  );
}
