/* eslint-env jquery */
export default {
  props: {
    htmlFragments: { type: Object, default: {} },
  },
  data() {
    return { encoding: $('input[name=encoding]:checked').val() };
  },
  computed: {
    repr() {
      return (buffer, encoding) => this.$Buffer.from(buffer, encoding).toString(this.encoding);
    },
  },
};
