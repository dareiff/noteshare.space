<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import FaBars from 'svelte-icons/fa/FaBars.svelte';
</script>

<div
	id="navbar"
	class="h-[65px] md:h-14 border-b border-zinc-200 dark:border-zinc-700 transition-colors"
>
	<div
		id="navbar-content"
		class="h-full px-4 6xl:px-0 max-w-6xl mx-auto flex items-center justify-between content-center whitespace-nowrap"
	>
		<div id="navbar-left" class="flex gap-4">
			<a href="/" class="self-center h-full pb-0.5">
				<span id="name" class="self-center font-bold text-xl md:text-lg dark:text-white"
					>📝 {import.meta.env.VITE_BRANDING}</span
				>
			</a>
			<ul class="hidden md:flex gap-4 content-center">
				<slot name="left" />
			</ul>
		</div>
	</div>
</div>
