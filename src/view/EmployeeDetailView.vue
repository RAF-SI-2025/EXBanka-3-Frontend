<template>
  <div class="page">
    <div class="container">

      <router-link to="/employees" class="back-link">← Nazad na listu</router-link>

      <!-- Loading -->
      <div v-if="loading" class="state-message">Učitavanje...</div>

      <!-- Error -->
      <div v-else-if="error" class="error-banner">{{ error }}</div>

      <template v-else-if="employee">
        <div class="page-header">
          <div>
            <h1>{{ employee.first_name }} {{ employee.last_name }}</h1>
            <p>{{ employee.position }}</p>
          </div>
          <div class="header-badges">
            <span class="badge" :class="employee.is_active ? 'badge--active' : 'badge--inactive'">
              {{ employee.is_active ? 'Aktivan' : 'Neaktivan' }}
            </span>
            <span v-if="employee.is_admin" class="badge-admin">Admin</span>
          </div>
        </div>

        <!-- Podaci -->
        <div class="card">
          <h2>Podaci zaposlenog</h2>
            <div v-if="employee.is_admin" class="error-banner">
                Administrator nalog nije moguće editovati.
            </div>

            <form v-else @submit.prevent="handleUpdate" novalidate>
            <div class="form-row">
              <div class="field" :class="{ 'field--error': errors.first_name }">
                <label>Ime</label>
                <input
                  v-model.trim="form.first_name"
                  type="text"
                  :disabled="saving"
                  @input="clearError('first_name')"
                />
                <span v-if="errors.first_name" class="field__error">{{ errors.first_name }}</span>
              </div>
              <div class="field" :class="{ 'field--error': errors.last_name }">
                <label>Prezime</label>
                <input
                  v-model.trim="form.last_name"
                  type="text"
                  :disabled="saving"
                  @input="clearError('last_name')"
                />
                <span v-if="errors.last_name" class="field__error">{{ errors.last_name }}</span>
              </div>
            </div>

            <div class="field" :class="{ 'field--error': errors.email }">
              <label>Email</label>
              <input
                v-model.trim="form.email"
                type="email"
                :disabled="saving"
                @input="clearError('email')"
              />
              <span v-if="errors.email" class="field__error">{{ errors.email }}</span>
            </div>

            <div class="field">
              <label>Broj telefona</label>
              <input
                v-model.trim="form.phone_number"
                type="tel"
                :disabled="saving"
              />
            </div>

            <div class="field">
              <label>Pozicija</label>
              <input
                v-model.trim="form.position"
                type="text"
                :disabled="saving"
              />
            </div>

            <div v-if="errors.general" class="error-banner">{{ errors.general }}</div>
            <div v-if="updateSuccess" class="success-banner">Podaci su uspešno sačuvani.</div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="saving">
                <span v-if="saving" class="spinner" aria-hidden="true" />
                {{ saving ? 'Čuvanje...' : 'Sačuvaj izmene' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Aktivacija / Deaktivacija -->
        <div class="card" v-if="!employee.is_admin">
          <h2>Status naloga</h2>
          <p class="section-desc">
            {{ employee.is_active
              ? 'Zaposleni trenutno ima aktivan nalog i može da se prijavi u sistem.'
              : 'Zaposleni ima deaktiviran nalog i ne može da se prijavi u sistem.' }}
          </p>
          <div v-if="activeError" class="error-banner">{{ activeError }}</div>
          <button
            class="btn-toggle"
            :class="employee.is_active ? 'btn-toggle--deactivate' : 'btn-toggle--activate'"
            :disabled="togglingActive"
            @click="toggleActive"
          >
            <span v-if="togglingActive" class="spinner" aria-hidden="true" />
            {{ employee.is_active ? 'Deaktiviraj nalog' : 'Aktiviraj nalog' }}
          </button>
        </div>

        <!-- Permisije -->
        <div class="card" v-if="!employee.is_admin">
          <h2>Permisije</h2>
          <p class="section-desc">Odaberite šta zaposleni sme da radi u sistemu.</p>

          <div class="permissions-grid">
            <label
              v-for="perm in availablePermissions"
              :key="perm.value"
              class="perm-item"
            >
              <input
                type="checkbox"
                :value="perm.value"
                v-model="selectedPermissions"
                :disabled="savingPermissions"
              />
              <div>
                <span class="perm-name">{{ perm.label }}</span>
                <span class="perm-desc">{{ perm.description }}</span>
              </div>
            </label>
          </div>

          <div v-if="permissionsError" class="error-banner">{{ permissionsError }}</div>
          <div v-if="permissionsSuccess" class="success-banner">Permisije su uspešno sačuvane.</div>

          <div class="form-actions">
            <button class="btn-primary" :disabled="savingPermissions" @click="handleSavePermissions">
              <span v-if="savingPermissions" class="spinner" aria-hidden="true" />
              {{ savingPermissions ? 'Čuvanje...' : 'Sačuvaj permisije' }}
            </button>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { employeeApi, type Employee } from '@/api/employeeApi'
import type { AxiosError } from 'axios'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const employee = ref<Employee | null>(null)
const loading = ref(false)
const error = ref('')

// Edit form
const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  position: '',
})
const errors = reactive({ first_name: '', last_name: '', email: '', general: '' })
const saving = ref(false)
const updateSuccess = ref(false)

