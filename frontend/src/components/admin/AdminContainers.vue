<script setup lang="ts">
import type { AdminContainer } from '@/adapters/types'
import { backendAdapter } from '@/adapters/backend.adapter'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Square } from 'lucide-vue-next'

const props = defineProps<{ containers: AdminContainer[] }>()
const emit = defineEmits<{ refresh: [] }>()

async function stopContainer(image: string) {
  await backendAdapter.adminStopContainer(image)
  emit('refresh')
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Image</TableHead>
        <TableHead>Project</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Created</TableHead>
        <TableHead class="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="container in containers" :key="container.image">
        <TableCell class="font-mono text-xs">{{ container.image }}</TableCell>
        <TableCell>{{ container.project }}</TableCell>
        <TableCell>
          <Badge :variant="container.status === 'running' ? 'default' : 'secondary'">
            {{ container.status }}
          </Badge>
        </TableCell>
        <TableCell>{{ container.created }}</TableCell>
        <TableCell class="text-right">
          <Button variant="ghost" size="icon" @click="stopContainer(container.image)" title="Stop">
            <Square class="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
