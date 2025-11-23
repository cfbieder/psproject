import { useState } from "react";
import BalanceDateSelector from "../ui/BalanceDateSelector.jsx";
import BalanceReport from "../ui/BalanceReport.jsx";
import NavigationMenu from "../components/NavigationMenu.jsx";
import Rest from "../js/rest.js";
import "./PageLayout.css";

export default function Balance() {
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [periodDates, setPeriodDates] = useState(() => {
    const today = getToday();
    return [today, today, today];
  });
  const [periodCount, setPeriodCount] = useState(1);
  const [balanceReports, setBalanceReports] = useState([]);
  const [reportError, setReportError] = useState("");
  const [isFetchingReport, setIsFetchingReport] = useState(false);

  const handlePeriodDateChange = (index, value) => {
    setPeriodDates((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleGenerateReport = async () => {
    setReportError("");
    setIsFetchingReport(true);
    const activeCount = Math.min(Math.max(periodCount ?? 1, 1), 3);
    const activeDates = periodDates.slice(0, activeCount);
    try {
      const reports = await Promise.all(
        activeDates.map((date) => Rest.fetchBalanceReport(date))
      );
      setBalanceReports(reports);
    } catch (error) {
      console.error("Failed to fetch balance report:", error);
      setReportError(error?.message ?? "Failed to fetch balance report");
    } finally {
      setIsFetchingReport(false);
    }
  };

  const activePeriodCount = Math.min(Math.max(periodCount ?? 1, 1), 3);

  return (
    <div className="page-shell">
      <NavigationMenu />
      <main className="page-main balance-grid">
        <div className="balance-layout-wrapper">
          <BalanceReport
            balanceReports={balanceReports}
            periodDates={periodDates}
            periodCount={activePeriodCount}
          />
        </div>
        <div className="balance-layout-holder">
          <BalanceDateSelector
            periodDates={periodDates}
            onPeriodDateChange={handlePeriodDateChange}
            onGenerateReport={handleGenerateReport}
            isLoading={isFetchingReport}
            error={reportError}
            report={balanceReports[0]}
            periodCount={activePeriodCount}
            onPeriodCountChange={setPeriodCount}
          />
        </div>
      </main>
    </div>
  );
}
