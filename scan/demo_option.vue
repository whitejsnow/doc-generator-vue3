<template>
  <div>
    <!-- slot desc -->
    <slot name="slotn" prop1="prop1" :prop2="222" />
    <slot />
  </div>
  <div></div>
</template>

<script>
/**
 * asd
 */
export default {
  props: {
    // 视频链接
    src: {
      type: String,
      default: 0,
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
       * @event eaaaa
       * 触发了一个事件名为some-event
       * @param {object} options 事件参数
       * @param {string} options.name 参数1
       * @param {number} options.count 参数2
       */
      emit('emit-in-setup')
    }

    expose({
      /**
       * 供外部调用的方法
       * @param {string|number} [ext='ext'] 一个参数
       * @param {object} options 参数选项
       * @param {string} options.arg1 参数选项1
       * @param {number} [options.arg2] 参数选项2
       */
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
      /**
       * @event ebbbbbb 触发了一个事件名为some-event
       * @param {object} options 事件参数
       * @param {string} options.name 参数1
       * @param {number} options.count 参数2
       */
      this.$emit(PLAY)
    },
    /**
     * @method
     * 供外部调用的方法
     * @param {string|number} [ext='ext'] 一个参数
     * @param {object} options 参数选项
     * @param {string} options.arg1 参数选项1
     * @param {number} [options.arg2] 参数选项2
     */
    pause() {
      this.$emit('pause')
    },
  }
}
</script>
