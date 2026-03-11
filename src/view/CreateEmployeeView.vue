<template>
  <div class="page">
    <div class="card">
      <div class="card-header">
        <router-link to="/dashboard" class="back-link">← Nazad</router-link>
        <h1>Kreiranje zaposlenog</h1>
        <p>Unesite podatke novog zaposlenog</p>
      </div>

      <form @submit.prevent="handleSubmit" novalidate>
        <div class="form-row">
          <div class="field" :class="{ 'field--error': errors.first_name }">
            <label for="first_name">Ime</label>
            <input
              id="first_name"
              v-model.trim="form.first_name"
              type="text"
              placeholder="Petar"
              :disabled="loading"
              @input="clearError('first_name')"
            />
            <span v-if="errors.first_name" class="field__error">{{ errors.first_name }}</span>
          </div>

          <div class="field" :class="{ 'field--error': errors.last_name }">
            <label for="last_name">Prezime</label>
            <input
              id="last_name"
              v-model.trim="form.last_name"
              type="text"
              placeholder="Petrović"
              :disabled="loading"
              @input="clearError('last_name')"
            />
            <span v-if="errors.last_name" class="field__error">{{ errors.last_name }}</span>
          </div>
        </div>

        <div class="field" :class="{ 'field--error': errors.email }">
          <label for="email">Email adresa</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            placeholder="petar@banka.com"
            :disabled="loading"
            @input="clearError('email')"
          />
          <span v-if="errors.email" class="field__error">{{ errors.email }}</span>
        </div>

        <div class="field" :class="{ 'field--error': errors.phone_number }">
          <label for="phone_number">Broj telefona</label>
          <input
            id="phone_number"
            v-model.trim="form.phone_number"
            type="tel"
            placeholder="+381601234567"
            :disabled="loading"
            @input="clearError('phone_number')"
          />
          <span v-if="errors.phone_number" class="field__error">{{ errors.phone_number }}</span>
        </div>

        <div class="field" :class="{ 'field--error': errors.position }">
          <label for="position">Pozicija</label>
          <input
            id="position"
            v-model.trim="form.position"
            type="text"
            placeholder="npr. Manager, Teller..."
            :disabled="loading"
            @input="clearError('position')"
          />
          <span v-if="errors.position" class="field__error">{{ errors.position }}</span>
        </div>

        <div class="field field--checkbox">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="form.is_active"
              :disabled="loading"
            />
            <span>Nalog aktivan odmah</span>
          </label>
          <p class="field-hint">Ako je čekirano, zaposleni će moći da aktivira nalog čim dobije mejl.</p>
        </div>

        <div v-if="errors.general" class="error-banner" role="alert">
          {{ errors.general }}
        </div>

        <div v-if="success" class="success-banner" role="status">
          Zaposleni je uspešno kreiran! Aktivacioni mejl će biti poslat kada notification servis bude aktivan.
        </div>

        <div class="form-actions">
          <router-link to="/dashboard" class="btn-cancel">Otkaži</router-link>
          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="loading" class="spinner" aria-hidden="true" />
            {{ loading ? 'Kreiranje...' : 'Kreiraj zaposlenog' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { employeeApi } from '@/api/employeeApi'
import type { AxiosError } from 'axios'

const router = useRouter()

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  position: '',
  is_active: true,
})

const errors = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  position: '',
  general: '',
})

const loading = ref(false)
const success = ref(false)

function clearError(field: keyof typeof errors): void {
  errors[field] = ''
  errors.general = ''
}

function validate(): boolean {
  let valid = true

  if (!form.first_name) {
    errors.first_name = 'Ime je obavezno.'
    valid = false
  }

  if (!form.last_name) {
    errors.last_name = 'Prezime je obavezno.'
    valid = false
  }

  if (!form.email) {
    errors.email = 'Email je obavezan.'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Unesite ispravnu email adresu.'
    valid = false
  }

  if (!form.phone_number) {
    errors.phone_number = 'Broj telefona je obavezan.'
    valid = false
  }

  if (!form.position) {
    errors.position = 'Pozicija je obavezna.'
    valid = false
  }

  return valid
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return

  loading.value = true
  errors.general = ''

  try {
    await employeeApi.create(form)
    success.value = true
    setTimeout(() => router.push({ name: 'employees' }), 2000)
  } catch (err) {
    const status = (err as AxiosError).response?.status

    if (status === 409) {
      errors.email = 'Zaposleni sa ovim emailom već postoji.'
    } else if (status === 401) {
      router.push({ name: 'login' })
    } else if (status && status >= 500) {
      errors.general = 'Greška na serveru. Pokušajte ponovo.'
    } else {
      errors.general = 'Došlo je do greške. Pokušajte ponovo.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped src="./LoginView.css" />

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 40px 24px;
}

.card {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 40px;
}

.card-header {
  margin-bottom: 32px;
}

.back-link {
  display: inline-block;
  color: #4f46e5;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 16px;
}

.back-link:hover {
  text-decoration: underline;
}

.card-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.card-header p {
  font-size: 0.875rem;
  color: #6b7280;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field--checkbox {
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4f46e5;
}

.field-hint {
  font-size: 0.78rem;
  color: #9ca3af;
  margin: 0;
}

.success-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.875rem;
  color: #16a34a;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel {
  padding: 12px 24px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  text-decoration: none;
  transition: background 0.2s;
  display: flex;
  align-items: center;
}

.btn-cancel:hover {
  background: #f9fafb;
}
</style>