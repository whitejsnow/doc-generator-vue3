<template>
  <div>
    <!-- slot desc -->
    <slot name="slotn" />
    <slot />
  </div>
  <div></div>
</template>

<script>
export default {
  props: {
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
  },
  setup(props, { expose, emit }) {
    /**
     * onend desc
     */
    function onend() {
      /**
       * emit-setup desc
       */
      emit('emit-in-setup')
    }

    expose({
      onend,
      /**
       * ontimeupdate desc
       */
      ontimeupdate: () => {},
    })
  },
  methods: {
    // @method
    // play desc
    play(s: string) {
      // play事件
      this.$emit('play')
    },
    /**
     * pause desc
     * @method
     */
    pause() {
      /**
       * pause事件
       */
      this.$emit('pause')
    },
  }
}
</script>
