import Sidebar from "@/components/Sidebar";
import CalendarView from "@/components/CalendarView";

export default function CalendarPage() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1 }}>
        <CalendarView />
      </main>
    </div>
  );
}
