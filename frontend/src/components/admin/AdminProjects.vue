<script setup lang="ts">
import { ref } from 'vue'
import type { AdminProject } from '@/adapters/types'
import { backendAdapter } from '@/adapters/backend.adapter'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Trash2, Ban, ShieldOff } from 'lucide-vue-next'

const props = defineProps<{ projects: AdminProject[] }>()
const emit = defineEmits<{ refresh: [] }>()

const suspendDialogOpen = ref(false)
const suspendTarget = ref<AdminProject | null>(null)
const suspendReason = ref('')

async function deleteProject(pid: number) {
  if (!confirm('Delete this project? This cannot be undone.')) return
  await backendAdapter.adminDeleteProject(pid)
  emit('refresh')
}

function openSuspend(project: AdminProject) {
  suspendTarget.value = project
  suspendReason.value = ''
  suspendDialogOpen.value = true
}

async function confirmSuspend() {
  if (!suspendTarget.value) return
  await backendAdapter.adminSuspendProject(suspendTarget.value.id, suspendReason.value)
  suspendDialogOpen.value = false
  emit('refresh')
}

async function unsuspend(sid: number) {
  await backendAdapter.adminUnsuspendProject(sid)
  emit('refresh')
}
</script>

<template>
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead class="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="project in projects" :key="project.id">
          <TableCell>{{ project.id }}</TableCell>
          <TableCell class="font-medium">{{ project.name }}</TableCell>
          <TableCell>{{ project.owner }}</TableCell>
          <TableCell>{{ new Date(project.created_at).toLocaleDateString() }}</TableCell>
          <TableCell>
            <Badge v-if="project.suspended" variant="destructive">Suspended</Badge>
            <Badge v-else variant="default">Active</Badge>
          </TableCell>
          <TableCell class="text-right">
            <div class="flex justify-end gap-1">
              <Button v-if="project.suspended && project.suspension_id" variant="ghost" size="icon" @click="unsuspend(project.suspension_id!)" title="Unsuspend">
                <ShieldOff class="h-4 w-4" />
              </Button>
              <Button v-else variant="ghost" size="icon" @click="openSuspend(project)" title="Suspend">
                <Ban class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="deleteProject(project.id)" title="Delete" class="text-destructive">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <Dialog :open="suspendDialogOpen" @update:open="suspendDialogOpen = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend Project — {{ suspendTarget?.name }}</DialogTitle>
          <DialogDescription>Provide a reason for the suspension.</DialogDescription>
        </DialogHeader>
        <Input v-model="suspendReason" placeholder="Reason for suspension" />
        <DialogFooter>
          <Button variant="outline" @click="suspendDialogOpen = false">Cancel</Button>
          <Button variant="destructive" @click="confirmSuspend">Suspend</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
