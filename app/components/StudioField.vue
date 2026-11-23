<script setup lang="ts">
import { FieldControl, FieldRoot } from 'reka-ui'
</script>

<template>
  <FieldRoot as-child>
    <FieldControl as-child><slot /></FieldControl>
  </FieldRoot>
</template>
