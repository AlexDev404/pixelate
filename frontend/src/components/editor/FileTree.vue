<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores/editor'
import type { DirListing } from '@pixelate/types'
import { File, Folder, FolderOpen, Loader2, Pencil, Plus, RefreshCw, Trash2, Upload } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const editorStore = useEditorStore()
const { uploading } = storeToRefs(editorStore)

const props = defineProps<{
  dirListing: DirListing
  activeFile: string | null
}>()

const emit = defineEmits<{
  'select-file': [filename: string]
  'create-file': [filename: string]
  'delete-file': [filename: string]
  'rename-file': [oldPath: string, newPath: string]
  'upload-file': [filename: string, formData: FormData]
  'refresh': []
}>()

const expandedDirs = ref<Set<string>>(new Set())
const showNewFile = ref(false)
const newFileName = ref('')
const renamingFile = ref<string | null>(null)
const renameValue = ref('')

interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children: TreeNode[]
}

const tree = computed(() => {
  const root: TreeNode[] = []
  const dirSet = new Set(props.dirListing.dirs)

  // Add directories
  for (const dir of props.dirListing.dirs) {
    addToTree(root, dir, true)
  }

  // Add files
  for (const file of props.dirListing.files) {
    addToTree(root, file, false)
  }

  return root
})

function addToTree(nodes: TreeNode[], path: string, isDir: boolean) {
  const parts = path.split('/')
  let current = nodes
  let currentPath = ''

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    currentPath = currentPath ? `${currentPath}/${part}` : part
    const isLast = i === parts.length - 1

    let node = current.find((n) => n.name === part)
    if (!node) {
      node = {
        name: part,
        path: currentPath,
        isDir: isLast ? isDir : true,
        children: [],
      }
      current.push(node)
      current.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    }
    current = node.children
  }
}

function toggleDir(path: string) {
  if (expandedDirs.value.has(path)) {
    expandedDirs.value.delete(path)
  } else {
    expandedDirs.value.add(path)
  }
}

function submitNewFile() {
  if (newFileName.value.trim()) {
    emit('create-file', newFileName.value.trim())
    newFileName.value = ''
    showNewFile.value = false
  }
}

function startRename(file: string) {
  renamingFile.value = file
  renameValue.value = file.split('/').pop() || file
}

function submitRename(oldPath: string) {
  if (renameValue.value.trim() && renameValue.value !== oldPath.split('/').pop()) {
    const dir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/') + 1) : ''
    emit('rename-file', oldPath, dir + renameValue.value.trim())
  }
  renamingFile.value = null
}

function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  const formData = new FormData()
  formData.append('file', file)
  emit('upload-file', file.name, formData)
  input.value = ''
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b px-3 py-2">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold uppercase text-muted-foreground">Files</span>
        <Loader2 v-if="uploading" class="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      </div>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="icon" class="h-6 w-6" @click="emit('refresh')" title="Refresh">
          <RefreshCw class="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" class="h-6 w-6" @click="showNewFile = !showNewFile">
          <Plus class="h-3.5 w-3.5" />
        </Button>
        <label :class="['cursor-pointer', uploading ? 'pointer-events-none opacity-50' : '']">
          <Button variant="ghost" size="icon" class="h-6 w-6" as="span">
            <Upload class="h-3.5 w-3.5" />
          </Button>
          <input type="file" class="hidden" @change="handleUpload" :disabled="uploading" />
        </label>
      </div>
    </div>

    <div v-if="showNewFile" class="border-b px-3 py-2">
      <Input
        v-model="newFileName"
        placeholder="filename.ext"
        class="h-7 text-xs"
        @keyup.enter="submitNewFile"
        @keyup.escape="showNewFile = false"
        autofocus
      />
    </div>

    <ScrollArea class="flex-1 h-full">
      <div class="py-1">
        <template v-for="node in tree" :key="node.path">
          <FileTreeNode
            :node="node"
            :depth="0"
            :expanded-dirs="expandedDirs"
            :active-file="activeFile"
            :renaming-file="renamingFile"
            :rename-value="renameValue"
            @toggle-dir="toggleDir"
            @select-file="emit('select-file', $event)"
            @delete-file="emit('delete-file', $event)"
            @start-rename="startRename"
            @submit-rename="submitRename"
            @update:rename-value="renameValue = $event"
          />
        </template>
      </div>
    </ScrollArea>
  </div>
