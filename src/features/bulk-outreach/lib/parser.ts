import * as XLSX from "xlsx";
import { ContactRow } from "../types";

export async function parseContactFile(file: File): Promise<ContactRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const contacts: ContactRow[] = [];

        jsonRows.forEach((row, idx) => {
          // Normalize column header keys (case-insensitive)
          const normalized: Record<string, string> = {};
          Object.keys(row).forEach((key) => {
            normalized[key.toLowerCase().trim()] = String(row[key] || "").trim();
          });

          const email =
            normalized.email ||
            normalized["contact email"] ||
            normalized["mail"] ||
            normalized["e-mail"] ||
            "";

          if (email && email.includes("@")) {
            contacts.push({
              id: `row_${Date.now()}_${idx}`,
              email: email.toLowerCase(),
              name: normalized.name || normalized["full name"] || normalized["first name"] || "",
              company: normalized.company || normalized["organization"] || normalized["firm"] || "",
              role: normalized.role || normalized["title font"] || normalized["job title font"] || normalized["position"] || "",
              status: "pending",
              failCount: 0,
            });
          }
        });

        resolve(contacts);
      } catch (err) {
        reject(new Error("Failed to parse CSV/XLSX contact file"));
      }
    };

    reader.onerror = () => reject(new Error("File reading error"));
    reader.readAsArrayBuffer(file);
  });
}
