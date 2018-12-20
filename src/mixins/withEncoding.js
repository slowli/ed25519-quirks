export default {
  props: {
    encoding: { type: String, default: 'base64' }
  },
  computed: {
    repr() {
      return (buffer, encoding) => this.$Buffer.from(buffer, encoding).toString(this.encoding)
    }
  }
};
