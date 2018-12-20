<template>
  <p class="px-2 py-1 bg-light equation text-monospace"><slot/></p>
</template>
<script>
  export default {
    name: "Equation"
  }
</script>
<style>
  .equation {
    font-size: 87.5%;
    color: #6c7596;
    margin-left: -.6rem;
    border-left: 2px solid;
  }
</style>
