<script setup lang="ts">
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent, PopoverClose } from 'reka-ui'
import {
  RectangleEllipsis,
  Eraser,
  Signature,
  PanelsTopLeft,
  Clock,
  ListOrdered,
  MessageSquareText,
  X,
} from '@lucide/vue'
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const tools = [
  [RectangleEllipsis, 'Password', 'Access protection', 'Set a password for the prepared output.'],
  [Eraser, 'Redaction', 'Review marked text', 'Check the redacted copy before sharing it.'],
  [Signature, 'Signature fields', 'Place a signature', 'Place a signature on the working copy.'],
  [PanelsTopLeft, 'Watermark', 'Custom opacity', 'Apply a visible mark across selected pages.'],
  [Clock, 'Timestamp', 'Date and time', 'Add a time reference to the prepared document.'],
  [
    ListOrdered,
    'Pagination',
    'Bates numbering',
    'Number pages consistently across the parts of the bundle.',
  ],
  [
    MessageSquareText,
    'Annotations',
    'Bench notes',
    'Attach comments to a working copy while preserving the original.',
  ],
] as const
</script>
<template>
  <section id="production-tools" class="studio-section alt">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.tools" layout="center" />
      <div class="utility-grid" data-enter>
        <PopoverRoot v-for="[icon, name, caption, detail] in tools" :key="name">
          <PopoverTrigger class="utility-card">
            <span class="icon-tile"><component :is="icon" /></span>
            <strong>{{ name }}</strong>
            <small>{{ caption }}</small>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent :side-offset="6" class="studio-popover">
              <strong>{{ name }}</strong>
              <p>{{ detail }}</p>
              <PopoverClose aria-label="Close details"><X :size="15" /></PopoverClose>
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>
      </div>
    </div>
  </section>
</template>
