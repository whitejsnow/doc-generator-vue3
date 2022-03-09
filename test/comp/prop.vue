<script>
defineProps({
  a: String,
})
</script>

<script>
const props = defineProps({
  a: String
})
</script>

<script>
export default {
  props: ['a'],
}
</script>

<script>
export default {
  props: {
    a: String,
    b: [Number, String], // 这个还没支持
    c: {
      type: Object,
      default: function () {
        return {
          val: 1
        }
      },
      required: true,
      validator: function () {
        return true
      }
    },
    d: 'null',
    e: {
      type: Function,
      default () {}
    }
  }
}
</script>
