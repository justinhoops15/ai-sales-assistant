// Common occupations list for FFL Intelligence occupation search
export const OCCUPATIONS = [
  'Accountant / CPA',
  'Attorney / Lawyer',
  'Barber / Hair Stylist',
  'Bus Driver',
  'Carpenter',
  'Cashier',
  'Chef / Cook',
  'Civil / Structural Engineer',
  'Cleaner / Janitor',
  'Construction Worker',
  'Customer Service Representative',
  'Data Entry Clerk',
  'Delivery Driver',
  'Dental Hygienist',
  'Dentist',
  'Disabled',
  'Electrician',
  'Emergency Medical Technician (EMT)',
  'Factory / Assembly Worker',
  'Firefighter',
  'Food Service Worker',
  'Funeral Director',
  'Home Health Aide',
  'HVAC Technician',
  'IT Specialist / Programmer',
  'Insurance Agent',
  'Landscaper / Groundskeeper',
  'Mechanic / Auto Technician',
  'Medical Assistant',
  'Military (Active Duty)',
  'Military (Veteran)',
  'Nurse (LPN)',
  'Nurse Practitioner (NP)',
  'Nurse (RN)',
  'Office Manager',
  'Painter',
  'Pastor / Clergy',
  'Pharmacist',
  'Physical Therapist',
  'Physician / Doctor',
  'Plumber',
  'Police Officer',
  'Postal Worker',
  'Property Manager',
  'Real Estate Agent',
  'Restaurant Worker / Server',
  'Retail Worker / Sales Associate',
  'Retired',
  'Sales Representative',
  'Security Guard',
  'Self-Employed / Business Owner',
  'Social Worker',
  'Student',
  'Teacher / Educator',
  'Truck Driver (CDL)',
  'Unemployed',
  'Utility / Line Worker',
  'Warehouse Worker',
  'Welder',
  'Work From Home',
]

/**
 * Search occupations by query string (case-insensitive, partial match).
 * Returns up to 8 matches sorted by how early the match appears.
 */
export function searchOccupations(query) {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase()
  return OCCUPATIONS
    .filter(o => o.toLowerCase().includes(q))
    .sort((a, b) => a.toLowerCase().indexOf(q) - b.toLowerCase().indexOf(q))
    .slice(0, 8)
}
