<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from 'reka-ui'
import { FileText, Workflow } from '@lucide/vue'
import { featureHeadings } from '~/data/feature-headings'
import { numberedDocuments, categories, matterName } from '~/data/example-matter'
import SectionHeading from './SectionHeading.vue'
const tabs = ['Documents', 'Categories', 'Generated', 'Parts (4)']
const inspected = ref<(typeof numberedDocuments)[number]>()
</script>
<template>
  <section id="matter-workspace" class="studio-section alt">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.workspace" />
      <TabsRoot default-value="Documents" class="matter-table panel" data-enter>
        <div class="table-top">
          <h3>
            <Workflow />
            Sample matter / {{ matterName }}
          </h3>
          <TabsList aria-label="Matter workspace view">
            <TabsTrigger v-for="tab in tabs" :key="tab" :value="tab">{{ tab }}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="Documents" class="table-scroll">
          <table>
            <thead>
              <tr>
                <th
                  v-for="title in ['Document name', 'Category', 'Pages', 'Bundle status', 'Action']"
                  :key="title"
                >
                  {{ title }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="doc in numberedDocuments"
                :key="doc.name"
                :class="{ highlighted: doc.name === 'Agreement' }"
              >
                <th scope="row">
                  <span>
                    <FileText />
                    {{ doc.name === 'Agreement' ? 'Annexure A · Agreement' : doc.name }}
                  </span>
                </th>
                <td>{{ categories[doc.part] }}</td>
                <td>{{ doc.pages }} pp</td>
                <td><b class="status-tag">Included</b></td>
                <td>
                  <button class="text-action" :aria-label="'Inspect ' + doc.name" @click="inspected = doc">
                    Inspect
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </TabsContent>
        <TabsContent v-for="tab in ['Categories', 'Parts (4)']" :key="tab" :value="tab" class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ tab === 'Categories' ? 'Category' : 'Bundle part' }}</th>
                <th>Documents</th>
                <th>Pages</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(name, i) in categories" :key="name">
                <th scope="row">{{ tab === 'Categories' ? name : 'Part 0' + (i + 1) + ' · ' + name }}</th>
                <td>
                  {{
                    numberedDocuments
                      .filter((d) => d.part === i)
                      .map((d) => d.name)
                      .join(', ')
                  }}
                </td>
                <td>
                  {{ numberedDocuments.filter((d) => d.part === i).reduce((sum, d) => sum + d.pages, 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </TabsContent>
        <TabsContent value="Generated" class="generated-files">
          <FileText />
          <div>
            <h3>Procedural application</h3>
            <p>Generate a document using the fields from this matter.</p>
            <a class="text-action" href="#document-generation">Open template preview →</a>
          </div>
        </TabsContent>
        <div class="table-foot">
          <span>196 pages across 4 parts in this sample.</span>
        </div>
      </TabsRoot>
      <DialogRoot
        :open="!!inspected"
        @update:open="
          (open) => {
            if (!open) inspected = undefined
          }
        "
      >
        <DialogPortal>
          <DialogOverlay class="studio-overlay" />
          <DialogContent v-if="inspected" class="studio-dialog">
            <DialogTitle>{{ inspected.name }}.pdf</DialogTitle>
            <DialogDescription>
              {{ categories[inspected.part] }} · {{ inspected.pages }} pages
            </DialogDescription>
            <p>
              Included in part {{ inspected.part + 1 }}, bundle pages {{ inspected.start }}–{{
                inspected.end
              }}.
            </p>
            <DialogClose class="action secondary">Close</DialogClose>
          </DialogContent>
        </DialogPortal>
      </DialogRoot>
    </div>
  </section>
</template>
