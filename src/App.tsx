import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import "./app.css";
import analyseFarm from './API/farmApi';

//  Types
interface TreeHealth {
  healthy: number;
  needs_care: number;
  needs_replacement: number;
}

interface AnalysisData {
  analysis_id: string;
  timestamp: string;
  location: string | null;
  land_acres: number | null;
  total_tree_count: number;
  tree_density_per_acre: number | null;
  confidence_score: number;
  canopy_coverage_pct: number | null;
  tree_health: TreeHealth;
  low_confidence: boolean;
  tree_species_guess: string | null;
  image_perspective: string | null;
  coverage_estimate: string | null;
  observations: string[];
  recommendations: string[];
  original_image_url: string;
  overlay_image_url: string | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: AnalysisData;
}

function niceDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color = "#3B6D11",
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// health bar
function HealthBar({ health }: { health: TreeHealth }) {
  const total = health.healthy + health.needs_care + health.needs_replacement;
  if (total === 0) return <p className="no-data">No tree health data available.</p>;

  const pct = (n: number) => ((n / total) * 100).toFixed(1);

  return (
    <div>
      <div className="health-bar-track">
        {health.healthy > 0 && (
          <div
            className="health-bar-segment"
            style={{ width: `${pct(health.healthy)}%`, background: "#4caf50" }}
            title={`Healthy: ${health.healthy}`}
          />
        )}
        {health.needs_care > 0 && (
          <div
            className="health-bar-segment"
            style={{ width: `${pct(health.needs_care)}%`, background: "#ff9800" }}
            title={`Needs care: ${health.needs_care}`}
          />
        )}
        {health.needs_replacement > 0 && (
          <div
            className="health-bar-segment"
            style={{ width: `${pct(health.needs_replacement)}%`, background: "#f44336" }}
            title={`Needs replacement: ${health.needs_replacement}`}
          />
        )}
      </div>
      <div className="health-legend">
        <span className="legend-dot" style={{ background: "#4caf50" }} />
        <span className="legend-text">Healthy &nbsp;<strong>{health.healthy}</strong></span>
        <span className="legend-dot" style={{ background: "#ff9800" }} />
        <span className="legend-text">Needs care &nbsp;<strong>{health.needs_care}</strong></span>
        <span className="legend-dot" style={{ background: "#f44336" }} />
        <span className="legend-text">Replace &nbsp;<strong>{health.needs_replacement}</strong></span>
      </div>
    </div>
  );
}

//   list section 
function ListSection({
  icon,
  title,
  items,
  color,
}: {
  icon: string;
  title: string;
  items: string[];
  color: string;
}) {
  if (!items.length) return null;
  return (
    <div className="list-section" style={{ borderLeft: `4px solid ${color}` }}>
      <p className="list-title" style={{ color }}>
        {icon} {title}
      </p>
      <ul className="list-ul">
        {items.map((item, i) => (
          <li key={i} className="list-li">{item}</li>
        ))}
      </ul>
    </div>
  );
}

