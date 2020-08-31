<script lang="ts">
  export let icon: 'close' | 'info'
  export let onClick: () => void
  export let color = '#000'
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
  class:clickable={typeof onClick === 'function'}
  on:click={onClick}>
  {#if icon === 'close'}
    <path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12
      13.41 17.59 19 19 17.59 13.41 12z" />
  {:else if icon === 'info'}
    <path
      fill={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1
      15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  {/if}
</svg>
