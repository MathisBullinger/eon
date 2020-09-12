<script lang="ts">
  import { tweened } from 'svelte/motion'
  import { cubicInOut } from 'svelte/easing'

  export let mode: 'linear' | 'circular' = 'linear'

  const toggle = () => {
    mode = mode === 'linear' ? 'circular' : 'linear'
  }

  const r = 45
  const w = 90
</script>

<style>
  svg {
    position: fixed;
    top: 5vw;
    left: 5vw;
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }

  path {
    stroke: #fff6;
    fill: none;
    stroke-width: 5%;
    transition: d 0.2s ease;
  }
</style>

<svg width="100px" height="100px" viewBox="0 0 100 100" on:click={toggle}>
  <path
    d={mode === 'circular' ? `M ${(100 - w) / 2} 50 A 80 0 0 1 1 ${100 - (100 - w) / 2} 50` : `M 49.99 ${50 + r} A ${r} ${r} 0 1 1 50.01 ${50 + r}`}
    data-mode={mode} />
</svg>
