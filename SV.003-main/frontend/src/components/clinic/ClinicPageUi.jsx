import React from "react";
import { Button } from "../ui/button";

export function ClinicTableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="clinic-table-skeleton" style={{ "--cols": cols }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="clinic-table-skeleton-row">
          {Array.from({ length: cols }).map((__, j) => (
            <div
              key={j}
              className={`skeleton skeleton-text${j === 0 ? " medium" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ClinicEmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="clinic-empty-guiaa premium-card-lift">
      {Icon && (
        <div className="clinic-empty-guiaa-icon">
          <Icon size={28} aria-hidden />
        </div>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <Button type="button" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ClinicStatPill({ value, label, warn }) {
  return (
    <div className={`clinic-stat-pill premium-card-lift${warn ? " clinic-stat-pill--warn" : ""}`}>
      <span className="clinic-stat-value">{value}</span>
      <span className="clinic-stat-label">{label}</span>
    </div>
  );
}

export function ClinicStatusPill({ status, label }) {
  const normalized = (status || "").replace(/-/g, "_");
  return (
    <span className={`clinic-status-pill clinic-status-pill--${normalized}`}>
      {label || status}
    </span>
  );
}

export function clinicDialogClass(...extra) {
  return ["clinic-dialog-guiaa", ...extra.filter(Boolean)].join(" ");
}

export function ClinicReportsSkeleton() {
  return (
    <>
      <div className="clinic-report-kpi-skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="clinic-report-kpi-skeleton">
            <div className="skeleton skeleton-text short" />
            <div className="skeleton skeleton-text medium" />
            <div className="skeleton skeleton-block clinic-skeleton-chart" />
          </div>
        ))}
      </div>
      <div className="clinic-report-panels-skeleton">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="clinic-report-panel-skeleton">
            <div className="skeleton skeleton-text short" />
            {Array.from({ length: 4 }).map((__, j) => (
              <div key={j} className="skeleton skeleton-text" />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export function ClinicSettingsSkeleton() {
  return (
    <div className="clinic-settings-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="clinic-settings-card-skeleton">
          <div className="skeleton skeleton-text short" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text medium" />
        </div>
      ))}
    </div>
  );
}
