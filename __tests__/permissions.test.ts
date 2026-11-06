import { hasPermission, getDashboardPath, isHospitalStaff } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"

describe("hasPermission", () => {
  it("PATIENT can only view and edit own record", () => {
    expect(hasPermission("PATIENT", "view_own_record")).toBe(true)
    expect(hasPermission("PATIENT", "edit_own_record")).toBe(true)
    expect(hasPermission("PATIENT", "view_patient_identity")).toBe(false)
    expect(hasPermission("PATIENT", "emergency_access")).toBe(false)
  })

  it("ACCUEIL can see identity and allergies, register visits, scan QR", () => {
    expect(hasPermission("ACCUEIL", "view_patient_identity")).toBe(true)
    expect(hasPermission("ACCUEIL", "view_patient_allergies")).toBe(true)
    expect(hasPermission("ACCUEIL", "register_visit")).toBe(true)
    expect(hasPermission("ACCUEIL", "scan_qr")).toBe(true)
    expect(hasPermission("ACCUEIL", "view_full_medical_record")).toBe(false)
    expect(hasPermission("ACCUEIL", "emergency_access")).toBe(false)
    expect(hasPermission("ACCUEIL", "validate_record")).toBe(false)
  })

  it("IAO can validate records and see full record", () => {
    expect(hasPermission("IAO", "validate_record")).toBe(true)
    expect(hasPermission("IAO", "view_full_medical_record")).toBe(true)
    expect(hasPermission("IAO", "emergency_access")).toBe(false)
  })

  it("INFIRMIER can see full record but cannot validate or use emergency access", () => {
    expect(hasPermission("INFIRMIER", "view_full_medical_record")).toBe(true)
    expect(hasPermission("INFIRMIER", "register_visit")).toBe(true)
    expect(hasPermission("INFIRMIER", "validate_record")).toBe(false)
    expect(hasPermission("INFIRMIER", "emergency_access")).toBe(false)
  })

  it("URGENTISTE can use emergency access but cannot validate or manage staff", () => {
    expect(hasPermission("URGENTISTE", "emergency_access")).toBe(true)
    expect(hasPermission("URGENTISTE", "view_full_medical_record")).toBe(true)
    expect(hasPermission("URGENTISTE", "register_visit")).toBe(true)
    expect(hasPermission("URGENTISTE", "validate_record")).toBe(false)
    expect(hasPermission("URGENTISTE", "manage_staff")).toBe(false)
  })

  it("ADMIN_HOPITAL can manage staff and view audit log but cannot register visits", () => {
    expect(hasPermission("ADMIN_HOPITAL", "manage_staff")).toBe(true)
    expect(hasPermission("ADMIN_HOPITAL", "view_audit_log")).toBe(true)
    expect(hasPermission("ADMIN_HOPITAL", "view_admin_dashboard")).toBe(true)
    expect(hasPermission("ADMIN_HOPITAL", "register_visit")).toBe(false)
    expect(hasPermission("ADMIN_HOPITAL", "emergency_access")).toBe(false)
    expect(hasPermission("ADMIN_HOPITAL", "validate_record")).toBe(false)
  })
})

describe("getDashboardPath", () => {
  it("routes patients to patient dashboard", () => {
    expect(getDashboardPath("PATIENT")).toBe("/patient/dashboard")
  })

  it("routes admin to admin dashboard", () => {
    expect(getDashboardPath("ADMIN_HOPITAL")).toBe("/admin/dashboard")
  })

  it("routes all hospital staff to hopital dashboard", () => {
    const staffRoles: Role[] = ["ACCUEIL", "IAO", "INFIRMIER", "URGENTISTE"]
    for (const role of staffRoles) {
      expect(getDashboardPath(role)).toBe("/hopital/dashboard")
    }
  })
})

describe("isHospitalStaff", () => {
  it("returns false for PATIENT", () => {
    expect(isHospitalStaff("PATIENT")).toBe(false)
  })

  it("returns true for all hospital roles", () => {
    const roles: Role[] = ["ACCUEIL", "IAO", "INFIRMIER", "URGENTISTE", "ADMIN_HOPITAL"]
    for (const role of roles) {
      expect(isHospitalStaff(role)).toBe(true)
    }
  })
})
