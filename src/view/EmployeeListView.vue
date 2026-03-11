<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1>Zaposleni</h1>
          <p>Pregled svih zaposlenih u sistemu</p>
        </div>
        <router-link to="/employees/create" class="btn-primary">
          + Novi zaposleni
        </router-link>
      </div>

      <!-- Filteri -->
      <div class="filters">
        <div class="filter-field">
          <input
            v-model="filters.first_name"
            type="text"
            placeholder="Ime..."
            @input="debouncedFetch"
          />
        </div>
        <div class="filter-field">
          <input
            v-model="filters.last_name"
            type="text"
            placeholder="Prezime..."
            @input="debouncedFetch"
          />
        </div>
        <div class="filter-field">
          <input
            v-model="filters.email"
            type="text"
            placeholder="Email..."
            @input="debouncedFetch"
          />
        </div>
        <div class="filter-field">
          <input
            v-model="filters.position"
            type="text"
            placeholder="Pozicija..."
            @input="debouncedFetch"
          />
        </div>
        <button class="btn-clear" @click="clearFilters">Poništi filtere</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="state-message">Učitavanje...</div>

      <!-- Error -->
      <div v-else-if="error" class="error-banner">{{ error }}</div>

      <!-- Prazna lista -->
      <div v-else-if="employees.length === 0" class="state-message">
        Nema zaposlenih koji odgovaraju filterima.
      </div>

      <!-- Tabela -->
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ime i prezime</th>
              <th>Email</th>
              <th>Pozicija</th>
              <th>Telefon</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="emp in employees"
              :key="emp.id"
              @click="goToEmployee(emp.id)"
              class="table-row"
            >
              <td>
                <span class="name">{{ emp.first_name }} {{ emp.last_name }}</span>
                <span v-if="emp.is_admin" class="badge-admin">Admin</span>
              </td>
              <td>{{ emp.email }}</td>
              <td>{{ emp.position }}</td>
              <td>{{ emp.phone_number }}</td>
              <td>
                <span class="badge" :class="emp.is_active ? 'badge--active' : 'badge--inactive'">
                  {{ emp.is_active ? 'Aktivan' : 'Neaktivan' }}
                </span>
              </td>
              <td class="td-action">→</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { employeeApi, type Employee } from '@/api/employeeApi'

const router = useRouter()

const employees = ref<Employee[]>([])
const loading = ref(false)
const error = ref('')

const filters = reactive({
  first_name: '',
  last_name: '',
  email: '',
  position: '',
})

async function fetchEmployees(): Promise<void> {
  loading.value = true
  error.value = ''

  try {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    )
    const { data } = await employeeApi.getAll(activeFilters)
    employees.value = data
  } catch {
    error.value = 'Greška pri učitavanju zaposlenih.'
  } finally {
    loading.value = false
  }
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedFetch(): void {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchEmployees, 400)
}

function clearFilters(): void {
  filters.first_name = ''
  filters.last_name = ''
  filters.email = ''
  filters.position = ''
  fetchEmployees()
}

function goToEmployee(id: number): void {
  router.push({ name: 'employee-detail', params: { id } })
}

onMounted(fetchEmployees)
</script>

<style scoped src="./LoginView.css" />

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 40px 24px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.page-header p {
  font-size: 0.875rem;
  color: #6b7280;
}

.btn-primary {
  padding: 10px 20px;
  background: #4f46e5;
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #4338ca;
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  background: #fff;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-field input {
  padding: 8px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  width: 180px;
}

.filter-field input:focus {
  border-color: #4f46e5;
}

.btn-clear {
  padding: 8px 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  border-color: #4f46e5;
  color: #4f46e5;
}

.table-wrapper {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead tr {
  background: #f9fafb;
  border-bottom: 1.5px solid #e5e7eb;
}

th {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-row {
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: #f5f3ff;
}

td {
  padding: 14px 16px;
  font-size: 0.875rem;
  color: #1f2937;
}

.name {
  font-weight: 600;
  margin-right: 8px;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge--active {
  background: #d1fae5;
  color: #065f46;
}

.badge--inactive {
  background: #fee2e2;
  color: #991b1b;
}

.badge-admin {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  background: #ede9fe;
  color: #5b21b6;
}

.td-action {
  color: #9ca3af;
  font-size: 1rem;
  text-align: right;
}

.state-message {
  text-align: center;
  padding: 48px;
  color: #6b7280;
  font-size: 0.95rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
</style>