import { ApplicationItem } from "@/features/applications/types";

export function exportApplicationsToCSV(applications: ApplicationItem[]) {
  if (!applications.length) return;

  const headers = [
    "Application ID",
    "Company",
    "Role",
    "Contact Email",
    "Status",
    "Match Score",
    "Channel",
    "Created Date",
    "Sent Date",
    "Subject Line",
  ];

  const rows = applications.map((app) => [
    `"${app.id}"`,
    `"${(app.company || "").replace(/"/g, '""')}"`,
    `"${(app.role || "").replace(/"/g, '""')}"`,
    `"${(app.contactEmail || "").replace(/"/g, '""')}"`,
    `"${app.status}"`,
    `"${app.matchScore || 0}%"`,
    `"${app.channel || "single"}"`,
    `"${app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ""}"`,
    `"${app.sentAt ? new Date(app.sentAt).toLocaleDateString() : ""}"`,
    `"${(app.subject || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `applydesk-applications-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportApplicationsToJSON(applications: ApplicationItem[]) {
  if (!applications.length) return;

  const jsonContent = JSON.stringify(applications, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `applydesk-applications-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
