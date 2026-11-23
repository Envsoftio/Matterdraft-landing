<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
import { licencePrice } from '~/utils/licence-price'

definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Licence plans', 'Manage the MatterDraft Studio licence catalogue.')

const { data, error, refresh } = await useFetch('/api/internal/plans')
type Plan = NonNullable<typeof data.value>['plans'][number]

const editor = ref<{
  id?: string
  revision?: number
  name: string
  description: string
  accountType: string
  price: string
}>()
const busy = ref(false)
const editingError = ref('')
const notice = ref('')
const pendingArchive = ref<Plan>()
const formTitle = ref<HTMLElement>()

async function edit(plan?: Plan) {
  pendingArchive.value = undefined
  editingError.value = ''
  notice.value = ''
  editor.value = plan
    ? {
        id: plan.id,
        revision: plan.revision,
        name: plan.name,
        description: plan.description,
        accountType: plan.accountType,
        price: String(plan.monthlyDevicePrice / 100),
      }
    : { name: '', description: '', accountType: 'personal', price: '' }
  await nextTick()
  formTitle.value?.focus()
}

async function update(body: Record<string, unknown>, message: string) {
  busy.value = true
  notice.value = ''
  editingError.value = ''
  try {
    await $fetch('/api/internal/plans', { method: 'POST', body })
    editor.value = undefined
    pendingArchive.value = undefined
    notice.value = message
    await refresh()
  } catch (problem) {
    editingError.value = parseApiError(problem).text
  } finally {
    busy.value = false
  }
}

function save() {
  const plan = editor.value
  if (!plan) return
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(plan.price.trim()) || Number(plan.price) <= 0) {
    editingError.value = 'Enter a monthly price in rupees, with up to two decimal places.'
    return
  }
  return update(
    {
      action: plan.id ? 'edit' : 'create',
      id: plan.id,
      revision: plan.revision,
      name: plan.name,
      description: plan.description,
      accountType: plan.accountType,
      monthlyDevicePrice: Math.round(Number(plan.price) * 100),
    },
    'Draft saved.',
  )
}
</script>

<template>
  <div class="portal-content">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="portal-page-title">Licence plans</h1>
      <button v-if="data" class="portal-button" type="button" :disabled="busy" @click="edit()">
        New plan
      </button>
    </header>
    <div v-if="error" role="alert" class="portal-error mt-6">
      {{ parseApiError(error).text }}
      <button type="button" class="portal-link ml-2" @click="refresh()">Try again</button>
    </div>

    <template v-else-if="data">
      <p v-if="notice" class="portal-notice mt-6" role="status">{{ notice }}</p>
      <p v-if="editingError && !editor" class="portal-error mt-6" role="alert">
        {{ editingError }}
      </p>

      <div
        class="mt-8 grid items-start gap-5"
        :class="editor ? 'xl:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]' : ''"
      >
        <section v-if="editor" class="portal-detail xl:order-2" aria-labelledby="plan-form-heading">
          <h2
            id="plan-form-heading"
            ref="formTitle"
            tabindex="-1"
            class="font-heading text-xl font-semibold"
          >
            {{ editor.id ? 'Edit draft' : 'New licence plan' }}
          </h2>
          <form class="mt-5 space-y-4" @submit.prevent="save">
            <div>
              <label for="plan-name" class="portal-label">Plan name</label>
              <StudioField
                ><input
                  id="plan-name"
                  v-model="editor.name"
                  class="portal-input"
                  maxlength="80"
                  required
              /></StudioField>
            </div>
            <div>
              <label for="plan-description" class="portal-label">Description</label>
              <StudioField>
                <textarea
                  id="plan-description"
                  v-model="editor.description"
                  class="portal-input"
                  rows="3"
                  maxlength="700"
                  required
                />
              </StudioField>
            </div>
            <div>
              <label for="plan-account" class="portal-label">Available to</label>
              <StudioSelect
                id="plan-account"
                v-model="editor.accountType"
                class="portal-input normal-case!"
                :options="[
                  { value: 'personal', label: 'Personal accounts' },
                  { value: 'organisation', label: 'Organisation accounts' },
                ]"
              />
            </div>
            <div>
              <label for="plan-price" class="portal-label">Price per device per month (₹)</label>
              <StudioField
                ><input
                  id="plan-price"
                  v-model="editor.price"
                  class="portal-input"
                  inputmode="decimal"
                  maxlength="9"
                  required
              /></StudioField>
            </div>
            <p v-if="editingError" role="alert" class="portal-error">{{ editingError }}</p>
            <div class="flex flex-wrap gap-3">
              <button type="submit" class="portal-button" :disabled="busy">Save draft</button>
              <button
                type="button"
                class="portal-button-secondary"
                :disabled="busy"
                @click="editor = undefined"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>

        <ul v-if="data.plans.length" class="portal-detail min-w-0 divide-y divide-studio-rule">
          <li v-for="plan in data.plans" :key="plan.id" class="py-5 first:pt-0 last:pb-0">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <p class="text-sm capitalize text-studio-muted">
                  {{ plan.status }} · {{ plan.accountType }}
                </p>
                <h2 class="mt-1 break-words font-heading text-lg font-semibold">{{ plan.name }}</h2>
                <p class="mt-1 text-sm tabular-nums">
                  {{ licencePrice(plan.monthlyDevicePrice) }} / device / month
                </p>
                <p class="mt-2 text-sm break-words whitespace-pre-line text-studio-muted">
                  {{ plan.description }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <template v-if="plan.status === 'draft'">
                  <button
                    type="button"
                    class="portal-button-secondary"
                    :disabled="busy"
                    :aria-label="`Edit ${plan.name}`"
                    @click="edit(plan)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="portal-button"
                    :disabled="busy || Boolean(editor)"
                    :aria-label="`Publish ${plan.name}`"
                    @click="
                      update(
                        { action: 'publish', id: plan.id, revision: plan.revision },
                        'Plan published.',
                      )
                    "
                  >
                    Publish
                  </button>
                </template>
                <button
                  v-else-if="plan.status === 'published' && pendingArchive?.id !== plan.id"
                  type="button"
                  class="portal-button-secondary"
                  :disabled="busy || Boolean(editor)"
                  :aria-label="`Archive ${plan.name}`"
                  @click="pendingArchive = plan"
                >
                  Archive
                </button>
              </div>
            </div>
            <div
              v-if="pendingArchive?.id === plan.id"
              class="mt-4 rounded-lg border border-studio-rule p-4"
            >
              <p class="text-sm">Archive this plan to remove it from the available plans.</p>
              <div class="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  class="portal-button"
                  :disabled="busy"
                  @click="
                    update(
                      { action: 'archive', id: plan.id, revision: plan.revision },
                      'Plan archived.',
                    )
                  "
                >
                  Confirm archive
                </button>
                <button
                  type="button"
                  class="portal-button-secondary"
                  :disabled="busy"
                  @click="pendingArchive = undefined"
                >
                  Cancel
                </button>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="portal-detail text-sm text-studio-muted">
          No licence plans yet. Create a draft to get started.
        </p>
      </div>
    </template>
  </div>
</template>
