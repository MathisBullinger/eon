<script lang="ts">
  import Timeline from './Timeline.svelte'
  import Circular from './Circular.svelte'
  import Article from './Article.svelte'
  import ModeToggle from './ModeToggle.svelte'

  let mode
</script>

<style>
  main {
    width: 100vw;
    height: 100vh;
    left: 0;
    top: 0;
    position: absolute;
    overflow: hidden;
  }
</style>

<main>
  {#if mode === 'linear'}
    <Timeline />
    <Article />
  {:else}
    <Circular />
  {/if}
  <ModeToggle bind:mode />
</main>
