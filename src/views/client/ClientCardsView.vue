<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCardStore } from '../../stores/card'
import { useClientAuthStore } from '../../stores/clientAuth'
import { CARD_TYPE_LABELS, maskCardNumber, type Card } from '../../api/card'

const clientAuth = useClientAuthStore()
const cardStore = useCardStore()

const clientId = computed(() => Number(clientAuth.client?.id ?? 0))

const confirmCard = ref<Card | null>(null)
const blocking = ref(false)
const blockError = ref('')

function statusClass(s: string) {
  switch (s) {
    case 'aktivna':     return 'badge-active'
    case 'blokirana':   return 'badge-blocked'
    case 'deaktivirana': return 'badge-disabled'
    default: return 'badge-disabled'
  }
}

function statusLabel(s: string) {
  return { aktivna: 'Aktivna', blokirana: 'Blokirana', deaktivirana: 'Deaktivirana' }[s] ?? s
}

function vrstaLabel(v: string) {
  return CARD_TYPE_LABELS[v] ?? v
}

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('sr-RS')
}

function askBlock(card: Card) {
  confirmCard.value = card
  blockError.value = ''
}

function cancelBlock() {
  confirmCard.value = null
  blockError.value = ''
}

async function confirmBlock() {
  if (!confirmCard.value) return
  blocking.value = true
  blockError.value = ''
  try {
    await cardStore.blockCard(confirmCard.value.id, clientId.value)
    confirmCard.value = null
  } catch (e: any) {
    blockError.value = e.response?.data?.error || 'Greška pri blokiranju kartice.'
  } finally {
    blocking.value = false
  }
}

onMounted(async () => {
  if (clientId.value) {
    await cardStore.fetchByClient(clientId.value)
  }
})
</script>

