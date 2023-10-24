import { defineStore } from 'pinia';

interface NoteForIndex {
    id: string;
    content: string;
}

export const useNotesStore = defineStore('notes', {
    state: () => ({
        notesForIndex: [] as NoteForIndex[],
        isLoading: false,
        error: null as string | null,
    }),
    actions: {
        async fetchNotesForIndex() {
            this.isLoading = true;
            this.error = null;

            const baseUrl = import.meta.env.VITE_BASE_URL;
            const url = `${baseUrl}/getNotes`;

            try {
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`Network response was not ok, status code: ${response.status}`);
                }

                const data = (await response.json()) as NoteForIndex[];
                this.notesForIndex = data;
            } catch (error: any) {
                console.error('An error occurred while fetching notes:', error);
                this.error = error.message || 'An error occurred while fetching notes.';
            } finally {
                this.isLoading = false;
            }
        },
    },
});
