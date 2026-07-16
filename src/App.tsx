import { useState } from "react";
import PixelOffice from "./components/PixelOffice";
import BudgetingDashboard from "./components/BudgetingDashboard";
import CriminologyLab from "./components/CriminologyLab";
import AdminAssistant from "./components/AdminAssistant";
import StockForecasts from "./components/StockForecasts";

type ViewType = "main" | "criminology" | "admin" | "stocks" | "budgeting";

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("main");

  if (currentView === "criminology") {
    return <CriminologyLab onNavigate={(view) => setCurrentView(view as ViewType)} />;
  }

  if (currentView === "admin") {
    return <AdminAssistant onNavigate={(view) => setCurrentView(view as ViewType)} />;
  }

  if (currentView === "stocks") {
    return <StockForecasts />;
  }

   if (currentView === "budgeting") {
     return <BudgetingDashboard />;
   }

  return (
    <PixelOffice
      config={{
        mockMode: true,
        mockToggleSpeed: 5000,
        showStatusBar: true,
        showNames: true,
        animationSpeed: 4,
        canvasScale: 1,
      }}
    />
  );
}

export default App;
