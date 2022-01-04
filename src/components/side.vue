<template>
  <div class="side">
    <h3 class="title">组件列表</h3>
    <div v-for="item in details" :key="item" class="item" @click="onSelect(item)">{{ item.name }}</div>
  </div>
</template>

<script setup>
import { getRawData } from '../util/data';
console.log(getRawData())
const details = getRawData().filter(item => item.name);
const emit = defineEmits(['select']);
const onSelect = (item) => {
  emit('select', item)
}
</script>

<style scoped lang="less">
.side {
  min-width: 200px;
  height: 100%;
  padding: 20px 0;
  border-right: 1px solid #bebebe;
  overflow: auto;
  flex-shrink: 0;
  box-sizing: border-box;
  .title {
    padding-left: 20px;
  }
  .item {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 20px;
    cursor: pointer;
    &:hover {
      background: #f4f4f4;
    }
  }
}
</style>
