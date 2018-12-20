<template>
  <span>
    <i v-if="status === 'ok'" title="Success!" aria-label="Success" class="text-success far fa-check-circle"></i>
    <i v-if="status === 'fail'" title="Failure" aria-label="Failure" class="text-warning fas fa-exclamation-circle"></i>
    <i v-if="status === 'error'" title="Error" aria-label="Error" class="text-danger far fa-times-circle"></i>
  </span>
</template>
<script>
  export default {
    name: "Status",
    props: {
      status: { type: String, default: 'ok' }
    }
  }
</script>
