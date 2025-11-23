import { useRef, useState } from "react";
import NavigationMenu from "../components/NavigationMenu.jsx";
import handleUpload from "../js/handleUpload.js";
import Rest from "../js/rest.js";
import UploadFeedback from "../ui/UploadFeedback.jsx";
import UploadForm from "../ui/UploadForm.jsx";
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
  const [analyzeStatus, setAnalyzeStatus] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      const {
        insertedCount = 0,
        skippedCount = 0,
        updatedCount = 0,
      } = await Rest.fetchJson("/api/ingest-ps", {
        method: "POST",
      });
      const inserted = Number(insertedCount) || 0;
      const skipped = Number(skippedCount) || 0;
      const updated = Number(updatedCount) || 0;
      setIngestStatus({
        type: "success",
        message: `PS ingest complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`,
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

  // Handle analyzing PS data
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
      const missingData = result?.misAcct ?? {};
      const unknownData = result?.missCOA ?? {};

      const missingList = Array.isArray(missingData.missingAccounts)
        ? missingData.missingAccounts.filter(
            (item) => typeof item === "string" && item
          )
        : [];
      const unknownList = Array.isArray(unknownData.unknownAccounts)
        ? unknownData.unknownAccounts.filter(
            (item) => typeof item === "string" && item
          )
        : [];
      const missingCount =
        Number.isFinite(missingData.missingCount) &&
        missingData.missingCount >= 0
          ? missingData.missingCount
          : missingList.length;
      const unknownCount =
        Number.isFinite(unknownData.unknownCount) &&
        unknownData.unknownCount >= 0
          ? unknownData.unknownCount
          : unknownList.length;

      const details = [];
      if (missingList.length) {
        details.push(`Missing from COA: ${missingList.join(", ")}`);
      }
      if (unknownList.length) {
        details.push(`Unrecognized COA accounts: ${unknownList.join(", ")}`);
      }
      if (
        unknownList.length === 0 &&
        unknownData.status &&
        unknownData.status !== "ok"
      ) {
        details.push(`COA status: ${unknownData.status}`);
      }

      setAnalyzeStatus({
        type: "success",
        message: `Analysis complete: ${missingCount} missing in COA; ${unknownCount} unknown COA accounts.`,
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
          <h1 className="page__title">Upload PS CSV Spreadsheet</h1>
          <p className="page__description">Upload Status</p>
          <ul className="upload-guidance">
            <UploadFeedback
              uploadStatus={uploadStatus}
              clearStatus={clearStatus}
              ingestStatus={ingestStatus}
              analyzeStatus={analyzeStatus}
            />
          </ul>
        </section>
        <UploadForm
          fileInputRef={fileInputRef}
          setHasFileSelected={setHasFileSelected}
          hasFileSelected={hasFileSelected}
          handleClearClick={handleClearClick}
          isUploading={isUploading}
          isClearing={isClearing}
          isClearConfirmOpen={isClearConfirmOpen}
          handleClearConfirm={handleClearConfirm}
          handleClearCancel={handleClearCancel}
          handleUploadClick={handleUploadClick}
          handleAnalyzeClick={handleAnalyzeClick}
          isAnalyzing={isAnalyzing}
        />
      </main>
    </div>
  );
}
