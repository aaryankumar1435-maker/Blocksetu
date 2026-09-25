import type { Department as DbDepartment } from '@prisma/client'

// Prisma enums can't contain "&" or spaces, so DB uses SNT while the API
// (matching the frontend's Department type) uses 'S&T'.
export type ApiDepartment = 'ENG' | 'S&T' | 'TRD'

const DB_TO_API: Record<DbDepartment, ApiDepartment> = {
  ENG: 'ENG',
  SNT: 'S&T',
  TRD: 'TRD',
}

const API_TO_DB: Record<ApiDepartment, DbDepartment> = {
  ENG: 'ENG',
  'S&T': 'SNT',
  TRD: 'TRD',
}

export function toApiDept(dept: DbDepartment): ApiDepartment {
  return DB_TO_API[dept]
}

export function toDbDept(dept: ApiDepartment): DbDepartment {
  return API_TO_DB[dept]
}
