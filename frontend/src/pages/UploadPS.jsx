import { useRef, useState } from "react";
import NavigationMenu from "../components/NavigationMenu.jsx";
import handleUpload from "../js/handleUpload.js";
import Rest from "../js/rest.js";
import ConfirmationDialog from "../ui/ConfirmationDialog.jsx";
import "./PageLayout.css";

export default function UploadPS() {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [ingestStatus, setIngestStatus] = useState(null);
  const [clearStatus, setClearStatus] = useState(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [hasFileSelected, setHasFileSelected] = useState(false);

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setHasFileSelected(false);
    } catch (error) {
      setIngestStatus({
        type: "error",
        message: error?.message ?? "Failed to ingest PS data after upload.",
      });
    }
  };
  // Handle clearing all PS records
  const handleClearClick = () => {
    if (isClearing) {
      return;
    }
    setIsClearConfirmOpen(true);
  };

  // Confirm clearing all PS records
  const handleClearConfirm = async () => {
    setIsClearConfirmOpen(false);

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

  // Cancel clearing all PS records
  const handleClearCancel = () => {
    if (isClearing) {
      return;
    }
    setIsClearConfirmOpen(false);
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
            <label htmlFor="psFile">PS file</label>
            <input
              type="file"
              id="psFile"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={(event) =>
                setHasFileSelected((event.target.files?.length ?? 0) > 0)
              }
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
            {isClearConfirmOpen && !isClearing && (
              <ConfirmationDialog
                message="This will permanently delete all imported PS records. Confirming will wipe every record from MongoDB."
                onConfirm={handleClearConfirm}
                onCancel={handleClearCancel}
                confirmLabel="Confirm clear"
                cancelLabel="Cancel"
              />
            )}
            <button
              type="button"
              className="upload-submit"
              onClick={handleUploadClick}
              disabled={isUploading || isClearing || !hasFileSelected}
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
