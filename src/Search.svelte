<script lang="ts">
  import Icon from './Icon.svelte'
  export let input: string
  export let results = []
  export let onSelect: (v: any) => void

  let active = false

  function onIconClick(e: MouseEvent) {
    active = true
    let node: HTMLElement = e.target as any
    while (node && node.tagName?.toLowerCase() !== 'div')
      node = node.parentElement
    if (!node) return
    node.querySelector('input').focus()
  }
</script>

<style>
  .search {
    display: flex;
    align-items: center;
    width: 20rem;
    overflow-x: hidden;
    transform: scaleX(0.06);
    transform-origin: right;
    padding: 0;
    justify-content: space-around;
  }

  .search > :global(svg) {
    flex-shrink: 0;
    transform-origin: center;
    transform: scaleX(calc(1 / 0.06)) translateX(50%);
  }

  .search,
  .search > :global(svg),
  .search > :global(input) {
    transition: transform 0.15s ease;
  }

  .search > :global(svg:hover > path) {
    fill: #fff;
  }

  .search > :global(input) {
    margin-left: 0.5rem;
    flex-grow: 1;
    transform: translateX(200%);
  }

  .search > :global(input:focus) {
    outline: none;
  }

  .search[data-state='active'],
  .search[data-state='active'] > :global(svg) {
    transform: scaleX(1);
  }

  .search[data-state='active'] > :global(input) {
    transform: none;
  }

  .results {
    width: calc(100% - 18px - 0.5rem);
    position: absolute;
    right: 0;
    display: flex;
    flex-direction: column;
    top: calc(100% + 0.5rem);
    border-radius: 0.25rem;
    overflow-y: scroll;
    pointer-events: all;
  }

  .result {
    padding: 0 1rem;
    height: 2rem;
    line-height: 2rem;
    color: #000c;
    user-select: none;
    cursor: pointer;
  }
</style>

<div class="wrap">
  <div class="search" data-state={active ? 'active' : 'inactive'}>
    <Icon icon="search" color="#fff6" onClick={onIconClick} />
    <input
      bind:value={input}
      on:blur={() => {
        setTimeout(() => {
          active = false
          input = undefined
        }, 100)
      }} />
  </div>
  <div class="results">
    {#each results as result}
      <span
        class="result"
        style={`background-color: ${result.color}`}
        on:click={() => onSelect(result)}>
        {result.name}
      </span>
    {/each}
  </div>
</div>
