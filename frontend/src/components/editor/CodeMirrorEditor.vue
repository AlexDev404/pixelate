<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightSpecialChars, drawSelection, dropCursor } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { markdown } from '@codemirror/lang-markdown'

const props = defineProps<{
  modelValue: string
  filename: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  save: []
}>()

const editorRef = ref<HTMLDivElement>()
const view = shallowRef<EditorView>()
const readonlyCompartment = new Compartment()
const languageCompartment = new Compartment()

function getLanguage(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'js':
    case 'mjs':
    case 'jsx':
      return javascript()
    case 'ts':
    case 'tsx':
      return javascript({ typescript: true })
    case 'html':
    case 'htm':
    case 'vue':
    case 'svelte':
      return html()
    case 'css':
    case 'scss':
      return css()
    case 'md':
    case 'markdown':
      return markdown()
    case 'json':
      return javascript()
    default:
      return javascript()
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (!editorRef.value) return

  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      highlightSpecialChars(),
      drawSelection(),
      dropCursor(),
      history(),
      foldGutter(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      languageCompartment.of(getLanguage(props.filename)),
      readonlyCompartment.of(EditorState.readOnly.of(!!props.readonly)),
      keymap.of([
        {
          key: 'Mod-s',
          run: () => {
            emit('save')
            return true
          },
        },
        ...defaultKeymap,
        ...historyKeymap,
        ...closeBracketsKeymap,
        indentWithTab,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const value = update.state.doc.toString()
          emit('update:modelValue', value)

          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            emit('change', value)
          }, 1000)
        }
      }),
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
      }),
    ],
  })

  view.value = new EditorView({
    state: startState,
    parent: editorRef.value,
  })
})

watch(() => props.modelValue, (newVal) => {
  if (!view.value) return
  const current = view.value.state.doc.toString()
  if (current !== newVal) {
    view.value.dispatch({
      changes: { from: 0, to: current.length, insert: newVal },
    })
  }
})

watch(() => props.filename, (newFilename) => {
  if (!view.value) return
  view.value.dispatch({
    effects: languageCompartment.reconfigure(getLanguage(newFilename)),
  })
})

watch(() => props.readonly, (newVal) => {
  if (!view.value) return
  view.value.dispatch({
    effects: readonlyCompartment.reconfigure(EditorState.readOnly.of(!!newVal)),
  })
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  view.value?.destroy()
})
</script>

<template>
  <div ref="editorRef" class="h-full w-full overflow-hidden" />
</template>
