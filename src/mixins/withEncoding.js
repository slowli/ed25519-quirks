export default {
  props: {
    encoding: { type: String, default: 'base64' },
    htmlFragments: { type: Object, default: {} },
  },
  computed: {
    repr() {
      return (buffer, encoding) => this.$Buffer.from(buffer, encoding).toString(this.encoding);
    },
  },
};
