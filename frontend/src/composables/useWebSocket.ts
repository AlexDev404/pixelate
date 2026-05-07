import { ref, onUnmounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { FILE_TREE_PREFIX, type WSMessageType } from '@pixelate/types'

export function useWebSocket(projectSlug: string) {
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const editorStore = useEditorStore()
  const messageHandlers = new Map<string, (detail: Record<string, unknown>) => void>()

  let keepaliveInterval: ReturnType<typeof setInterval> | null = null

  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/api/projects/${projectSlug}/ws`

    ws.value = new WebSocket(url)

    ws.value.onopen = () => {
      connected.value = true
      editorStore.wsConnected = true
      send('load', { basePath: '/' })

      keepaliveInterval = setInterval(() => {
        send('keepalive', {})
      }, 30000)
    }

    ws.value.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type && typeof msg.type === 'string') {
          const handler = messageHandlers.get(msg.type)
          if (handler) {
            handler(msg.detail || {})
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    }

    ws.value.onclose = () => {
      connected.value = false
      editorStore.wsConnected = false
      if (keepaliveInterval) {
        clearInterval(keepaliveInterval)
        keepaliveInterval = null
      }
      // Attempt reconnect after 3s
      setTimeout(() => {
        if (!connected.value) connect()
      }, 3000)
    }

    ws.value.onerror = () => {
      ws.value?.close()
    }
  }

  function send(type: WSMessageType, detail: Record<string, unknown>) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: `${FILE_TREE_PREFIX}${type}`,
        detail,
      }))
    }
  }

  function on(type: string, handler: (detail: Record<string, unknown>) => void) {
    messageHandlers.set(type, handler)
  }

  function disconnect() {
    if (keepaliveInterval) {
      clearInterval(keepaliveInterval)
      keepaliveInterval = null
    }
    ws.value?.close()
    ws.value = null
    connected.value = false
    editorStore.wsConnected = false
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    connect,
    send,
    on,
    disconnect,
  }
}
