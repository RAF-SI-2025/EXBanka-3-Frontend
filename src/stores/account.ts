import { defineStore } from 'pinia'
import { ref } from 'vue'
import { accountApi, type CreateAccountPayload, type AccountProto } from '../api/account'

export const useAccountStore = defineStore('account', () => {
  const lastCreated = ref<AccountProto | null>(null)
  const loading = ref(false)
  const error = ref('')

  async function createAccount(data: CreateAccountPayload): Promise<AccountProto> {
    loading.value = true
    error.value = ''
    try {
      const res = await accountApi.create(data)
      const account = res.data.account
      lastCreated.value = account
      return account
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to create account.'
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = ''
  }

  return { lastCreated, loading, error, createAccount, clearError }
})
