<script setup lang="ts">
import { useRoute } from 'vue-router'
import DirectLoginForm from '@/components/auth/DirectLoginForm.vue'

const route = useRoute()
const uuid = route.params.uuid as string
</script>

<template>
  <div class="container px-4 py-16">
    <DirectLoginForm :uuid="uuid" />
  </div>
</template>
