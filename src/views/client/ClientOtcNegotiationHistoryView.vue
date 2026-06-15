<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useClientAuthStore } from '../../stores/clientAuth'
import {
  otcApi,
  type OtcOffer,
  type OtcOfferStatus,
  type OtcNegotiationEntry,
} from '../../api/otc'

const authStore = useClientAuthStore()

const negotiations = ref<OtcOffer[]>([])
const loading = ref(false)
const error = ref('')

// Filters
const statusFilter = ref<OtcOfferStatus>('')
const fromFilter = ref('')
const toFilter = ref('')
const counterpartyFilter = ref('')

// Expanded-row history
const expandedOfferId = ref<number | null>(null)
const historyEntries = ref<OtcNegotiationEntry[]>([])
const historyLoading = ref(false)
const historyError = ref('')

const statuses: Array<{ value: OtcOfferStatus; label: string }> = [
  { value: '', label: 'Svi statusi' },
  { value: 'accepted', label: 'Prihvaćene' },
  { value: 'declined', label: 'Odbijene' },
  { value: 'cancelled', label: 'Otkazane' },
  { value: 'pending', label: 'Aktivne' },
]

const moneyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const quantityFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const currentClientId = computed(() => Number(authStore.client?.id || 0))

function fmtMoney(value: number) {
  return moneyFormatter.format(value)
}
function fmtQuantity(value: number) {
  return quantityFormatter.format(value)
}
function fmtDate(value: string) {
  return new Date(value).toLocaleDateString('sr-RS')
}
function fmtDateTime(value: string) {
  return new Date(value).toLocaleString('sr-RS')
}

function isBuyer(offer: OtcOffer) {
  return offer.buyerType === 'client' && offer.buyerId === currentClientId.value
}
function role(offer: OtcOffer) {
  return isBuyer(offer) ? 'Kupac' : 'Prodavac'
}
function counterparty(offer: OtcOffer) {
  return isBuyer(offer)
    ? `#${offer.sellerId} / ${offer.sellerType}`
    : `#${offer.buyerId} / ${offer.buyerType}`
}

function statusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Aktivna'
    case 'accepted':
      return 'Prihvaćena'
    case 'declined':
      return 'Odbijena'
    case 'cancelled':
      return 'Otkazana'
    default:
      return status
  }
}

function actionLabel(action: string) {
  switch (action) {
    case 'created':
      return 'Inicijalna ponuda'
    case 'countered':
      return 'Kontraponuda'
    case 'accepted':
      return 'Prihvaćeno'
    case 'declined':
      return 'Odbijeno'
    case 'cancelled':
      return 'Otkazano'
    default:
      return action
  }
}

