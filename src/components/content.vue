<template>
  <div class="container">
    <div v-if="item">
      <div class="module">
        <h1>{{ item.name }}</h1>
        <div>{{ item.desc }}</div>
      </div>
      
      <div v-if="item.props">
        <h2>props</h2>
        <Grid v-if="item.props" :config="config.prop" :data="item.props" />
      </div>

      <div v-if="item.methods">
        <h2>methods</h2>
        <Grid v-if="item.methods" :config="config.method" :data="item.methods" />
      </div>

      <div v-if="item.events">
        <h2>events</h2>
        <Grid v-if="item.events" :config="config.event" :data="item.events" />
      </div>

      <div v-if="item.slots">
        <h2>slots</h2>
        <Grid v-if="item.slots" :config="config.slot" :data="item.slots" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { h } from 'vue';
import Grid from './grid.vue';
const props = defineProps({
  item: Object
})
const config = {
  prop: {
    name: { text: 'Name' },
    desc: { text: 'Description' },
    type: { text: 'Type', render: props => props.data instanceof Array ? props.data.join(' | ') : props.data },
    default: { text: 'Default' },
    required: { text: 'Required' },
  },
  method: {
    name: { text: 'Name' },
    desc: { text: 'Description' },
    params: {
      text: 'Parameters',
      render: (props) => props.data?.length ? h(Grid, { config: config.paramForMethod, data: props.data }) : null,
    },
  },
  event: {
    name: { text: 'Name' },
    desc: { text: 'Description' },
    params: {
      text: 'Parameters',
      render: (props) => props.data?.length ? h(Grid, { config: config.paramForEvent, data: props.data }) : null,
    },
  },
  slot: {
    name: { text: 'Name' },
    desc: { text: 'Description' },
  },
  paramForMethod: {
    name: { text: 'Name' },
    desc: { text: 'Description' },
    type: { text: 'Type', render: props => props.data instanceof Array ? props.data.join(' | ') : props.data },
    defaultvalue: { text: 'DefaultValue' },
    optional: { text: 'Optional' },
  },
  paramForEvent: {
    name: { text: 'Name' },
    desc: { text: 'Description' },
    type: { text: 'Type', render: props => props.data instanceof Array ? props.data.join(' | ') : props.data },
  },
}

</script>

<style scoped lang="less">
.container {
  padding: 10px 80px;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  flex-grow: 1;
}
.module {
  margin-bottom: 60px;
}
</style>
