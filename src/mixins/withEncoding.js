export default {
  props: {
    htmlFragments: { type: Object, default: {} },
  },
  data() {
    return { encoding: 'base64' };
  },
  computed: {
    repr() {
      return (buffer, encoding) => this.$Buffer.from(buffer, encoding).toString(this.encoding);
    },
  },
};
