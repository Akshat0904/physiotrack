import Sidebar from "@/components/Sidebar";
import CalendarView from "@/components/CalendarView";

export default function CalendarPage() {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        <CalendarView />
      </main>
    </div>
  );
}