</template>

<script lang="ts">
import { defineComponent, h } from 'vue'

const FileTreeNode = defineComponent({
  name: 'FileTreeNode',
  props: {
    node: { type: Object as () => TreeNode, required: true },
    depth: { type: Number, required: true },
    expandedDirs: { type: Object as () => Set<string>, required: true },
    activeFile: { type: String, default: null },
    renamingFile: { type: String, default: null },
    renameValue: { type: String, default: '' },
  },
  emits: ['toggle-dir', 'select-file', 'delete-file', 'start-rename', 'submit-rename', 'update:rename-value'],
  setup(props, { emit }) {
    return () => {
      const node = props.node
      const isExpanded = props.expandedDirs.has(node.path)
      const isActive = node.path === props.activeFile
      const isRenaming = node.path === props.renamingFile
      const paddingLeft = `${(props.depth * 12) + 8}px`

      const children: any[] = []

      // Main row
      if (isRenaming) {
        children.push(
          h('div', { class: 'px-2 py-0.5', style: { paddingLeft } }, [
            h('input', {
              class: 'h-6 w-full rounded border bg-background px-1 text-xs',
              value: props.renameValue,
              onInput: (e: Event) => emit('update:rename-value', (e.target as HTMLInputElement).value),
              onKeyup: (e: KeyboardEvent) => {
                if (e.key === 'Enter') emit('submit-rename', node.path)
                if (e.key === 'Escape') emit('submit-rename', node.path)
              },
              autofocus: true,
            })
          ])
        )
      } else {
        children.push(
          h('div', {
            class: cn(
              'group flex items-center gap-1.5 px-2 py-0.5 text-sm cursor-pointer hover:bg-accent/50 rounded-sm mx-1',
              isActive && 'bg-accent text-accent-foreground'
            ),
            style: { paddingLeft },
            onClick: () => {
              if (node.isDir) emit('toggle-dir', node.path)
              else emit('select-file', node.path)
            },
          }, [
            node.isDir
              ? h(isExpanded ? FolderOpen : Folder, { class: 'h-4 w-4 shrink-0 text-muted-foreground' })
              : h(File, { class: 'h-4 w-4 shrink-0 text-muted-foreground' }),
            h('span', { class: 'truncate flex-1 text-xs' }, node.name),
            !node.isDir && h('div', { class: 'hidden group-hover:flex items-center gap-0.5' }, [
              h('button', {
                class: 'p-0.5 rounded hover:bg-muted',
                onClick: (e: Event) => { e.stopPropagation(); emit('start-rename', node.path) },
              }, [h(Pencil, { class: 'h-3 w-3' })]),
              h('button', {
                class: 'p-0.5 rounded hover:bg-muted text-destructive',
                onClick: (e: Event) => { e.stopPropagation(); emit('delete-file', node.path) },
              }, [h(Trash2, { class: 'h-3 w-3' })]),
            ]),
          ])
        )
      }

      // Children
      if (node.isDir && isExpanded) {
        for (const child of node.children) {
          children.push(
            h(FileTreeNode, {
              node: child,
              depth: props.depth + 1,
              expandedDirs: props.expandedDirs,
              activeFile: props.activeFile,
              renamingFile: props.renamingFile,
              renameValue: props.renameValue,
              'onToggle-dir': (p: string) => emit('toggle-dir', p),
              'onSelect-file': (p: string) => emit('select-file', p),
              'onDelete-file': (p: string) => emit('delete-file', p),
              'onStart-rename': (p: string) => emit('start-rename', p),
              'onSubmit-rename': (p: string) => emit('submit-rename', p),
              'onUpdate:rename-value': (v: string) => emit('update:rename-value', v),
            })
          )
        }
      }

      return h('div', children)
    }
  },
})
</script>
