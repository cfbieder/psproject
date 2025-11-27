import { useCallback, useEffect, useState } from "react";
import NavigationMenu from "../components/NavigationMenu.jsx";
import UploadFeedback from "../features/UploadFeedback.jsx";
import Rest from "../js/rest.js";
import "./PageLayout.css";

export default function RefreshPS() {
  const [lastIngestStatus, setLastIngestStatus] = useState(null);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [analyzeStatus, setAnalyzeStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchLastIngest = useCallback(async () => {
    try {
      const appdata = await Rest.fetchJson("/api/getappdata");
      const records = Array.isArray(appdata) ? appdata : [];
      const ingestDates = records
        .map((item) => item?.lastIngest)
        .map((date) => (date ? new Date(date) : null))
        .filter(
          (date) => date instanceof Date && !Number.isNaN(date.getTime())
        );

      if (ingestDates.length === 0) {
        setLastIngestStatus({
          type: "info",
          message: "No ingest has been recorded yet.",
        });
        return;
      }

      const latestIngest = ingestDates.reduce(
        (latest, current) => (current > latest ? current : latest),
        ingestDates[0]
      );

      setLastIngestStatus({
        type: "info",
        message: `Last ingest: ${latestIngest.toLocaleString()}`,
      });
    } catch (error) {
      setLastIngestStatus({
        type: "error",
        message: error?.message ?? "Unable to load last ingest date.",
      });
    }
  }, []);

  useEffect(() => {
    fetchLastIngest();
  }, [fetchLastIngest]);

  const handleRefreshClick = async () => {
    if (isRefreshing) {
      return;
    }

    setRefreshStatus({
      type: "info",
      message: "Refreshing PS data from PocketSmith...",
    });
    setAnalyzeStatus(null);
    setIsRefreshing(true);

    try {
      const {
        insertedCount = 0,
        skippedCount = 0,
        updatedCount = 0,
      } = await Rest.fetchJson("/api/refresh-ps", {
        method: "POST",
      });

      const inserted = Number(insertedCount) || 0;
      const skipped = Number(skippedCount) || 0;
      const updated = Number(updatedCount) || 0;

      setRefreshStatus({
        type: "success",
        message: `PS refresh complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`,
      });
      fetchLastIngest();
    } catch (error) {
      setRefreshStatus({
        type: "error",
        message: error?.message ?? "Failed to refresh PS data.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAnalyzeClick = async () => {
    if (isAnalyzing) {
      return;
    }

    setAnalyzeStatus({
      type: "info",
      message: "Running PS analysis...",
    });
    setIsAnalyzing(true);

    try {
      const result = await Rest.fetchJson("/api/analyze-ps");
      const {
        misAcct = {},
        missCOAact = {},
        misCat = {},
        missCOACat = {},
      } = result ?? {};

      const missingAccounts = Array.isArray(misAcct.missingAccounts)
        ? misAcct.missingAccounts.filter(
            (item) => typeof item === "string" && item
          )
        : [];
      const unknownAccounts = Array.isArray(missCOAact.unknownAccounts)
        ? missCOAact.unknownAccounts.filter(
            (item) => typeof item === "string" && item
          )
        : [];
      const missingCategories = Array.isArray(misCat.missingCategories)
        ? misCat.missingCategories.filter(
            (item) => typeof item === "string" && item
          )
        : [];
      const unknownCategories = Array.isArray(missCOACat.unknownCategories)
        ? missCOACat.unknownCategories.filter(
            (item) => typeof item === "string" && item
          )
        : [];

      const missingAccountCount =
        Number.isFinite(misAcct.missingCount) && misAcct.missingCount >= 0
          ? misAcct.missingCount
          : missingAccounts.length;
      const unknownAccountCount =
        Number.isFinite(missCOAact.unknownCount) && missCOAact.unknownCount >= 0
          ? missCOAact.unknownCount
          : unknownAccounts.length;
      const missingCategoryCount =
        Number.isFinite(misCat.missingCount) && misCat.missingCount >= 0
          ? misCat.missingCount
          : missingCategories.length;
      const unknownCategoryCount =
        Number.isFinite(missCOACat.unknownCount) && missCOACat.unknownCount >= 0
          ? missCOACat.unknownCount
          : unknownCategories.length;

      const details = [];
      if (missingAccounts.length) {
        details.push(
          `Missing from COA (accounts): ${missingAccounts.join(", ")}`
        );
      }
      if (unknownAccounts.length) {
        details.push(
          `Unrecognized COA accounts: ${unknownAccounts.join(", ")}`
        );
      }
      if (missingCategories.length) {
        details.push(
          `Missing from COA (categories): ${missingCategories.join(", ")}`
        );
      }
      if (unknownCategories.length) {
        details.push(
          `Unrecognized COA categories: ${unknownCategories.join(", ")}`
        );
      }
      if (
        unknownAccounts.length === 0 &&
        missCOAact.status &&
        missCOAact.status !== "ok"
      ) {
        details.push(`COA account status: ${missCOAact.status}`);
      }
      if (
        unknownCategories.length === 0 &&
        missCOACat.status &&
        missCOACat.status !== "ok"
      ) {
        details.push(`COA category status: ${missCOACat.status}`);
      }

      setAnalyzeStatus({
        type: "success",
        message: `Analysis complete: ${missingAccountCount} missing accounts, ${unknownAccountCount} unknown accounts; ${missingCategoryCount} missing categories, ${unknownCategoryCount} unknown categories.`,
        details,
      });
    } catch (error) {
      setAnalyzeStatus({
        type: "error",
        message: error?.message ?? "Failed to analyze PS data.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="page-shell">
      <NavigationMenu />
      <main className="page-main upload-grid">
        <section className="upload-panel">
          <h1 className="page__title">Refresh PS Data</h1>
          <p className="page__description">
            Pull the latest PocketSmith transactions and sync them with your
            MongoDB store.
          </p>
          <ul className="upload-guidance">
            <UploadFeedback
              lastIngestStatus={lastIngestStatus}
              uploadStatus={refreshStatus}
              clearStatus={null}
              ingestStatus={null}
              analyzeStatus={analyzeStatus}
            />
          </ul>
        </section>
        <section className="upload-panel upload-form">
          <div className="upload-form-field">
            <p>
              Kick off a refresh to download new or updated transactions and
              import them into the database. Run analysis afterward to verify
              chart mappings.
            </p>
          </div>
          <div className="upload-actions">
            <button
              type="button"
              className="upload-submit"
              onClick={handleRefreshClick}
              disabled={isRefreshing || isAnalyzing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh PS data"}
            </button>
            <button
              type="button"
              className="upload-submit"
              onClick={handleAnalyzeClick}
              disabled={isRefreshing || isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze PS data"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
