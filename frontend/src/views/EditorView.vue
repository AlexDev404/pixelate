<script setup lang="ts">
import EditorPane from "@/components/editor/EditorPane.vue";
import FileTree from "@/components/editor/FileTree.vue";
import LogViewer from "@/components/editor/LogViewer.vue";
import PreviewPane from "@/components/editor/PreviewPane.vue";
import TerminalPane from "@/components/editor/TerminalPane.vue";
import ThreeColumnLayout from "@/components/layout/ThreeColumnLayout.vue";
import { Badge } from "@/components/ui/badge";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditor } from "@/composables/useEditor";
import { useWebSocket } from "@/composables/useWebSocket";
import { Loader2, Wifi, WifiOff } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const projectSlug = route.params.project as string;

const {
  dirListing,
  activeFile,
  previewUrl,
  wsConnected,
  loadProject,
  ensureContainer,
  openFile,
  createFile,
  deleteFile,
  renameFile,
  uploadFile,
} = useEditor();

const logViewer = ref<InstanceType<typeof LogViewer>>();
const previewPane = ref<InstanceType<typeof PreviewPane>>();
const bottomTab = ref<"terminal" | "logs">("terminal");

const loading = ref(true);
const loadingStatus = ref("Loading project...");
const loadError = ref("");

const { connected, connect, send, on } = useWebSocket(projectSlug);

onMounted(async () => {
  try {
    loadingStatus.value = "Loading project files...";
    await loadProject(projectSlug);

    loadingStatus.value = "Starting container...";
    const health = await ensureContainer(projectSlug);

    if (!health.healthy) {
      loadError.value = "Container failed to start. You can still edit files.";
    }

    loading.value = false;

    // Refresh preview after a short delay to give the container
    // time to accomodate port lag
    setTimeout(() => {
      previewPane.value?.refresh();
    }, 1500);
    connect();
    on("file-tree:update", (detail) => {
      const path = detail.path as string;
      if (path) {
        openFile(path);
      }
    });
  } catch (e: any) {
    loadError.value = e.message || "Failed to load project";
    loading.value = false;
  }
});

function handleSelectFile(filename: string) {
  openFile(filename);
}

function handleCreateFile(filename: string) {
  createFile(filename);
  send("create", { path: filename, isFile: true });
}

async function handleDeleteFile(filename: string) {
  if (!confirm(`Delete ${filename}?`)) return;
  await deleteFile(filename);
  send("delete", { path: filename });
  setTimeout(async () => {
    await handleRefreshTree();
  }, 1500); // Delay refresh to ensure file system changes are reflected
}

async function handleRenameFile(oldPath: string, newPath: string) {
  await renameFile(oldPath, newPath);
  send("move", { isFile: true, oldPath, newPath });
  setTimeout(async () => {
    await handleRefreshTree();
  }, 1500); // Delay refresh to ensure file system changes are reflected
}

function handleUploadFile(filename: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (file) {
    uploadFile(filename, file);
  }
}

async function handleRefreshTree() {
  await loadProject(projectSlug);
}
</script>

<template>
  <div class="h-[calc(100vh-3.5rem)] flex flex-col">
    <!-- Loading screen -->
    <div
      v-if="loading"
      class="flex-1 flex flex-col items-center justify-center gap-4"
    >
      <Loader2 class="h-10 w-10 animate-spin text-muted-foreground" />
      <p class="text-muted-foreground text-sm">{{ loadingStatus }}</p>
    </div>

    <!-- Editor -->
    <template v-else>
      <!-- Status bar -->
      <div
        class="flex items-center justify-between border-b px-4 py-1 text-xs bg-muted/30"
      >
        <span class="font-medium">{{ projectSlug }}</span>
        <div class="flex items-center gap-2">
          <Badge v-if="loadError" variant="destructive" class="text-xs py-0">
            {{ loadError }}
          </Badge>
          <Badge v-if="connected" variant="default" class="gap-1 text-xs py-0">
            <Wifi class="h-3 w-3" /> Connected
          </Badge>
          <Badge v-else variant="secondary" class="gap-1 text-xs py-0">
            <WifiOff class="h-3 w-3" /> Disconnected
          </Badge>
        </div>
      </div>

      <!-- Main editor layout -->
      <ThreeColumnLayout class="flex-1 min-h-0">
        <template #left>
          <FileTree
            :dir-listing="dirListing"
            :active-file="activeFile"
            @select-file="handleSelectFile"
            @create-file="handleCreateFile"
            @delete-file="handleDeleteFile"
            @rename-file="handleRenameFile"
            @upload-file="handleUploadFile"
            @refresh="handleRefreshTree"
          />
        </template>

        <template #center>
          <ResizablePanelGroup direction="vertical" class="h-full">
            <ResizablePanel :default-size="70" :min-size="20">
              <EditorPane @saved="previewPane?.refreshAfterSave()" />
            </ResizablePanel>
            <ResizableHandle with-handle />
            <ResizablePanel :default-size="30" :min-size="10">
              <div
                class="flex h-full flex-col border-t shadow-[0_-2px_8px_rgba(0,0,0,0.1)]"
              >
                <div class="flex items-center border-b bg-muted/40">
                  <button
                    :class="[
                      'px-3 py-1 text-xs font-medium transition-colors',
                      bottomTab === 'terminal'
                        ? 'bg-background text-foreground border-b-2 border-primary'
                        : 'text-muted-foreground hover:bg-background/50',
                    ]"
                    @click="bottomTab = 'terminal'"
                  >
                    Terminal
                  </button>
                  <button
                    :class="[
                      'px-3 py-1 text-xs font-medium transition-colors',
                      bottomTab === 'logs'
                        ? 'bg-background text-foreground border-b-2 border-primary'
                        : 'text-muted-foreground hover:bg-background/50',
                    ]"
                    @click="bottomTab = 'logs'"
                  >
                    Logs
                  </button>
                </div>
                <div class="flex-1 min-h-0">
                  <TerminalPane
                    v-show="bottomTab === 'terminal'"
                    :project-slug="projectSlug"
                  />
                  <LogViewer
                    v-show="bottomTab === 'logs'"
                    ref="logViewer"
                    :project-slug="projectSlug"
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </template>

        <template #right>
          <Tabs default-value="preview" class="h-full flex flex-col">
            <TabsList class="w-full rounded-none border-b">
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" class="flex-1 min-h-0 mt-0">
              <PreviewPane ref="previewPane" :url="previewUrl" />
            </TabsContent>
          </Tabs>
        </template>
      </ThreeColumnLayout>
    </template>
  </div>
</template>
