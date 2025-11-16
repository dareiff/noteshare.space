<script lang="ts">
	import { browser } from '$app/environment';

	import NavBar from '$lib/components/navbar/NavBar.svelte';
	import '../app.css';

	let dark: boolean;
	let darkTheme = 'dark';

	$: getTheme();

	$: {
		if (browser) {
			window.localStorage.setItem('isDarkMode', String(dark));
		}
	}

	async function getTheme() {
		if (browser) {
			const savedMode = window.localStorage.getItem('isDarkMode');
			dark = savedMode ? savedMode === 'true' : false;
			window.localStorage.setItem('isDarkMode', String(dark));
		}
	}
</script>

<svelte:head>
	<title>{import.meta.env.VITE_BRANDING} — A shared note.</title>
	<meta name="title" content="Shared note." />
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://go.derekr.xyz/" />
	<meta property="og:title" content="A shared note.." />
	<meta property="og:description" content="A shared note from Derek." />
</svelte:head>

<div class=" h-full {dark !== undefined ? '' : 'hidden'} {dark ? darkTheme : ''}">
	<div class="bg-white dark:bg-background-dark min-h-full transition-colors">
		<div class="z-50 sticky top-0 w-full bg-white dark:bg-background-dark transition-colors">
			<div class="top-0 left-0 right-0">
				<NavBar></NavBar>
			</div>
		</div>

		<div class="container mx-auto max-w-4xl mt-6 md:mt-12 px-4 2xl:px-0">
			<slot />
		</div>
	</div>
</div>
