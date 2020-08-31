<script lang="ts">
  export let icon: 'close'
  export let onClick: () => void
</script>

<style>
  svg {
    width: 18px;
    height: 18px;
  }

  .clickable {
    cursor: pointer;
  }
</style>

<svg
  viewBox="0 0 24 24"
  fill="#000"
  class:clickable={typeof onClick === 'function'}
  on:click={onClick}>
  {#if icon === 'close'}
    <path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12
      13.41 17.59 19 19 17.59 13.41 12z" />
  {/if}
</svg>