// Active toggle
const togglingActive = ref(false)
const activeError = ref('')

// Permissions
const availablePermissions = [
  { value: 'admin', label: 'Administrator', description: 'Pun pristup svim funkcijama' },
  { value: 'trade_stocks', label: 'Trgovanje akcijama', description: 'Može da trguje akcijama' },
  { value: 'view_stocks', label: 'Pregled akcija', description: 'Samo pregled akcija' },
  { value: 'manage_contracts', label: 'Upravljanje ugovorima', description: 'Sklapa i menja ugovore' },
  { value: 'manage_insurance', label: 'Upravljanje osiguranjima', description: 'Sklapa nova osiguranja' },
]
const selectedPermissions = ref<string[]>([])
const savingPermissions = ref(false)
const permissionsError = ref('')
const permissionsSuccess = ref(false)

function clearError(field: keyof typeof errors): void {
  errors[field] = ''
  errors.general = ''
}

function populateForm(emp: Employee): void {
  form.first_name = emp.first_name
  form.last_name = emp.last_name
  form.email = emp.email
  form.phone_number = emp.phone_number
  form.position = emp.position
}

function validateForm(): boolean {
  let valid = true
  if (!form.first_name) { errors.first_name = 'Ime je obavezno.'; valid = false }
  if (!form.last_name) { errors.last_name = 'Prezime je obavezno.'; valid = false }
  if (!form.email) {
    errors.email = 'Email je obavezan.'; valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Unesite ispravnu email adresu.'; valid = false
  }
  return valid
}

async function fetchEmployee(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const { data } = await employeeApi.getById(id)
    employee.value = data
    populateForm(data)
  } catch {
    error.value = 'Greška pri učitavanju zaposlenog.'
  } finally {
    loading.value = false
  }
}

async function fetchPermissions(): Promise<void> {
  try {
    const { data } = await employeeApi.getPermissions(id)
    selectedPermissions.value = data.permissions
  } catch {
    // silently fail
  }
}

async function handleUpdate(): Promise<void> {
  if (!validateForm()) return
  saving.value = true
  errors.general = ''
  updateSuccess.value = false
  try {
    const { data } = await employeeApi.update(id, form)
    employee.value = data
    updateSuccess.value = true
    setTimeout(() => updateSuccess.value = false, 3000)
  } catch (err) {
    const status = (err as AxiosError).response?.status
    if (status === 409) {
      errors.email = 'Zaposleni sa ovim emailom već postoji.'
    } else {
      errors.general = 'Greška pri čuvanju. Pokušajte ponovo.'
    }
  } finally {
    saving.value = false
  }
}

async function toggleActive(): Promise<void> {
  if (!employee.value) return
  togglingActive.value = true
  activeError.value = ''
  try {
    await employeeApi.setActive(id, !employee.value.is_active)
    employee.value.is_active = !employee.value.is_active
  } catch {
    activeError.value = 'Greška pri promeni statusa. Pokušajte ponovo.'
  } finally {
    togglingActive.value = false
  }
}

async function handleSavePermissions(): Promise<void> {
  savingPermissions.value = true
  permissionsError.value = ''
  permissionsSuccess.value = false
  try {
    await employeeApi.updatePermissions(id, selectedPermissions.value)
    permissionsSuccess.value = true
    setTimeout(() => permissionsSuccess.value = false, 3000)
  } catch {
    permissionsError.value = 'Greška pri čuvanju permisija. Pokušajte ponovo.'
  } finally {
    savingPermissions.value = false
  }
}

onMounted(async () => {
  await fetchEmployee()
  await fetchPermissions()
})
</script>

<style scoped src="./LoginView.css" />

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 40px 24px;
}

.container {
  max-width: 760px;
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  color: #4f46e5;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 24px;
}

.back-link:hover { text-decoration: underline; }

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

.header-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 28px 32px;
  margin-bottom: 20px;
}

.card h2 {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 20px;
}

.section-desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  text-decoration: none;
}

.btn-primary:hover:not(:disabled) { background: #4338ca; }
.btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }

.btn-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle--deactivate {
  background: #fee2e2;
  color: #991b1b;
}

.btn-toggle--deactivate:hover:not(:disabled) { background: #fecaca; }

.btn-toggle--activate {
  background: #d1fae5;
  color: #065f46;
}

.btn-toggle--activate:hover:not(:disabled) { background: #a7f3d0; }

.btn-toggle:disabled { opacity: 0.6; cursor: not-allowed; }

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
}

.badge--active { background: #d1fae5; color: #065f46; }
.badge--inactive { background: #fee2e2; color: #991b1b; }

.badge-admin {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  background: #ede9fe;
  color: #5b21b6;
}

.permissions-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.perm-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.perm-item:hover { border-color: #4f46e5; }

.perm-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: #4f46e5;
  cursor: pointer;
  flex-shrink: 0;
}

.perm-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.perm-desc {
  display: block;
  font-size: 0.78rem;
  color: #9ca3af;
  margin-top: 2px;
}

.success-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.875rem;
  color: #16a34a;
  margin-bottom: 8px;
}
</style>