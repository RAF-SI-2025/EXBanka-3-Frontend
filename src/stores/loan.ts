import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loanApi, type Loan, type LoanInstallment, type CreateLoanPayload } from '../api/loan'

export const useLoanStore = defineStore('loan', () => {
  const loans = ref<Loan[]>([])
  const installments = ref<LoanInstallment[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchByClient(clientId: string | number) {
    loading.value = true
    error.value = ''
    try {
      const res = await loanApi.listByClient(clientId)
      loans.value = res.data ?? []
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Greška pri učitavanju kredita.'
    } finally {
      loading.value = false
    }
  }

  async function fetchInstallments(loanId: number | string) {
    loading.value = true
    error.value = ''
    try {
      const res = await loanApi.listInstallments(loanId)
      installments.value = res.data ?? []
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Greška pri učitavanju rata.'
    } finally {
      loading.value = false
    }
  }

  async function createLoan(data: CreateLoanPayload): Promise<Loan> {
    const res = await loanApi.create(data)
    return res.data
  }

  function clearError() {
    error.value = ''
  }

  return { loans, installments, loading, error, fetchByClient, fetchInstallments, createLoan, clearError }
})
