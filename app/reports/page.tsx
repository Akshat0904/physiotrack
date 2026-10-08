import Sidebar from "@/components/Sidebar";
import ReportsView from "@/components/ReportsView";

export default function ReportsPage() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1 }}>
        <ReportsView />
      </main>
    </div>
  );
}
