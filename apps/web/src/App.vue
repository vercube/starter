<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '~/api';

const message = ref<string>();
const error = ref<string>();

onMounted(async () => {
  try {
    // typed by FooController.index: { message: string }
    const response = await api.get('/api/foo');

    message.value = response.message;
  } catch (error_) {
    error.value = error_ instanceof Error ? error_.message : String(error_);
  }
});
</script>

<template>
  <main>
    <h1>Vercube + Vue</h1>
    <p v-if="message">The API says: {{ message }}</p>
    <p v-else-if="error">The API did not answer: {{ error }}</p>
    <p v-else>Asking the API...</p>
    <p>
      Edit <code>apps/api/src/controller/FooController.ts</code> and the call in <code>apps/web/src/App.vue</code> stays typed by
      it.
    </p>
  </main>
</template>

<style>
main {
  font-family: system-ui, sans-serif;
  max-width: 40rem;
  margin: 4rem auto;
  line-height: 1.5;
}
</style>
