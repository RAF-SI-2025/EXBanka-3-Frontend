import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAccountStore } from '../../stores/account'
import { accountApi } from '../../api/account'

vi.mock('../../api/account', () => ({
  accountApi: {
    create: vi.fn(),
    get: vi.fn(),
    listByClient: vi.fn(),
    listAll: vi.fn(),
    updateName: vi.fn(),
    updateLimits: vi.fn(),
  },
  CURRENCIES: [
    { id: 1, kod: 'RSD', naziv: 'Serbian Dinar' },
    { id: 2, kod: 'EUR', naziv: 'Euro' },
  ],
}))

const mockAccount = {
  id: '42', brojRacuna: '123456789012345678', clientId: '1',
  firmaId: '0', currencyId: '2', currencyKod: 'EUR',
  tip: 'tekuci', vrsta: 'licni', stanje: 0, raspolozivoStanje: 0,
  dnevniLimit: 100000, mesecniLimit: 1000000, naziv: '', status: 'aktivan',
}

describe('useAccountStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('createAccount calls API and returns account on success', async () => {
    vi.mocked(accountApi.create).mockResolvedValueOnce({ data: { account: mockAccount } })

    const store = useAccountStore()
    const result = await store.createAccount({
      clientId: 1, currencyId: 2, tip: 'tekuci', vrsta: 'licni',
    })

    expect(accountApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, currencyId: 2, tip: 'tekuci', vrsta: 'licni' })
    )
    expect(result.id).toBe('42')
    expect(store.lastCreated?.id).toBe('42')
  })

  it('createAccount sets loading true during request', async () => {
    let resolvePromise!: (v: any) => void
    vi.mocked(accountApi.create).mockReturnValueOnce(
      new Promise(resolve => { resolvePromise = resolve })
    )

    const store = useAccountStore()
    const promise = store.createAccount({ clientId: 1, currencyId: 2, tip: 'tekuci', vrsta: 'licni' })
    expect(store.loading).toBe(true)

    resolvePromise({ data: { account: mockAccount } })
    await promise
    expect(store.loading).toBe(false)
  })

  it('createAccount sets error and rethrows on API failure', async () => {
    vi.mocked(accountApi.create).mockRejectedValueOnce({
      response: { data: { message: 'devizni account cannot use RSD' } },
    })

    const store = useAccountStore()
    await expect(store.createAccount({ clientId: 1, currencyId: 1, tip: 'devizni', vrsta: 'licni' }))
      .rejects.toBeDefined()

    expect(store.error).toBe('devizni account cannot use RSD')
    expect(store.loading).toBe(false)
  })

  it('clearError resets error state', () => {
    const store = useAccountStore()
    store.error = 'some error'
    store.clearError()
    expect(store.error).toBe('')
  })
})
