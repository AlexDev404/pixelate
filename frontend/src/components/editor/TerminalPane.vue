<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const props = defineProps<{
  projectSlug: string
}>()

const containerRef = ref<HTMLDivElement>()
let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let ws: WebSocket | null = null
let resizeObserver: ResizeObserver | null = null

function connect() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = `${protocol}//${window.location.host}/ws/terminal/${props.projectSlug}`
  ws = new WebSocket(url)

  ws.onopen = () => {
    // Send initial size
    if (terminal) {
      ws!.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }))
    }
  }

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data)
      if (msg.type === 'output') {
        terminal?.write(msg.data)
      } else if (msg.type === 'error') {
        terminal?.write(`\r\n\x1b[31m${msg.data}\x1b[0m\r\n`)
      } else if (msg.type === 'exit') {
        terminal?.write(`\r\n\x1b[33m[Process exited with code ${msg.exitCode}]\x1b[0m\r\n`)
      }
    } catch {
      // ignore
    }
  }

  ws.onclose = () => {
    // Optionally reconnect
  }
}

onMounted(async () => {
  await nextTick()
  if (!containerRef.value) return

  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: '#1e1e2e',
      foreground: '#cdd6f4',
      cursor: '#f5e0dc',
      selectionBackground: '#585b7066',
    },
  })

  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(containerRef.value)
  fitAddon.fit()

  // Send input to backend
  terminal.onData((data) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data }))
    }
  })

  // Handle resize
  resizeObserver = new ResizeObserver(() => {
    if (fitAddon && terminal) {
      fitAddon.fit()
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }))
      }
    }
  })
  resizeObserver.observe(containerRef.value)

  connect()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  ws?.close()
  terminal?.dispose()
  terminal = null
  ws = null
  fitAddon = null
  resizeObserver = null
})
</script>

<template>
  <div ref="containerRef" class="h-full w-full" />
</template>
