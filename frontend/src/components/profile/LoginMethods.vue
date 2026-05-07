<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Link, Unlink } from 'lucide-vue-next'

const props = defineProps<{
  services: { service: string; service_id: string }[]
  additionalServices: string[]
  allowEdit: boolean
}>()

function linkService(service: string) {
  window.location.href = `/auth/${service}?link=true`
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Login Methods</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <div v-for="svc in services" :key="svc.service" class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Link class="h-4 w-4 text-muted-foreground" />
          <span class="capitalize">{{ svc.service }}</span>
        </div>
        <Badge variant="secondary">Connected</Badge>
      </div>

      <template v-if="allowEdit">
        <div
          v-for="svc in additionalServices"
          :key="svc"
          class="flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <Unlink class="h-4 w-4 text-muted-foreground" />
            <span class="capitalize">{{ svc }}</span>
          </div>
          <Button variant="outline" size="sm" @click="linkService(svc)">
            Connect
          </Button>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
