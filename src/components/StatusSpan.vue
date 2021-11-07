<template>
  <span>
    <i
      v-if="status === 'ok'"
      title="Success!"
      aria-label="Success"
      class="text-success bi bi-check-circle"
    ></i>
    <i
      v-if="status === 'fail'"
      title="Error"
      aria-label="Error"
      class="text-danger bi bi-x-circle"
    ></i>
  </span>
</template>
<script>
export default {
  name: 'StatusSpan',
  props: {
    status: { type: String, default: 'ok' },
  },
};
</script>
