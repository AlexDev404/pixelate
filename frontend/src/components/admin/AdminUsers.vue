<script setup lang="ts">
import { ref } from 'vue'
import type { AdminUser } from '@/adapters/types'
import { backendAdapter } from '@/adapters/backend.adapter'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Trash2, Ban, CheckCircle, ShieldOff } from 'lucide-vue-next'

const props = defineProps<{ users: AdminUser[] }>()
const emit = defineEmits<{ refresh: [] }>()

const suspendDialogOpen = ref(false)
const suspendTarget = ref<AdminUser | null>(null)
const suspendReason = ref('')

async function deleteUser(uid: number) {
  if (!confirm('Delete this user? This cannot be undone.')) return
  await backendAdapter.adminDeleteUser(uid)
  emit('refresh')
}

async function disableUser(uid: number) {
  await backendAdapter.adminDisableUser(uid)
  emit('refresh')
}

async function enableUser(uid: number) {
  await backendAdapter.adminEnableUser(uid)
  emit('refresh')
}

function openSuspend(user: AdminUser) {
  suspendTarget.value = user
  suspendReason.value = ''
  suspendDialogOpen.value = true
}

async function confirmSuspend() {
  if (!suspendTarget.value) return
  await backendAdapter.adminSuspendUser(suspendTarget.value.id, suspendReason.value)
  suspendDialogOpen.value = false
  emit('refresh')
}

async function unsuspend(sid: number) {
  await backendAdapter.adminUnsuspendUser(sid)
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
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead class="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="user in users" :key="user.id">
          <TableCell>{{ user.id }}</TableCell>
          <TableCell class="font-medium">{{ user.name }}</TableCell>
          <TableCell>{{ new Date(user.created_at).toLocaleDateString() }}</TableCell>
          <TableCell>
            <Badge v-if="user.suspended" variant="destructive">Suspended</Badge>
            <Badge v-else-if="!user.enabled_at" variant="secondary">Disabled</Badge>
            <Badge v-else variant="default">Active</Badge>
          </TableCell>
          <TableCell class="text-right">
            <div class="flex justify-end gap-1">
              <Button v-if="user.suspended && user.suspension_id" variant="ghost" size="icon" @click="unsuspend(user.suspension_id!)" title="Unsuspend">
                <ShieldOff class="h-4 w-4" />
              </Button>
              <Button v-else-if="!user.suspended" variant="ghost" size="icon" @click="openSuspend(user)" title="Suspend">
                <Ban class="h-4 w-4" />
              </Button>
              <Button v-if="!user.enabled_at" variant="ghost" size="icon" @click="enableUser(user.id)" title="Enable">
                <CheckCircle class="h-4 w-4" />
              </Button>
              <Button v-else variant="ghost" size="icon" @click="disableUser(user.id)" title="Disable">
                <Ban class="h-4 w-4 text-yellow-500" />
              </Button>
              <Button variant="ghost" size="icon" @click="deleteUser(user.id)" title="Delete" class="text-destructive">
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
          <DialogTitle>Suspend User — {{ suspendTarget?.name }}</DialogTitle>
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
