<script setup lang="ts">
import type { AdminServer } from '@/adapters/types'
import { backendAdapter } from '@/adapters/backend.adapter'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Square } from 'lucide-vue-next'

const props = defineProps<{ servers: AdminServer[] }>()
const emit = defineEmits<{ refresh: [] }>()

async function stopServer(name: string) {
  await backendAdapter.adminStopServer(name)
  emit('refresh')
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>URL</TableHead>
        <TableHead>Status</TableHead>
        <TableHead class="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="server in servers" :key="server.name">
        <TableCell class="font-medium">{{ server.name }}</TableCell>
        <TableCell class="font-mono text-xs">{{ server.url }}</TableCell>
        <TableCell>
          <Badge :variant="server.status === 'running' ? 'default' : 'secondary'">
            {{ server.status }}
          </Badge>
        </TableCell>
        <TableCell class="text-right">
          <Button variant="ghost" size="icon" @click="stopServer(server.name)" title="Stop">
            <Square class="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
