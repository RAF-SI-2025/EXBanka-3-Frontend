<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>Nova lozinka</h1>
        <p>Unesite vašu novu lozinku</p>
      </div>

      <div v-if="noToken" class="error-banner" role="alert">
        Nevažeći link za reset. Zatražite novi na login stranici.
      </div>

      <form v-else @submit.prevent="handleSubmit" novalidate>
        <div class="field" :class="{ 'field--error': errors.password }">
          <label for="password">Nova lozinka</label>
          <div class="input-row">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
              :disabled="loading || success"
              @input="clearError('password')"
            />
            <button
              type="button"
              class="toggle-pw"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'"
            >
              <span v-if="showPassword">🙈</span>
              <span v-else>👁</span>
            </button>
          </div>
          <span v-if="errors.password" class="field__error">{{ errors.password }}</span>
        </div>

        <div class="field" :class="{ 'field--error': errors.passwordConfirm }">
          <label for="passwordConfirm">Potvrdite lozinku</label>
          <div class="input-row">
            <input
              id="passwordConfirm"
              v-model="form.passwordConfirm"
              :type="showPasswordConfirm ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
              :disabled="loading || success"
              @input="clearError('passwordConfirm')"
            />
            <button
              type="button"
              class="toggle-pw"
              @click="showPasswordConfirm = !showPasswordConfirm"
              :aria-label="showPasswordConfirm ? 'Sakrij lozinku' : 'Prikaži lozinku'"
            >
              <span v-if="showPasswordConfirm">🙈</span>
              <span v-else>👁</span>
            </button>
          </div>
          <span v-if="errors.passwordConfirm" class="field__error">{{ errors.passwordConfirm }}</span>
        </div>

        <div v-if="errors.general" class="error-banner" role="alert">
          {{ errors.general }}
        </div>

        <div v-if="success" class="success-banner" role="status">
          Lozinka je uspešno promenjena! Preusmeravamo vas na login...
        </div>

        <button v-if="!success" type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading" class="spinner" aria-hidden="true" />
          {{ loading ? 'Čuvanje...' : 'Sačuvaj lozinku' }}
        </button>

        <div class="forgot-pw">
          <router-link to="/login">Nazad na prijavu</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api/authApi'
import type { AxiosError } from 'axios'

const route = useRoute()
const router = useRouter()

const form = reactive({ password: '', passwordConfirm: '' })
const errors = reactive({ password: '', passwordConfirm: '', general: '' })
const loading = ref(false)
const success = ref(false)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

const token = computed(() => route.query.token as string | undefined)
const noToken = computed(() => !token.value)

function clearError(field: 'password' | 'passwordConfirm'): void {
  errors[field] = ''
  errors.general = ''
}

function validate(): boolean {
  let valid = true

  if (!form.password) {
    errors.password = 'Lozinka je obavezna.'
    valid = false
  } else if (form.password.length < 8 || form.password.length > 32) {
    errors.password = 'Lozinka mora imati između 8 i 32 karaktera.'
    valid = false
  } else if (!/(?=(.*\d){2})/.test(form.password)) {
    errors.password = 'Lozinka mora sadržati najmanje 2 broja.'
    valid = false
  } else if (!/(?=.*[a-z])/.test(form.password)) {
    errors.password = 'Lozinka mora sadržati najmanje 1 malo slovo.'
    valid = false
  } else if (!/(?=.*[A-Z])/.test(form.password)) {
    errors.password = 'Lozinka mora sadržati najmanje 1 veliko slovo.'
    valid = false
  }

  if (!form.passwordConfirm) {
    errors.passwordConfirm = 'Potvrda lozinke je obavezna.'
    valid = false
  } else if (form.password !== form.passwordConfirm) {
    errors.passwordConfirm = 'Lozinke se ne podudaraju.'
    valid = false
  }

  return valid
}

async function handleSubmit(): Promise<void> {
  if (!validate() || !token.value) return

  loading.value = true
  errors.general = ''

  try {
    await authApi.resetPassword(token.value, form.password, form.passwordConfirm)
    success.value = true
    setTimeout(() => router.push({ name: 'login' }), 2000)
  } catch (err) {
    const status = (err as AxiosError).response?.status

    if (status === 400) {
      errors.general = 'Token je istekao ili već iskorišćen. Zatražite novi reset.'
    } else if (status === 404) {
      errors.general = 'Nevažeći reset token.'
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
.success-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.875rem;
  color: #16a34a;
}
</style>