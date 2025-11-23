import { useRef, useState } from "react";
import NavigationMenu from "../components/NavigationMenu.jsx";
import handleUpload from "../js/handleUpload.js";
import Rest from "../js/rest.js";
import "./PageLayout.css";

export default function UploadPS() {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [ingestStatus, setIngestStatus] = useState(null);
  const [clearStatus, setClearStatus] = useState(null);

  //Handler Functions

  // Handle the upload and ingestion of PS data
  const handleUploadClick = async () => {
    setIngestStatus(null);
    const uploadSuccess = await handleUpload(
      fileInputRef,
      setIsUploading,
      setUploadStatus
    );
    if (!uploadSuccess) {
      return;
    }

    setIngestStatus({
      type: "info",
      message: "Ingesting PS data into MongoDB...",
    });

    try {
      const { insertedCount } = await Rest.fetchJson("/api/ingest-ps", {
        method: "POST",
      });
      const count = Number(insertedCount ?? 0);
      setIngestStatus({
        type: "success",
        message: `${count} PS transaction${count === 1 ? "" : "s"} ingested.`,
      });
    } catch (error) {
      setIngestStatus({
        type: "error",
        message: error?.message ?? "Failed to ingest PS data after upload.",
      });
    }
  };
  // todo: remove IP address says from confirmation and status messages below
  // Handle clearing all PS records
  const handleClearClick = async () => {
    if (
      !window.confirm(
        "This will permanently delete all imported PS records. Do you want to continue?"
      )
    ) {
      return;
    }

    setUploadStatus(null);
    setIngestStatus(null);
    setClearStatus({
      type: "info",
      message: "Clearing all PS records in MongoDB (clear operation)...",
    });
    setIsClearing(true);
    try {
      await Rest.fetchJson("/api/ingest-ps/clearall", {
        method: "POST",
      });
      setClearStatus({
        type: "success",
        message:
          "All PS records cleared from MongoDB (clear operation complete).",
      });
    } catch (error) {
      setClearStatus({
        type: "error",
        message: error?.message ?? "Failed to clear PS records from MongoDB.",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="page-shell">
      <NavigationMenu />
      <main className="page-main upload-grid">
        <section className="upload-panel">
          <h1 className="page__title">Upload PS CSV Spreadsheet</h1>
          <p className="page__description">Upload Status</p>
          <ul className="upload-guidance">
            {uploadStatus?.message && (
              <li>
                <p
                  className={`upload-feedback upload-feedback_${
                    uploadStatus.type ?? "info"
                  }`}
                >
                  {uploadStatus.message}
                </p>
              </li>
            )}
            {clearStatus?.message && (
              <li
                className={`upload-feedback upload-feedback_${
                  clearStatus.type ?? "info"
                }`}
              >
                {clearStatus.message}
              </li>
            )}
            {ingestStatus?.message && (
              <li
                className={`upload-feedback upload-feedback_${
                  ingestStatus.type ?? "info"
                }`}
              >
                {ingestStatus.message}
              </li>
            )}
          </ul>
        </section>
        <section className="upload-panel upload-form">
          <div className="upload-form-field">
            <label htmlFor="payrollFile">Payroll file</label>
            <input
              type="file"
              id="payrollFile"
              ref={fileInputRef}
              accept=".csv,text/csv"
            />
          </div>
          <div className="upload-actions">
            <button
              type="button"
              className="upload-submit"
              onClick={handleClearClick}
              disabled={isUploading || isClearing}
            >
              {isClearing ? "Clearing..." : "Clear PS records"}
            </button>
            <button
              type="button"
              className="upload-submit"
              onClick={handleUploadClick}
              disabled={isUploading || isClearing}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
            <button type="button" className="upload-submit">
              Analyze
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
