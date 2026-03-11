<template>
  <div style="padding: 40px; font-family: sans-serif;">
    <h1>Dashboard</h1>
    <p>Uspešno ste se prijavili.</p>
    <button @click="handleLogout" style="margin-top: 16px; padding: 10px 20px; cursor: pointer;">
      Odjavi se
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

function handleLogout(): void {
  auth.logout()
  router.push({ name: 'login' })
}
</script>
