<template>
  <h5>hi, this shows the notes</h5>
  <div v-if="isLoading">Loading...</div>
  <div v-if="error">{{ error }}</div>
  <div v-for="(note, index) in notes" :key="index">
    <p class="description">
      {{ note.text }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useNotesStore } from "@/stores/notesStore";

const notesStore = useNotesStore();
const { notesForIndex, isLoading, error, fetchNotesForIndex } = notesStore;
const notes = computed(() => notesStore.notesForIndex);

onMounted(async () => {
  await fetchNotesForIndex();
  notes.values = notesStore.notesForIndex;
  console.log("notes in component:", notes.values);
});

watch(
  () => notesStore.notesForIndex,
  (newValue, oldValue) => {
    console.log("notesForIndex changed:", newValue, "from", oldValue);
  },
);
</script>

<style scoped></style>