async function fetchNegotiations() {
  loading.value = true
  error.value = ''
  expandedOfferId.value = null
  try {
    const res = await otcApi.listNegotiations({
      status: statusFilter.value || undefined,
      from: fromFilter.value || undefined,
      to: toFilter.value || undefined,
      counterparty: counterpartyFilter.value ? Number(counterpartyFilter.value) : undefined,
    })
    negotiations.value = res.data.negotiations || []
  } catch {
    error.value = 'Nije moguće učitati istoriju pregovora.'
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  statusFilter.value = ''
  fromFilter.value = ''
  toFilter.value = ''
  counterpartyFilter.value = ''
  fetchNegotiations()
}

async function toggleHistory(offer: OtcOffer) {
  if (expandedOfferId.value === offer.id) {
    expandedOfferId.value = null
    return
  }
  expandedOfferId.value = offer.id
  historyEntries.value = []
  historyError.value = ''
  historyLoading.value = true
  try {
    const res = await otcApi.getNegotiationHistory(offer.id)
    historyEntries.value = res.data.entries || []
  } catch {
    historyError.value = 'Nije moguće učitati detalje pregovora.'
  } finally {
    historyLoading.value = false
  }
}

onMounted(fetchNegotiations)
</script>

<template>
  <div class="otc-page">
    <div class="page-header">
      <div>
        <p class="eyebrow">OTC portal</p>
        <h1>Istorija pregovora</h1>
        <p>Kompletna istorija OTC ponuda u kojima ste učestvovali, sa svakom kontraponudom (stare i nove vrednosti).</p>
      </div>
      <div class="header-actions">
        <RouterLink to="/client/otc/offers" class="secondary-link">Aktivne ponude</RouterLink>
        <RouterLink to="/client/otc/contracts" class="primary-link">Sklopljeni ugovori</RouterLink>
      </div>
    </div>

    <section class="panel filters">
      <label>
        Status
        <select v-model="statusFilter">
          <option v-for="s in statuses" :key="s.value || 'all'" :value="s.value">{{ s.label }}</option>
        </select>
      </label>
      <label>
        Od
        <input v-model="fromFilter" type="date" />
      </label>
      <label>
        Do
        <input v-model="toFilter" type="date" />
      </label>
      <label>
        Druga strana (ID)
        <input v-model="counterpartyFilter" type="number" min="1" placeholder="npr. 5" />
      </label>
      <div class="filter-actions">
        <button class="submit-btn" @click="fetchNegotiations">Primeni</button>
        <button class="secondary-btn" @click="resetFilters">Poništi</button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Pregovori</h2>
          <span class="panel-meta">Klikni na red da vidiš timeline kontraponuda.</span>
        </div>
        <span class="panel-meta">{{ negotiations.length }} pregovora</span>
      </div>

      <div v-if="loading" class="empty-state">Učitavam pregovore...</div>
      <div v-else-if="error" class="error-box">{{ error }}</div>
      <div v-else-if="negotiations.length === 0" class="empty-state">Nema pregovora za izabrani filter.</div>
      <div v-else class="table-wrap">
        <table class="otc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Uloga</th>
              <th>Druga strana</th>
              <th>Ticker</th>
              <th>Količina</th>
              <th>Cena</th>
              <th>Premija</th>
              <th>Settlement</th>
              <th>Status</th>
              <th>Poslednja izmena</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="offer in negotiations" :key="offer.id">
              <tr class="clickable" @click="toggleHistory(offer)">
                <td class="offer-id">#{{ offer.id }}</td>
                <td>{{ role(offer) }}</td>
                <td>{{ counterparty(offer) }}</td>
                <td>
                  <div class="ticker">{{ offer.ticker }}</div>
                  <div class="asset-meta">{{ offer.exchange.currency }}</div>
                </td>
                <td>{{ fmtQuantity(offer.amount) }}</td>
                <td>{{ fmtMoney(offer.pricePerStock) }}</td>
                <td>{{ fmtMoney(offer.premium) }}</td>
                <td>{{ fmtDate(offer.settlementDate) }}</td>
                <td><span class="status-pill" :class="offer.status">{{ statusLabel(offer.status) }}</span></td>
                <td class="asset-meta">{{ fmtDateTime(offer.lastModified) }}</td>
                <td class="expand-cell">{{ expandedOfferId === offer.id ? '▲' : '▼' }}</td>
              </tr>
              <tr v-if="expandedOfferId === offer.id" class="history-row">
                <td colspan="11">
                  <div v-if="historyLoading" class="empty-inline">Učitavam timeline...</div>
                  <div v-else-if="historyError" class="error-box" style="margin:0">{{ historyError }}</div>
                  <div v-else-if="historyEntries.length === 0" class="empty-inline">Nema zabeleženih koraka.</div>
                  <ol v-else class="timeline">
                    <li v-for="entry in historyEntries" :key="entry.id">
                      <div class="timeline-head">
                        <span class="timeline-action" :class="entry.action">{{ actionLabel(entry.action) }}</span>
                        <span class="timeline-actor">#{{ entry.actorId }} / {{ entry.actorType }}</span>
                        <span class="timeline-time">{{ fmtDateTime(entry.createdAt) }}</span>
                      </div>
                      <div class="timeline-terms">
                        <span>Količina: <strong>{{ fmtQuantity(entry.amount) }}</strong>
                          <em v-if="entry.prevAmount != null && entry.prevAmount !== entry.amount"> (bilo {{ fmtQuantity(entry.prevAmount) }})</em>
                        </span>
                        <span>Cena: <strong>{{ fmtMoney(entry.pricePerStock) }}</strong>
                          <em v-if="entry.prevPricePerStock != null && entry.prevPricePerStock !== entry.pricePerStock"> (bilo {{ fmtMoney(entry.prevPricePerStock) }})</em>
                        </span>
                        <span>Premija: <strong>{{ fmtMoney(entry.premium) }}</strong>
                          <em v-if="entry.prevPremium != null && entry.prevPremium !== entry.premium"> (bilo {{ fmtMoney(entry.prevPremium) }})</em>
                        </span>
                        <span>Settlement: <strong>{{ fmtDate(entry.settlementDate) }}</strong>
                          <em v-if="entry.prevSettlementDate && entry.prevSettlementDate !== entry.settlementDate"> (bilo {{ fmtDate(entry.prevSettlementDate) }})</em>
                        </span>
                      </div>
                    </li>
                  </ol>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.otc-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 30px;
}

