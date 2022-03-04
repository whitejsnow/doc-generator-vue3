<template>
  <div>
    <!-- slot desc -->
    <slot name="slotn" prop1="prop1" :prop2="222" />
    <slot />
  </div>
  <div></div>
</template>

<script setup>
/* eslint-disable */

defineProps({
  // 视频链接
  src: {
    type: String,
    default: '',
    required: true,
  },
  // 回调函数
  fn: {
    type: Function,
    default: () => {},
  },
  // 索引
  index: Number,
})

const emit = defineEmits()

/**
 * play desc
 */
function play(s: string) {
  /**
   * @event eaaa 触发了一个事件名为some-event
   * @param {object} options 事件参数
   * @param {string} options.name 参数1
   * @param {number} options.count 参数2
   */
  emit('play')
}

// pause desc
const pause = () => {
  /**
   * 触发了一个事件名为some-event
   * @param {object} options 事件参数
   * @param {string} options.name 参数1
   * @param {number} options.count 参数2
   */
  emit('pause')
}
/**
   * 供外部调用的方法
   * @param {string|number} [ext='ext'] 一个参数
   * @param {object} options 参数选项
   * @param {string} options.arg1 参数选项1
   * @param {number} [options.arg2] 参数选项2
   */
const isPlaying = function () {
}

defineExpose({
  play,
  pause,
  isPlaying,
  /**
   * 供外部调用的方法
   * @param {string|number} [ext='ext'] 一个参数
   * @param {object} options 参数选项
   * @param {string} options.arg1 参数选项1
   * @param {number} [options.arg2] 参数选项2
   */
  ontimeupdate: () => {},
  /**
   * onend desc
   */
  onend() {
  }
})
</script>
