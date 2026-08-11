/** Preferred Sub Departments sidebar order + display labels (matches Configure catalog). */
export const SUBDEPT_CATALOG_ORDER: string[] = [
  "OPD",
  "IPD",
  "CLINICAL_PROCEDURE",
  "RECEPTION",
  "BILLING",
  "PHARMACY",
  "AMBULANCE",
  "HOUSEKEEPING",
  "PATHOLOGY",
  "BLOOD_BANK",
];

export const SUBDEPT_CATALOG_LABELS: Record<string, string> = {
  OPD: "OPD (Outpatient Department)",
  IPD: "IPD (Inpatient Department)",
  CLINICAL_PROCEDURE: "Clinical Procedures",
  RECEPTION: "Reception",
  BILLING: "Billing",
  PHARMACY: "Pharmacy",
  AMBULANCE: "Ambulance",
  HOUSEKEEPING: "Housekeeping",
  PATHOLOGY: "Pathology Lab",
  BLOOD_BANK: "Blood Bank",
  LABORATORY: "Laboratory",
  NURSING: "Nursing",
  RADIOLOGY: "Radiology",
  HR: "HR",
  ACCOUNTS: "Accounts",
  OT: "Operation Theatre (OT)",
  BIOMEDICAL: "Biomedical / Equipment",
  ECG: "ECG / EEG",
  ENDOSCOPY: "Endoscopy",
  EMERGENCY: "Emergency / Casualty",
  ICU: "ICU / NICU",
  GENERAL_MEDICINE: "General Medicine",
  PROCEDURE: "Procedure Room",
  CUSTOM: "Custom",
  OTHER: "Other",
};

export function subDeptLabel(sd: { type?: string; customName?: string | null; name?: string | null }) {
  return sd.customName || SUBDEPT_CATALOG_LABELS[sd.type || ""] || sd.name || "Sub-department";
}

export function sortSubDepts<T extends { type?: string; customName?: string | null; name?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = SUBDEPT_CATALOG_ORDER.indexOf(a.type || "");
    const bi = SUBDEPT_CATALOG_ORDER.indexOf(b.type || "");
    const aRank = ai === -1 ? 1000 : ai;
    const bRank = bi === -1 ? 1000 : bi;
    if (aRank !== bRank) return aRank - bRank;
    return subDeptLabel(a).localeCompare(subDeptLabel(b));
  });
}
