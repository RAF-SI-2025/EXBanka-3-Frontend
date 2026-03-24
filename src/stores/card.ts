import { defineStore } from 'pinia'
import { ref } from 'vue'
import { cardApi, type Card } from '../api/card'

export const useCardStore = defineStore('card', () => {
  const cards = ref<Card[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchByClient(clientId: number | string) {
    loading.value = true
    error.value = ''
    try {
      const res = await cardApi.listByClient(clientId)
      cards.value = res.data ?? []
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Greška pri učitavanju kartica.'
    } finally {
      loading.value = false
    }
  }

  async function blockCard(cardId: number, clientId: number): Promise<Card> {
    const res = await cardApi.blockCard(cardId, clientId)
    const updated = res.data
    const idx = cards.value.findIndex((c) => c.id === cardId)
    if (idx !== -1) cards.value[idx] = updated
    return updated
  }

  function clearError() {
    error.value = ''
  }

  return { cards, loading, error, fetchByClient, blockCard, clearError }
})
