<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '../stores/account'
import { CURRENCIES } from '../api/account'
import ClientSelectDialog from '../components/ClientSelectDialog.vue'

const router = useRouter()
const store = useAccountStore()

const showClientDialog = ref(false)
const selectedClientId = ref<string | null>(null)
const selectedClientLabel = ref('')

const form = ref({
  currencyId: 1,   // RSD default
  tip: 'tekuci',
  vrsta: 'licni',
  firmaId: '',
  naziv: '',
})

const availableCurrencies = computed(() => {
  if (form.value.tip === 'devizni') {
    return CURRENCIES.filter(c => c.kod !== 'RSD')
  }
  return CURRENCIES
})

function onClientSelected(clientId: string, label?: string) {
  selectedClientId.value = clientId
  selectedClientLabel.value = label ?? `Client #${clientId}`
  showClientDialog.value = false
}

function onTipChange() {
  // devizni cannot use RSD — switch to EUR if RSD selected
  if (form.value.tip === 'devizni' && form.value.currencyId === 1) {
    form.value.currencyId = 2
  }
}

async function handleSubmit() {
  if (!selectedClientId.value) {
    store.error = 'Please select a client.'
    return
  }
  if (form.value.vrsta === 'poslovni' && !form.value.firmaId) {
    store.error = 'Firma ID is required for poslovni accounts.'
    return
  }

  try {
    await store.createAccount({
      clientId:   Number(selectedClientId.value),
      currencyId: form.value.currencyId,
      tip:        form.value.tip,
      vrsta:      form.value.vrsta,
      firmaId:    form.value.vrsta === 'poslovni' ? Number(form.value.firmaId) : undefined,
      naziv:      form.value.naziv || undefined,
    })
    router.push('/accounts')
  } catch {
    // error is set by store
  }
}
</script>

<template>
  <div class="page-content">
    <div class="page-header">
      <h1>Create Account</h1>
    </div>

    <div class="card" style="max-width:600px">
      <!-- Client selection -->
      <div class="form-group" style="margin-bottom:20px">
        <label>Client *</label>
        <div style="display:flex;align-items:center;gap:12px">
          <span v-if="selectedClientId" style="flex:1;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb">
            {{ selectedClientLabel }}
          </span>
          <span v-else style="flex:1;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;color:#9ca3af">
            No client selected
          </span>
          <button class="btn-secondary" type="button" @click="showClientDialog = true">
            {{ selectedClientId ? 'Change' : 'Select Client' }}
          </button>
        </div>
      </div>

      <!-- Currency -->
      <div class="form-group" style="margin-bottom:20px">
        <label>Currency *</label>
        <select v-model="form.currencyId">
          <option v-for="c in availableCurrencies" :key="c.id" :value="c.id">
            {{ c.kod }} — {{ c.naziv }}
          </option>
        </select>
      </div>

      <!-- Tip -->
      <div class="form-group" style="margin-bottom:20px">
        <label>Account Type *</label>
        <div style="display:flex;gap:24px;margin-top:6px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" v-model="form.tip" value="tekuci" @change="onTipChange" />
            Tekući (current)
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" v-model="form.tip" value="devizni" @change="onTipChange" />
            Devizni (foreign currency)
          </label>
        </div>
      </div>

      <!-- Vrsta -->
      <div class="form-group" style="margin-bottom:20px">
        <label>Account Kind *</label>
        <div style="display:flex;gap:24px;margin-top:6px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" v-model="form.vrsta" value="licni" />
            Lični (personal)
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" v-model="form.vrsta" value="poslovni" />
            Poslovni (business)
          </label>
        </div>
      </div>

      <!-- Firma ID (only for poslovni) -->
      <div v-if="form.vrsta === 'poslovni'" class="form-group" style="margin-bottom:20px">
        <label>Firma ID *</label>
        <input
          v-model="form.firmaId"
          type="number"
          placeholder="Enter Firma ID"
          min="1"
        />
      </div>

      <!-- Account Name (optional) -->
      <div class="form-group" style="margin-bottom:20px">
        <label>Account Name (optional)</label>
        <input v-model="form.naziv" placeholder="e.g. My savings account" />
      </div>

      <!-- Card checkbox — disabled Sprint 2 guardrail -->
      <div class="form-group" style="margin-bottom:24px;flex-direction:row;align-items:center;gap:10px">
        <input type="checkbox" id="card-checkbox" disabled style="width:16px;height:16px" />
        <label for="card-checkbox" style="margin:0;color:#9ca3af">
          Issue debit card (available in Sprint 3)
        </label>
      </div>

      <p v-if="store.error" class="global-error" style="margin-bottom:16px">{{ store.error }}</p>

      <div style="display:flex;gap:12px">
        <button class="btn-secondary" type="button" @click="router.push('/accounts')">Cancel</button>
        <button class="btn-primary" type="button" :disabled="store.loading" @click="handleSubmit">
          {{ store.loading ? 'Creating...' : 'Create Account' }}
        </button>
      </div>
    </div>
  </div>

  <ClientSelectDialog
    v-if="showClientDialog"
    @close="showClientDialog = false"
    @selected="onClientSelected"
  />
</template>
