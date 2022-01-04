<template>
  <div>
    <table class="table">
      <thead>
        <tr>
          <th v-for="(v, key) in config" :key="key" class="head">
            {{ v.text }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" :key="item">
          <th v-for="(v, key) in config" :key="key" class="cell">
            <component :is="v.render" v-if="v.render" :data="item[key]" />
            <div v-else>{{ item[key] }}</div>
          </th>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  config: Object,
  data: Array,
})
</script>

<style scoped lang="less">
.table {
  .head {
    text-align: left;
    font-weight: 400;
    font-size: 12px;
    padding: 10px;
    background: #f4f4f4,
  }
  .cell {
    text-align: left;
    font-weight: 400;
    font-size: 14px;
    padding: 10px;
  }
}
</style>
