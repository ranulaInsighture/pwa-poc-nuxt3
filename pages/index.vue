<template>
  <nav>
    <button class="custom-button" @click="showNotes">Show Notes</button>
    <button class="custom-button" @click="showImages">Show Images</button>
    <button
      class="custom-button"
      title="For testing purposes, this will  generate a large
      JSON file and store in IndexedDB."
    >
      Generate and Store Large JSON
    </button>
    <button class="status" :class="{ online: isOnline, offline: !isOnline }">
      {{ onlineStatus }}
    </button>
  </nav>

  <main>
    <div class="container">
      <div class="imagePreview-row" v-if="displayImageButton">
        <div
          v-for="(data, index) in images.values"
          :key="index"
          class="imagePreview-col"
        >
          <div class="imagePreview-card">
            <div class="imagePreview-container">
              <img
                :src="data.imageText"
                alt="showing image"
                class="imagePreview-img"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row row-custom" v-if="displayNoteButton">
      <div class="content-card">
        <h2 class="title">Added Notes</h2>
        <FileUploadPreviewl />
      </div>
      <!--      <div class="content-card">-->
      <!--        <h2 class="title">Added Notes</h2>-->
      <!--        <div v-for="(item, index) in tempData" :key="index">-->
      <!--          <p class="description">-->
      <!--            {{ item.text }}-->
      <!--          </p>-->
      <!--        </div>-->
      <!--      </div>-->
    </div>
    <div class="row">
      <button
        v-if="displayNoteButton"
        class="add-buttons"
        @click="showNoteUpload"
      >
        Add Note
      </button>
      <button
        v-else-if="displayImageButton"
        class="add-buttons"
        @click="showImageUpload"
      >
        Add Images
      </button>
    </div>
  </main>

  <!-- Modal for add notes -->
  <div v-if="showNoteModal" class="modal-overlay">
    <div class="modal-custom-display">
      <h2>Add a note</h2>
      <textarea v-model="noteText" placeholder="Enter text..."></textarea>
      <div class="modal-actions">
        <button @click="showNoteModal = false">Cancel</button>
        <button @click="submitNote()">Submit</button>
      </div>
    </div>
  </div>

  <!-- Modal for add images -->
  <div v-if="showImageModal" class="modal-overlay">
    <div class="modal-custom-display p-4 bg-white rounded shadow">
      <h2 class="text-center mb-4">Upload Images</h2>

      <div class="mb-3">
        <input
          type="file"
          name="image"
          id="image"
          accept="image/*"
          @change="onFileChange"
          ref="imageUploader"
          class="form-control"
        />
      </div>

      <div class="row mb-3">
        <div class="col-lg-12 mb-2">
          <button
            v-if="!showVideo"
            @click="accessCamera"
            class="btn btn-primary w-100"
          >
            Access Webcam
          </button>
        </div>
        <div class="col-lg-12">
          <video
            v-if="showVideo"
            ref="videoElement"
            autoplay
            class="w-100 mb-2 rounded"
          ></video>
          <button
            v-if="showVideo"
            @click="captureImageFromWebcam"
            class="btn btn-secondary w-100"
          >
            Capture Image
          </button>
        </div>
      </div>

      <div v-if="imageSrc" class="image-preview mb-3">
        <img :src="imageSrc" alt="Selected Image" class="img-fluid rounded" />
      </div>

      <div class="modal-actions text-center">
        <button @click="disableImageFeatures()" class="btn btn-danger me-2">
          Cancel
        </button>
        <button v-if="imageFile" @click="uploadImage()" class="btn btn-success">
          Save
        </button>
      </div>
    </div>
  </div>

  <VitePwaManifest />
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive } from "vue-demi";
import { useNotesStore } from "~/stores/notesStore";
import FileUploadPreviewl from "@/components/previews/file-upload-previewl.vue";
import localforage from "localforage";
import ImageCompressor from "image-compressor.js"; //todo - cant we use this in Nuxt with serverside rendering ?
import { useOnline } from "@vueuse/core"; //todo have add this

const baseUrl = import.meta.env.VITE_BASE_URL;
const isOnline = ref(true);
const onlineStatus = computed(() => (isOnline.value ? "Online" : "Offline")); //todo what nuxt provide to identify browser status
const displayNoteButton = ref(false);
const displayImageButton = ref(false);
const showNoteModal = ref(false);
const showImageModal = ref(false);
const noteText = ref("");
const imageFile = ref<File | null>(null);
const imageSrc = ref<string>("");
const images = reactive([]);
const tempData = ref<any[]>([]);
const showVideo = ref(false);
const stream = ref<MediaStream | null>(null);
const videoElement = ref<HTMLVideoElement | null>(null);
const { fetchNotesForIndex, notesForIndex, isLoading, error } = useNotesStore();

// Lifecycle hooks for component mount and unmount events
onMounted(() => {
  if (process.client) {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    window.addEventListener("online", uploadOfflineImages);
    syncNoteWhenOnline();
    // fetchNotes();
    // fetchImage();
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);
    window.addEventListener("online", uploadOfflineImages);
  }
});

