<script lang="ts">
	import katex from 'katex';
	export let math: string;
	export let displayMode = false;

	const options = {
		displayMode: displayMode,
		throwOnError: false
	};

	$: katexString = katex.renderToString(math, options);
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
		crossorigin="anonymous"
	/>
</svelte:head>

{@html katexString}