<template>
  <div class="cv-page">
    <div class="cv-header">
      <div>
        <h1 class="cv-title">Moje kartice</h1>
        <p class="cv-subtitle">Pregled svih vaših platnih kartica</p>
      </div>
    </div>

    <div v-if="cardStore.loading" class="cv-empty">Učitavam...</div>
    <div v-else-if="cardStore.error" class="cv-error">{{ cardStore.error }}</div>

    <div v-else-if="cardStore.cards.length === 0" class="cv-empty-state">
      <div class="cv-empty-icon">💳</div>
      <h3>Nemate kartica</h3>
      <p>Obratite se banci za izdavanje platne kartice.</p>
    </div>

    <div v-else class="cv-list">
      <div v-for="card in cardStore.cards" :key="card.id" class="cv-card">
        <div class="cv-card-chip">
          <div class="cv-chip-icon">
            <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
              <rect x="0" y="6" width="32" height="12" rx="2" fill="#d4af37" opacity="0.6"/>
              <rect x="8" y="0" width="16" height="24" rx="2" fill="#d4af37" opacity="0.4"/>
              <rect x="12" y="8" width="8" height="8" rx="1" fill="#b8860b" opacity="0.7"/>
            </svg>
          </div>
        </div>

        <div class="cv-card-body">
          <div class="cv-card-number">{{ maskCardNumber(card.broj_kartice) }}</div>
          <div class="cv-card-meta">
            <span class="cv-card-name">{{ card.naziv_kartice || vrstaLabel(card.vrsta_kartice) }}</span>
            <span class="cv-card-sep">·</span>
            <span class="cv-card-type">{{ vrstaLabel(card.vrsta_kartice) }}</span>
            <span class="cv-card-sep">·</span>
            <span class="cv-card-expiry">Važi do {{ fmtDate(card.datum_isteka) }}</span>
          </div>
          <div class="cv-card-footer">
            <span :class="['cv-badge', statusClass(card.status)]">{{ statusLabel(card.status) }}</span>
            <span class="cv-account-ref">Račun #{{ card.account_id }}</span>
          </div>
        </div>

        <div class="cv-card-actions">
          <button
            v-if="card.status === 'aktivna'"
            class="cv-btn cv-btn-block"
            @click="askBlock(card)"
          >
            Blokiraj
          </button>
          <span v-else-if="card.status === 'blokirana'" class="cv-action-note">
            Kontaktirajte banku za deblokadu
          </span>
        </div>
      </div>
    </div>

    <!-- Block confirmation modal -->
    <div v-if="confirmCard" class="cv-overlay" @click.self="cancelBlock">
      <div class="cv-modal">
        <h2 class="cv-modal-title">Potvrda blokiranja</h2>
        <p class="cv-modal-text">
          Da li ste sigurni da želite da blokirate karticu<br />
          <strong>{{ maskCardNumber(confirmCard.broj_kartice) }}</strong>?
        </p>
        <p class="cv-modal-warning">
          Karticu može deblokirati samo zaposleni banke.
        </p>
        <div v-if="blockError" class="cv-error" style="margin-bottom: 12px">{{ blockError }}</div>
        <div class="cv-modal-actions">
          <button class="cv-btn cv-btn-sec" @click="cancelBlock" :disabled="blocking">Odustani</button>
          <button class="cv-btn cv-btn-block" @click="confirmBlock" :disabled="blocking">
            {{ blocking ? 'Blokiranje...' : 'Potvrdi blokiranje' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cv-page { padding: 32px; max-width: 860px; margin: 0 auto; }
.cv-header { margin-bottom: 28px; }
.cv-title { font-size: 28px; font-weight: 700; color: #0f172a; }
.cv-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }

.cv-list { display: flex; flex-direction: column; gap: 14px; }

.cv-card {
  display: flex; align-items: center; gap: 20px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
  border-radius: 16px; padding: 24px 28px;
  box-shadow: 0 4px 20px rgba(37,99,235,0.25);
  color: #fff;
}

.cv-card-chip { flex-shrink: 0; }

.cv-card-body { flex: 1; min-width: 0; }
.cv-card-number {
  font-family: 'SF Mono', 'Courier New', monospace;
  font-size: 20px; font-weight: 600; letter-spacing: 2px;
  margin-bottom: 10px; color: #e2e8f0;
}
.cv-card-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; color: #93c5fd; margin-bottom: 12px; }
.cv-card-sep { color: #60a5fa; opacity: 0.5; }
.cv-card-name { font-weight: 600; color: #dbeafe; }
.cv-card-footer { display: flex; align-items: center; gap: 12px; }
.cv-account-ref { font-size: 12px; color: #93c5fd; opacity: 0.7; }

.cv-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 700;
}
.badge-active   { background: rgba(220,252,231,0.2); color: #86efac; border: 1px solid rgba(134,239,172,0.3); }
.badge-blocked  { background: rgba(254,226,226,0.2); color: #fca5a5; border: 1px solid rgba(252,165,165,0.3); }
.badge-disabled { background: rgba(241,245,249,0.2); color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); }

.cv-card-actions { flex-shrink: 0; }
.cv-btn {
  padding: 9px 18px; border-radius: 9px; font-size: 13px;
  font-weight: 600; border: none; cursor: pointer; transition: all 0.15s;
}
.cv-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.cv-btn-block { background: #ef4444; color: #fff; }
.cv-btn-block:hover:not(:disabled) { background: #dc2626; }
.cv-btn-sec { background: #f1f5f9; color: #475569; }
.cv-btn-sec:hover:not(:disabled) { background: #e2e8f0; }
.cv-action-note { font-size: 12px; color: #93c5fd; opacity: 0.7; white-space: nowrap; }

.cv-empty { text-align: center; padding: 40px; color: #94a3b8; }
.cv-error { padding: 12px 16px; background: #fef2f2; color: #dc2626; border-radius: 8px; }
.cv-empty-state {
  text-align: center; padding: 60px 20px;
  background: #fff; border-radius: 16px; border: 1px solid #e2e8f0;
}
.cv-empty-icon { font-size: 48px; margin-bottom: 12px; }
.cv-empty-state h3 { font-size: 18px; color: #1e293b; margin-bottom: 4px; }
.cv-empty-state p { color: #64748b; font-size: 14px; }

/* Modal */
.cv-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
}
.cv-modal {
  background: #fff; border-radius: 16px; padding: 32px;
  width: 100%; max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.cv-modal-title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
.cv-modal-text { font-size: 15px; color: #334155; margin-bottom: 10px; line-height: 1.6; }
.cv-modal-warning {
  font-size: 13px; color: #92400e; background: #fef3c7;
  padding: 10px 14px; border-radius: 8px; margin-bottom: 20px;
}
.cv-modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
</style>