//for images
const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files ? input.files[0] : null;

  if (file) {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target) {
        imageSrc.value = e.target.result as string;
        imageFile.value = file;
      }
    };

    reader.readAsDataURL(file);
  }
};
const uploadImage = async () => {
  if (!imageFile.value) return;
  if (process.client) {
    const compressor = new ImageCompressor();
    const compressedFile = await compressor.compress(imageFile.value, {
      quality: 0.4,
      maxWidth: 100,
      maxHeight: 100,
    });

    const reader = new FileReader();

    reader.addEventListener("loadend", async () => {
      const imageData = reader.result as string;
      if (process.client) {
        if (!navigator.onLine) {
          const offlineImages: string[] =
            (await localforage.getItem("offlineImages")) || [];
          offlineImages.push(imageData);
          await localforage.setItem("offlineImages", offlineImages);
          disableImageFeatures();
          alert("Image stored offline. Will be uploaded when online.");
        } else {
          await uploadToServer(imageData);
        }
      }
    });
    reader.readAsDataURL(compressedFile);
  }
};

const uploadToServer = async (imageData: string) => {
  try {
    const url = `${baseUrl}uploadImage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageText: imageData, timestamp: Date.now() }),
    });

    if (response.ok) {
      disableImageFeatures();
      alert("Image uploaded successfully.");
      await fetchImage();
    } else {
      showImageModal.value = false;
      console.error("Failed to upload image.");
    }
  } catch (error) {
    console.error("Error uploading image:", error);
  }
};

const fetchImage = async () => {
  try {
    const url = `${baseUrl}getImages`;
    const response = await fetch(url);
    if (response.status === 200) {
      const data = await response.json();
      images.values = data;
    } else {
      throw new Error("Failed to fetch data");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    loading.value = false;
  }
};

const uploadOfflineImages = async () => {
  let offlineImages: string[] | null =
    await localforage.getItem("offlineImages");
  if (offlineImages && offlineImages.length > 0) {
    for (const offlineImage of offlineImages) {
      await uploadToServer(offlineImage);
    }

    // Clear the offlineImages array in IndexedDB after all uploads
    await localforage.removeItem("offlineImages");
  }
};
const showImages = () => {
  displayImageButton.value = true;
  displayNoteButton.value = false;
  showImageModal.value = false;
};

const showImageUpload = () => {
  showImageModal.value = true;
  showNoteModal.value = false;
};

const disableImageFeatures = () => {
  showImageModal.value = false;
  imageSrc.value = "";
  showVideo.value = false;
  stopCamera();
};

const updateOnlineStatus = () => {
  if (process.client) {
    isOnline.value = navigator.onLine;
  }
};

const accessCamera = async () => {
  try {
    if (process.client) {
      stream.value = await navigator.mediaDevices.getUserMedia({ video: true });
      showVideo.value = true;
      onMounted(() => {
        if (videoElement.value) {
          videoElement.value.srcObject = stream.value;
        }
      });
    }
  } catch (err) {
    console.error("Error accessing the camera", err);
  }
};

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
    showVideo.value = false;
  }
};

// for the notes
const showNotes = () => {
  displayNoteButton.value = true;
  displayImageButton.value = false;
  showNoteModal.value = false;
};

const showNoteUpload = () => {
  showImageModal.value = false;
  showNoteModal.value = true;
};

const submitNote = async (note?: string) => {
  const textToSubmit = note || noteText.value.trim();
  if (process.client) {
    if (!navigator.onLine) {
      await saveNoteOffline(textToSubmit);
    } else {
      try {
        const url = `${baseUrl}addNote`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: textToSubmit, timecode: Date.now() }),
        });

        if (response.status === 201) {
          alert("Note added successfully");
          // await fetchNotes();
          await fetchNotesForIndex();
          noteText.value = "";
          showNoteModal.value = false;
        } else {
          console.error("Failed to add note");
          showNoteModal.value = false;
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  }
};
const saveNoteOffline = async (note: string) => {
  try {
    let notes = (await localforage.getItem<string[]>("offlineNote")) || [];
    notes.push(note);
    await localforage.setItem("offlineNote", notes);
    alert("Note saved offline!");
    noteText.value = "";
    // handle modal UI logic here if necessary
  } catch (err) {
    console.error("Error saving note offline:", err);
  }
};
const syncNoteWhenOnline = async () => {
  if (process.client) {
    if (navigator.onLine) {
      try {
        const notes = await localforage.getItem<string[]>("offlineNote");
        if (notes && notes.length) {
          for (const note of notes) {
            // consider submitNote to be an async function that returns a promise
            await submitNote(note);
          }
          await localforage.removeItem("offlineNote");
        }
      } catch (err) {
        console.error("Error retrieving offline notes:", err);
      }
    }
  }
};
const fetchNotes = async () => {
  try {
    const url = `${baseUrl}getNotes`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Network response was not ok, received status code: ${response.status}`,
      );
    }
    tempData.value = (await response.json()) as any[];
    console.log(" tempData.value", tempData.value);
  } catch (error) {
    console.error("An error occurred while fetching notes:", error);
  }
};
</script>
<style scoped>
.imagePreview-row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -15px;
}

.imagePreview-col {
  flex: 0 0 33.33%;
  max-width: 33.33%;
  padding: 0 15px;
}

.imagePreview-card {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition:
    box-shadow 0.3s ease-in-out,
    transform 0.3s ease-in-out;
  background-color: #ffffff;
}

.imagePreview-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-5px);
}

.imagePreview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  overflow: hidden;
  border-radius: 5px;
  margin-bottom: 15px;
}

.imagePreview-img {
  max-width: 100%;
  min-height: 100%;
}

.loading-container {
  display: flex;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
  height: 100vh; /* Take the full height of the viewport */
  background-color: #f6f6f6; /* A light background color for contrast */
}

.loading-text {
  font-size: 1.5em; /* Increase the font size */
  font-weight: bold; /* Make the text bold */
  color: #333; /* Darker text color */
}
</style>
