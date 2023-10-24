<!-- ImageCard.vue -->
<template>
  <div class="card-container">
    <div class="image-container">
      <img
        :src="imageData.imageText"
        alt="showing image"
        class="inline-block"
      />
    </div>
    <!-- <div class="update-button" @click="updater = true">click to update</div> -->
    <div class="delete-button text-center mt-2">
      <button @click="onDelete" class="btn btn-danger">
        <i class="fas fa-trash"></i> Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from "vue";

const props = defineProps({
  imageData: {
    type: Object,
    required: true,
  },
});

const updater = ref(false);

const onDelete = () => {
  emit("delete-image", props.imageData);
};

const emit = defineEmits();
</script>

<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
/>
