<template>
  <div>
    <!-- slot desc -->
    <slot name="slotn" />
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
   * emit play
   */
  emit('play')
}

// pause desc
const pause = () => {
  // emit pause
  emit('pause')
}
/**
 * isPlaying desc
 */
const isPlaying = function () {
}

defineExpose({
  play,
  pause,
  isPlaying,
  /**
   * ontimeupdate desc
   */
  ontimeupdate: () => {},
  /**
   * onend desc
   */
  onend() {
  }
})
</script>
