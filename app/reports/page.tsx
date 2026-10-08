import Sidebar from "@/components/Sidebar";
import ReportsView from "@/components/ReportsView";

export default function ReportsPage() {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        <ReportsView />
      </main>
    </div>
  );
}
