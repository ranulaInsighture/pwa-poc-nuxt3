import { defineStore } from "pinia";
import axios from "axios";
import { NoteForIndex } from '~/interfaces/noteInterfaces';


export const useNotesStore = defineStore("notes", {
  state: () => ({
    notesForIndex: [] as NoteForIndex[],
    isLoading: false,
    error: null as string | null,
  }),
  getters: {
    allNotes(): NoteForIndex[] {
      return this.notesForIndex;
    },
  },
  actions: {
    async fetchNotesForIndex() {
      this.isLoading = true;
      this.error = null;
      const baseUrl: string = import.meta.env.VITE_BASE_URL as string;
      const url: string = `${baseUrl}getNotes`;

      try {
        const response = await axios.get<NoteForIndex[]>(url);
        this.notesForIndex = response.data;
        console.log("Updated notesForIndex in store:", this.notesForIndex);
      } catch (error: any) {
        console.error("An error occurred while fetching notes:", error);
        if (error.response) {
          this.error = `Network response was not ok, status code: ${error.response.status}, message: ${error.response.data}`;
        } else {
          this.error =
            error.message || "An error occurred while fetching notes.";
        }
      } finally {
        this.isLoading = false;
      }
    },
  },
});
