<template>
  <div>
    <div>
      <Menubar
        class="rounded-none"
        :model="items"
      />
    </div>
    <main class="container max-w-5xl mx-auto my-5 px-2">
      <slot />
    </main>
  </div>
</template>

<script setup>
const items = ref([
  {
    label: 'Home',
    icon: 'pi pi-home',
    url: '/',
  },
])
</script>
