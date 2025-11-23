import { useState } from "react";
import BalanceDateSelector from "../ui/BalanceDateSelector.jsx";
import BalanceReport from "../ui/BalanceReport.jsx";
import NavigationMenu from "../components/NavigationMenu.jsx";
import Rest from "../js/rest.js";
import "./PageLayout.css";

export default function Balance() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [balanceReport, setBalanceReport] = useState(null);
  const [reportError, setReportError] = useState("");
  const [isFetchingReport, setIsFetchingReport] = useState(false);

  const handleGenerateReport = async () => {
    setReportError("");
    setIsFetchingReport(true);
    try {
      const report = await Rest.fetchBalanceReport(selectedDate);
      console.log("Balance report:", report);
      setBalanceReport(report);
    } catch (error) {
      console.error("Failed to fetch balance report:", error);
      setReportError(error?.message ?? "Failed to fetch balance report");
    } finally {
      setIsFetchingReport(false);
    }
  };

  return (
    <div className="page-shell">
      <NavigationMenu />
      <main className="page-main balance-grid">
        <div className="balance-layout-wrapper">
          <BalanceReport
            balanceReport={balanceReport}
            selectedDate={selectedDate}
          />
        </div>
        <div className="balance-layout-holder">
          <BalanceDateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onGenerateReport={handleGenerateReport}
            isLoading={isFetchingReport}
            error={reportError}
            report={balanceReport}
          />
        </div>
      </main>
    </div>
  );
}
