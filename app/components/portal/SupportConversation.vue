<script setup lang="ts">
import { parseApiError } from '~/utils/api-error'
const props = defineProps<{ apiPath: string; staff?: boolean }>()
type Conversation = {
  ticket: {
    id: string
    subject: string
    category: string
    status: string
    accountName?: string
    creatorEmail?: string
    createdAt: number
  }
  messages: {
    id: string
    authorType: string
    body: string
    submissionKey: string | null
    createdAt: number
  }[]
  hasMoreMessages: boolean
}
const { data, error, pending, refresh } = await useFetch<Conversation>(() => props.apiPath, {
  watch: [() => props.apiPath],
})
const body = ref(''),
  key = ref(crypto.randomUUID()),
  busy = ref(false),
  replyError = ref(''),
  uncertain = ref(false)
const status = ref('')
watch(
  () => data.value?.ticket.status,
  (value) => {
    if (value) status.value = value
  },
  { immediate: true },
)
async function reply() {
  if (busy.value || uncertain.value) return
  busy.value = true
  replyError.value = ''
  try {
    await $fetch(`${props.apiPath}/replies`, {
      method: 'POST',
      body: { body: body.value, submissionKey: key.value },
    })
    body.value = ''
    key.value = crypto.randomUUID()
    await refresh()
  } catch (cause) {
    const problem = parseApiError(cause)
    uncertain.value = problem.ambiguous
    replyError.value = uncertain.value
      ? `${problem.text} Check this conversation before sending again.`
      : problem.text
  } finally {
    busy.value = false
  }
}
async function checkConversation() {
  if (busy.value) return
  busy.value = true
  try {
    await refresh()
    if (error.value) {
      replyError.value = parseApiError(error.value).text
      return
    }
    if (data.value?.messages.some((message) => message.submissionKey === key.value)) {
      body.value = ''
      key.value = crypto.randomUUID()
      replyError.value = ''
    } else
      replyError.value = 'The reply is not visible yet. You can retry with the same submission.'
    uncertain.value = false
  } catch (cause) {
    replyError.value = parseApiError(cause).text
  } finally {
    busy.value = false
  }
}
async function changeStatus() {
  busy.value = true
  replyError.value = ''
  try {
    await $fetch(`${props.apiPath}/status`, { method: 'PATCH', body: { status: status.value } })
    await refresh()
  } catch (cause) {
    replyError.value = `${parseApiError(cause).text} Refresh to check the current status.`
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div v-if="error" role="alert">
    <h1 class="portal-page-title">Ticket unavailable</h1>
    <p class="portal-error mt-4">{{ parseApiError(error).text }}</p>
    <button class="portal-button-secondary mt-4" @click="refresh()">Try again</button>
  </div>
  <div v-else-if="pending && !data" role="status">Loading conversation…</div>
  <div v-else-if="data">
    <p class="portal-eyebrow">Support ticket</p>
    <h1 class="portal-page-title mt-2 break-words">{{ data.ticket.subject }}</h1>
    <p class="mt-3 text-sm text-studio-muted">
      {{ data.ticket.category }} · {{ data.ticket.status.replaceAll('_', ' ') }} · Created
      <NuxtTime :datetime="data.ticket.createdAt" date-style="short" />
    </p>
    <p v-if="staff" class="mt-2 text-sm text-studio-muted">
      {{ data.ticket.accountName }} · {{ data.ticket.creatorEmail }}
    </p>
    <form
      v-if="staff"
      class="mt-7 flex max-w-xl flex-wrap items-end gap-3"
      @submit.prevent="changeStatus"
    >
      <div>
        <label class="portal-label" for="ticket-status">Status</label
        ><StudioSelect
          id="ticket-status"
          v-model="status"
          class="portal-input"
          :options="['open', 'awaiting_support', 'awaiting_customer', 'resolved', 'closed']"
        />
      </div>
      <button class="portal-button-secondary" :disabled="busy || status === data.ticket.status">
        Update status
      </button>
    </form>
    <section aria-label="Conversation" class="mt-9 max-w-3xl">
      <p v-if="data.hasMoreMessages" class="text-sm text-studio-muted">
        Showing the 500 most recent messages.
      </p>
      <ol class="mt-4 space-y-4">
        <li v-for="message in data.messages" :key="message.id" class="portal-detail">
          <p class="text-sm font-semibold">
            {{ message.authorType === 'staff' ? 'Support' : 'Customer' }}
            <span class="font-normal text-studio-muted"
              >· <NuxtTime :datetime="message.createdAt" date-style="short" time-style="medium"
            /></span>
          </p>
          <p class="mt-3 whitespace-pre-wrap break-words text-sm">{{ message.body }}</p>
        </li>
      </ol>
    </section>
    <form
      v-if="!['resolved', 'closed'].includes(data.ticket.status)"
      class="mt-10 max-w-3xl"
      @submit.prevent="reply"
    >
      <label class="portal-label" for="ticket-reply">Reply</label
      ><StudioField>
        <textarea
          id="ticket-reply"
          v-model="body"
          :readonly="busy || uncertain"
          class="portal-input min-h-36"
          aria-describedby="reply-privacy"
          required
          maxlength="10000"
        />
      </StudioField>
      <p id="reply-privacy" class="mt-1 text-xs text-studio-muted">
        Replies are visible to the ticket creator and support staff. Keep case files and
        confidential matter details out of replies.
      </p>
      <p v-if="replyError" role="alert" class="portal-error mt-4">{{ replyError }}</p>
      <button class="portal-button mt-5" :disabled="busy || uncertain">
        {{ busy ? 'Sending…' : 'Send reply' }}</button><button
        v-if="uncertain"
        type="button"
        class="portal-link ml-4"
        @click="checkConversation"
      >
        Check conversation
      </button>
    </form>
    <p v-else class="mt-8 text-sm text-studio-muted">
      This ticket is {{ data.ticket.status }}. Replies are unavailable.
    </p>
    <p
      v-if="replyError && ['resolved', 'closed'].includes(data.ticket.status)"
      role="alert"
      class="portal-error mt-4"
    >
      {{ replyError }}
    </p>
    <p v-if="pending" role="status" class="mt-4 text-sm">Refreshing conversation…</p>
  </div>
</template>