.page-header p:not(.eyebrow) {
  margin: 8px 0 0;
  color: #64748b;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.primary-link,
.secondary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
}

.primary-link {
  background: #0f172a;
  color: #fff;
}

.secondary-link {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
}

.panel {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  padding: 24px;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
}

.filters label {
  display: grid;
  gap: 6px;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.filters select,
.filters input {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 9px 12px;
  color: #0f172a;
  font: inherit;
  min-width: 150px;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
}

.panel-meta {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.empty-state,
.error-box,
.empty-inline {
  border-radius: 12px;
  padding: 18px;
  color: #64748b;
  background: #f8fafc;
}

.error-box {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.table-wrap {
  overflow-x: auto;
}

.otc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.otc-table th,
.otc-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

.otc-table th {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  background: #f8fafc;
}

.offer-id,
.ticker {
  color: #1d4ed8;
  font-weight: 800;
}

.asset-meta {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
}

.expand-cell {
  color: #94a3b8;
}

.status-pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px 9px;
  background: #e2e8f0;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
}

.status-pill.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-pill.accepted {
  background: #dcfce7;
  color: #166534;
}

.status-pill.declined,
.status-pill.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.history-row td {
  background: #f8fafc;
  white-space: normal;
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 4px 0 4px 4px;
  display: grid;
  gap: 12px;
}

.timeline li {
  border-left: 3px solid #cbd5e1;
  padding: 4px 0 4px 14px;
}

.timeline-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.timeline-action {
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 12px;
  font-weight: 800;
  background: #e2e8f0;
  color: #334155;
}

.timeline-action.created {
  background: #e0e7ff;
  color: #3730a3;
}

.timeline-action.countered {
  background: #fef3c7;
  color: #92400e;
}

.timeline-action.accepted {
  background: #dcfce7;
  color: #166534;
}

.timeline-action.declined,
.timeline-action.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.timeline-actor {
  color: #475569;
  font-weight: 700;
  font-size: 13px;
}

.timeline-time {
  color: #94a3b8;
  font-size: 12px;
}

.timeline-terms {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #475569;
  font-size: 13px;
}

.timeline-terms em {
  color: #b45309;
  font-style: italic;
}

.submit-btn {
  background: #0f172a;
  color: #fff;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
}

.secondary-btn {
  background: #f1f5f9;
  color: #475569;
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
}

@media (max-width: 900px) {
  .page-header,
  .panel-head {
    flex-direction: column;
  }
}
</style>
