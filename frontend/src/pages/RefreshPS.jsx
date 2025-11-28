/*************************************************************
 * RefreshPS.jsx
 * Page for refreshing PocketSmith data using API calls.
 *
 *************************************************************/

import { useCallback, useEffect, useState } from "react";
import NavigationMenu from "../components/NavigationMenu.jsx";
import UploadFeedback from "../features/UploadFeedback.jsx";
import Rest from "../js/rest.js";
import "./PageLayout.css";

export default function RefreshPS() {
  const [lastIngestStatus, setLastIngestStatus] = useState(null);
  const [lastRefreshStatus, setLastRefreshStatus] = useState(null);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [analyzeStatus, setAnalyzeStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchLastIngest = useCallback(async () => {
    try {
      const appdata = await Rest.fetchJson("/api/getappdata");
      const records = Array.isArray(appdata) ? appdata : [];
      const parseDates = (field) =>
        records
          .map((item) => item?.[field])
          .map((date) => (date ? new Date(date) : null))
          .filter(
            (date) => date instanceof Date && !Number.isNaN(date.getTime())
          );
      const latestDate = (dates) =>
        dates.length === 0
          ? null
          : dates.reduce(
              (latest, current) => (current > latest ? current : latest),
              dates[0]
            );

      const latestIngest = latestDate(parseDates("lastIngest"));
      const latestRefresh = latestDate(parseDates("lastRefresh"));

      setLastIngestStatus(
        latestIngest
          ? {
              type: "info",
              message: `Last ingest: ${latestIngest.toLocaleString()}`,
            }
          : {
              type: "info",
              message: "No ingest has been recorded yet.",
            }
      );
      setLastRefreshStatus(
        latestRefresh
          ? {
              type: "info",
              message: `Last refresh: ${latestRefresh.toLocaleString()}`,
            }
          : {
              type: "info",
              message: "No refresh has been recorded yet.",
            }
      );
    } catch (error) {
      const message = error?.message ?? "Unable to load app data.";
      setLastIngestStatus({
        type: "error",
        message,
      });
      setLastRefreshStatus({
        type: "error",
        message,
      });
    }
  }, []);

  useEffect(() => {
    fetchLastIngest();
  }, [fetchLastIngest]);

  /**************************
   * Handle the refresh and analysis of PS data
   **************************/
  const updateLastRefreshTimestamp = async () => {
    const { modifiedCount = 0, upsertedCount = 0 } =
      (await Rest.fetchJson("/api/appdata/last-refresh", {
        method: "POST",
      })) ?? {};

    return modifiedCount + upsertedCount > 0;
  };

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
        mongoImportReport = 0,
        all = 0,
        mongoUpdateReport = 0,
      } = await Rest.fetchJson("/api/refresh-ps", {
        method: "POST",
      });

      const inserted = Number(mongoImportReport) || 0;
      const totalReceived = Number(all) || 0;
      const updated = Number(mongoUpdateReport) || 0;

      let lastRefreshUpdated = false;
      try {
        lastRefreshUpdated = await updateLastRefreshTimestamp();
      } catch (error) {
        console.error(
          "Failed to update lastRefresh timestamp in appdata",
          error
        );
      }

      setRefreshStatus({
        type: lastRefreshUpdated ? "success" : "warning",
        message: `PS refresh complete: ${totalReceived} received, ${inserted} inserted, ${updated} updated, ${
          totalReceived - inserted - updated
        } skipped.${
          lastRefreshUpdated ? "" : " Last refresh timestamp not saved."
        }`,
      });
      await fetchLastIngest();
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
              lastRefreshStatus={lastRefreshStatus}
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
