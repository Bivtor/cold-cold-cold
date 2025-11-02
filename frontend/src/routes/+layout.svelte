<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Cold Email Pipeline</title>
	<meta name="description" content="Create personalized cold emails using AI-powered content generation and web scraping." />
</svelte:head>

{@render children()}
