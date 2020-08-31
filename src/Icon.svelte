<script lang="ts">
  export let icon: 'close' | 'info' | 'search'
  export let onClick: (e: MouseEvent) => void
  export let color = '#000'
</script>

<style>
  svg {
    width: 18px;
    height: 18px;
  }

  path {
    transition: fill 0.15s ease;
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
  {:else if icon === 'search'}
    <path
      fill={color}
      d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5
      3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5
      4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14
      9.5 11.99 14 9.5 14z" />
  {/if}
</svg>
