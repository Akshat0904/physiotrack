import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        <Dashboard />
      </main>
    </div>
  );
}
