import http from './http'

export interface CreateEmployeeRequest {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  position: string
  is_active: boolean
}

export interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  phone_number: string
  position: string
  is_active: boolean
  is_admin: boolean
}

export const employeeApi = {
  create(payload: CreateEmployeeRequest) {
    return http.post<Employee>('/employees', payload)
  },

  getAll(filters?: { email?: string; first_name?: string; last_name?: string; position?: string }) {
    return http.get<Employee[]>('/employees', { params: filters })
  },

  getById(id: number) {
    return http.get<Employee>(`/employees/${id}`)
  },

  update(id: number, payload: Partial<CreateEmployeeRequest>) {
    return http.put<Employee>(`/employees/${id}`, payload)
  },

  setActive(id: number, is_active: boolean) {
    return http.patch(`/employees/${id}/active`, { is_active })
  },

  getPermissions(id: number) {
    return http.get<{ permissions: string[] }>(`/employees/${id}/permissions`)
  },

  updatePermissions(id: number, permissions: string[]) {
    return http.put(`/employees/${id}/permissions`, { permissions })
  },
}