//  Results display 
function AnalysisResults({
  result,
  previewUrl,
}: {
  result: ApiResponse;
  previewUrl: string | null;
}) {
  const d = result.data;
  const dateStr = niceDate(d.timestamp);

  return (
    <div className="results-wrap">
      {/* Banner */}
      <div className="banner">
        <span className="banner-icon"></span>
        <div>
          <p className="banner-title">Analysis Complete!</p>
          <p className="banner-sub">Done on {dateStr}</p>
        </div>
      </div>

      {/* Low confidence warning */}
      {d.low_confidence && (
        <div className="warning">
          <span className="warning-icon"></span>
          <div>
            <strong className="warning-title">Low confidence result</strong>
            <p className="warning-body">
              The AI was unable to analyse this image. This can happen with low-quality,
              blurry, or non-aerial photos. Please try again with a clearer overhead photo
              of your farm.
            </p>
          </div>
        </div>
      )}

      {/* Farm image */}
      {(previewUrl || d.original_image_url) && (
        <div className="image-wrap">
          <img
            src={previewUrl || d.original_image_url}
            alt="Your farm"
            className="farm-image"
          />
          <p className="image-caption"> Your farm photo</p>
        </div>
      )}

      {/* Key stats grid */}
      <p className="section-heading"> Your Farm Statistics</p>
      <div className="stats-grid">
        <StatCard
          icon=""
          label="Total Trees Counted"
          value={d.total_tree_count > 0 ? String(d.total_tree_count) : "Not detected"}
          color="#3B6D11"
        />
        <StatCard
          icon=""
          label="Farm Size"
          value={d.land_acres != null ? `${d.land_acres} acres` : "Unknown"}
          color="#5a8f2a"
        />
        <StatCard
          icon=""
          label="Canopy Cover"
          value={d.canopy_coverage_pct != null ? `${d.canopy_coverage_pct}%` : "Unknown"}
          sub="How much of the farm is covered by tree leaves"
          color="#2e7d32"
        />
        <StatCard
          icon=""
          label="Trees per Acre"
          value={d.tree_density_per_acre != null ? String(d.tree_density_per_acre) : "Unknown"}
          color="#558b2f"
        />
        <StatCard
          icon=""
          label="How Sure We Are"
          value={d.confidence_score > 0 ? `${(d.confidence_score * 100).toFixed(0)}%` : "Low"}
          sub="Higher is better"
          color={d.confidence_score > 0.6 ? "#3B6D11" : "#e65100"}
        />
        {d.tree_species_guess && (
          <StatCard
            icon=""
            label="Tree Type (Guess)"
            value={d.tree_species_guess}
            color="#6a994e"
          />
        )}
      </div>

      {/* Tree health */}
      <p className="section-heading"> Tree Health</p>
      <div className="card">
        <HealthBar health={d.tree_health} />
      </div>

      {/* Observations */}
      {d.observations.length > 0 && (
        <>
          <p className="section-heading">👀 What We Saw</p>
          <div className="card">
            <ListSection
              icon=""
              title="Observations"
              items={d.observations}
              color="#3B6D11"
            />
          </div>
        </>
      )}

      {/* Recommendations */}
      {d.recommendations.length > 0 && (
        <>
          <p className="section-heading"> What You Should Do</p>
          <div className="card">
            <ListSection
              icon=""
              title="Recommendations"
              items={d.recommendations}
              color="#2e7d32"
            />
          </div>
        </>
      )}

      {/* Extra details */}
      {(d.image_perspective || d.coverage_estimate) && (
        <>
          <p className="section-heading"> Extra Details</p>
          <div className="card">
            {d.image_perspective && (
              <p className="detail">
                <strong>Photo angle:</strong> {d.image_perspective}
              </p>
            )}
            {d.coverage_estimate && (
              <p className="detail">
                <strong>Coverage estimate:</strong> {d.coverage_estimate}
              </p>
            )}
          </div>
        </>
      )}

      {/* Reference ID */}
      <p className="ref-id">Reference ID: {d.analysis_id}</p>
    </div>
  );
}

//  Main App 
export default function App() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [county, setCounty] = useState("");
  const [acres, setAcres] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function applyFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) applyFile(e.target.files[0]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) applyFile(e.dataTransfer.files[0]);
  }

 const handleAnalyze = async () => {
  if (!image || !location.trim()) return;
  setLoading(true);
  setResult(null);
  setError(null);

  try {
    const data = await analyseFarm(image, location, county, acres);
    setResult(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unexpected error");
  } finally {
    setLoading(false);
  }
};

  const isReady = Boolean(image && location.trim());

  const dropzoneClass = [
    "dropzone",
    dragging ? "dragging" : "",
    image ? "has-image" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="page">
      <div className="card">

        {/* Header */}
        <div className="header">
          <span className="badge"> FarmGuard AI</span>
          <h1 className="title">Farm Analysis</h1>
          <p className="sub">Take a photo of your farm to get a full report</p>
        </div>

        {/* Upload */}
        <div className="section">
          <label className="label"> Your Farm Photo</label>
          <div
            className={dropzoneClass}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            {preview ? (
              <>
                <img src={preview} alt="Farm preview" className="preview" />
                <p className="file-name">✓ {image?.name}</p>
                <p className="change-hint">Tap to change photo</p>
              </>
            ) : (
              <>
                <p className="drop-icon"></p>
                <p className="drop-text">Tap here to choose a photo</p>
                <p className="drop-hint">Or drag and drop your image here</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Location */}
        <div className="section">
          <label className="label"> Where Is Your Farm?</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Moiben"
            className="input"
          />
          <p className="input-hint">Type the name of your town or village</p>
        </div>

        {/* County + Acres row */}
        <div className="two-col">
          <div>
            <label className="label"> County</label>
            <input
              type="text"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="e.g. Uasin Gishu"
              className="input"
            />
            <p className="input-hint">Your county (optional)</p>
          </div>
          <div>
            <label className="label"> Farm Size (acres)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={acres}
              onChange={(e) => setAcres(e.target.value)}
              placeholder="e.g. 5"
              className="input"
            />
            <p className="input-hint">How many acres (optional)</p>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleAnalyze}
          disabled={!isReady || loading}
          className={`btn ${!isReady || loading ? "disabled" : "ready"}`}
        >
          {loading ? (
            <>
              <span className="spinner" /> Please wait, analysing your farm…
            </>
          ) : (
            " Analyse My Farm"
          )}
        </button>

        {!isReady && !loading && (
          <p className="ready-hint">
            {!image && !location.trim()
              ? "Please add a photo and enter your location to continue."
              : !image
              ? "Please add a photo to continue."
              : "Please enter your farm location to continue."}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="error-box">
            <p className="error-title"> Something went wrong</p>
            <p className="error-msg">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && <AnalysisResults result={result} previewUrl={preview} />}

      </div>
    </div>
  );
}