export type Role =
  | "PATIENT"
  | "ACCUEIL"
  | "IAO"
  | "INFIRMIER"
  | "URGENTISTE"
  | "ADMIN_HOPITAL"

export type Permission =
  | "view_own_record"
  | "edit_own_record"
  | "view_patient_identity"
  | "view_patient_allergies"
  | "view_full_medical_record"
  | "validate_record"
  | "register_visit"
  | "emergency_access"
  | "scan_qr"
  | "manage_staff"
  | "view_audit_log"
  | "view_admin_dashboard"

const PERMISSIONS: Record<Role, Permission[]> = {
  PATIENT: ["view_own_record", "edit_own_record"],
  ACCUEIL: ["view_patient_identity", "view_patient_allergies", "register_visit", "scan_qr"],
  IAO: [
    "view_patient_identity",
    "view_patient_allergies",
    "view_full_medical_record",
    "validate_record",
    "register_visit",
    "scan_qr",
  ],
  INFIRMIER: [
    "view_patient_identity",
    "view_patient_allergies",
    "view_full_medical_record",
    "register_visit",
    "scan_qr",
  ],
  URGENTISTE: [
    "view_patient_identity",
    "view_patient_allergies",
    "view_full_medical_record",
    "register_visit",
    "emergency_access",
    "scan_qr",
  ],
  ADMIN_HOPITAL: [
    "view_patient_identity",
    "view_patient_allergies",
    "view_full_medical_record",
    "manage_staff",
    "view_audit_log",
    "view_admin_dashboard",
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

export function isHospitalStaff(role: Role): boolean {
  return role !== "PATIENT"
}

export function getDashboardPath(role: Role): string {
  if (role === "PATIENT") return "/patient/dashboard"
  if (role === "ADMIN_HOPITAL") return "/admin/dashboard"
  return "/hopital/dashboard"
}

export const ROLE_LABELS: Record<Role, string> = {
  PATIENT: "Patient",
  ACCUEIL: "Accueil",
  IAO: "IAO",
  INFIRMIER: "Infirmier(e)",
  URGENTISTE: "Urgentiste",
  ADMIN_HOPITAL: "Admin hôpital",
}

export const SEVERITY_LABELS: Record<string, string> = {
  LEGERE: "Légère",
  MODEREE: "Modérée",
  GRAVE: "Grave",
  ANAPHYLAXIE: "Anaphylaxie",
}

export const SEVERITY_COLORS: Record<string, string> = {
  LEGERE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  MODEREE: "bg-orange-100 text-orange-800 border-orange-200",
  GRAVE: "bg-red-100 text-red-700 border-red-200",
  ANAPHYLAXIE: "bg-red-600 text-white border-red-700",
}
