<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>Prijava</h1>
        <p>Unesite vaše kredencijale za pristup sistemu</p>
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
            :disabled="loading"
            @input="clearError('email')"
          />
          <span v-if="errors.email" class="field__error">{{ errors.email }}</span>
        </div>

        <div class="field" :class="{ 'field--error': errors.password }">
          <label for="password">Lozinka</label>
          <div class="input-row">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              :disabled="loading"
              @input="clearError('password')"
            />
            <button
              type="button"
              class="toggle-pw"
              :aria-label="showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'"
              @click="showPassword = !showPassword"
            >
              <span v-if="showPassword">🙈</span>
              <span v-else>👁</span>
            </button>
          </div>
          <span v-if="errors.password" class="field__error">{{ errors.password }}</span>
        </div>

        <div v-if="errors.general" class="error-banner" role="alert">
          {{ errors.general }}
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading" class="spinner" aria-hidden="true" />
          {{ loading ? 'Prijavljivanje...' : 'Prijavi se' }}
        </button>

        <div class="forgot-pw">
          <router-link to="/forgot-password">Zaboravili ste lozinku?</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { AxiosError } from 'axios'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '', general: '' })
const loading = ref(false)
const showPassword = ref(false)

function clearError(field: 'email' | 'password'): void {
  errors[field] = ''
  errors.general = ''
}

function validate(): boolean {
  let valid = true

  if (!form.email) {
    errors.email = 'Email je obavezan.'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Unesite ispravnu email adresu.'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Lozinka je obavezna.'
    valid = false
  }

  return valid
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return

  loading.value = true
  errors.general = ''

  try {
    await auth.login(form.email, form.password)

    const redirect = route.query.redirect as string | undefined
    router.push(redirect ?? { name: 'dashboard' })
  } catch (err) {
    const status = (err as AxiosError).response?.status

    if (status === 401) {
      errors.general = 'Pogrešan email ili lozinka.'
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
