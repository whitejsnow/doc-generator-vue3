<template>
  <div class="app-container">
    <Side @select="onSelect" />
    <Content :item="item" />
  </div>
</template>

<script setup>
import Side from './components/side.vue';
import Content from './components/content.vue';
import { ref } from 'vue';

const item = ref();
const onSelect = (content) => {
  item.value = content
};

</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
#app {
  height: 100%;
}
.app-container {
  height: 100%;
}
.app-container{
  display: flex;
}
</style>
