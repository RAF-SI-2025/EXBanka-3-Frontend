<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>Resetovanje lozinke</h1>
        <p>Unesite email i poslaćemo vam link za reset</p>
      </div>

      <form @submit.prevent="handleSubmit" novalidate>
        <div class="field" :class="{ 'field--error': errors.email }">
          <label for="email">Email adresa</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            placeholder="ime@kompanija.com"
            :disabled="loading || sent"
          />
          <span v-if="errors.email" class="field__error">{{ errors.email }}</span>
        </div>

        <div v-if="sent" class="success-banner" role="status">
          Poslali smo vam link za resetovanje lozinke. Proverite email.
        </div>

        <div v-if="errors.general" class="error-banner" role="alert">
          {{ errors.general }}
        </div>

        <button v-if="!sent" type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading" class="spinner" aria-hidden="true" />
          {{ loading ? 'Slanje...' : 'Pošalji link' }}
        </button>

        <div class="forgot-pw">
          <router-link to="/login">Nazad na prijavu</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { authApi } from '@/api/authApi'
import type { AxiosError } from 'axios'

const form = reactive({ email: '' })
const errors = reactive({ email: '', general: '' })
const loading = ref(false)
const sent = ref(false)

function validate(): boolean {
  if (!form.email) {
    errors.email = 'Email je obavezan.'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Unesite ispravnu email adresu.'
    return false
  }
  return true
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return

  loading.value = true
  errors.general = ''

  try {
    await authApi.forgotPassword(form.email)
    sent.value = true
  } catch (err) {
    const status = (err as AxiosError).response?.status
    if (status && status >= 500) {
      errors.general = 'Greška na serveru. Pokušajte ponovo.'
    } else {
      // Always show success to prevent email enumeration
      sent.value = true
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped src="./LoginView.css" />

<style scoped>
.success-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.875rem;
  color: #16a34a;
}
</style>
