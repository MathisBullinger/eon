<script lang="ts">
  import { article } from './stores'
  import Icon from './Icon.svelte'
  import * as wiki from './utils/wiki'
  let content: HTMLDivElement

  $: data = wiki.read($article) ?? {}

  $: if (content && data?.extract) {
    content.innerHTML = data.extract
  }
</script>

<style>
  .article {
    position: fixed;
    display: block;
    background-color: #fff;
    width: 30rem;
    max-height: 50rem;
    right: 2rem;
    top: 4rem;
    box-sizing: border-box;
    padding: 1rem;
    overflow-y: auto;
  }

  .article > :global(svg) {
    position: absolute;
    right: 1rem;
    top: 1rem;
  }

  .title {
    margin-top: 0;
    font-size: 1.5rem;
  }
</style>

{#if $article}
  <div class="article">
    <h1 class="title">{data.title}</h1>
    <div bind:this={content} />
    <Icon icon="close" onClick={() => article.set(null)} />
  </div>
{/if}
