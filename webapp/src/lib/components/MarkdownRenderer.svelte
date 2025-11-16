<script lang="ts">
	import SvelteMarkdown from '@humanspeak/svelte-markdown';
	import Heading from '$lib/marked/renderers/Heading.svelte';
	import List from '$lib/marked/renderers/List.svelte';
	import InternalLink from '$lib/marked/renderers/InternalLink.svelte';
	import { marked } from 'marked';
	import extensions from '$lib/marked/extensions';
	import Link from '$lib/marked/renderers/Link.svelte';
	import Tag from '$lib/marked/renderers/Tag.svelte';
	import Highlight from '$lib/marked/renderers/Highlight.svelte';
	import InternalEmbed from '$lib/marked/renderers/InternalEmbed.svelte';
	import Blockquote from '$lib/marked/renderers/Blockquote.svelte';
	import MathInline from '$lib/marked/renderers/MathInline.svelte';
	import MathBlock from '$lib/marked/renderers/MathBlock.svelte';
	import ListItem from '$lib/marked/renderers/ListItem.svelte';
	import Code from '$lib/marked/renderers/Code.svelte';
	import FootnoteRef from '$lib/marked/renderers/FootnoteRef.svelte';
	import Footnote from '$lib/marked/renderers/Footnote.svelte';
	import 'katex/dist/katex.min.css';

	export let plaintext: string;
	export let fileTitle: string | undefined;

	let ref: HTMLDivElement;
	let footnotes: HTMLDivElement[];
	let footnoteContainer: HTMLDivElement;

	// Configure marked with custom extensions
	// @ts-ignore: typing mismatch
	marked.use({
		extensions: extensions,
		breaks: true,
		gfm: true
	});

	function onParsed() {
		!fileTitle && setTitle();
		parseFootnotes();
	}

	$: if (fileTitle) {
		document.title = fileTitle.trim();
	}

	/**
	 * Searches for the first major header in the document to use as page title.
	 */
	function setTitle() {
		const tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
		for (const tag of tags) {
			const element: HTMLHeadingElement | null = ref.querySelector(tag);
			if (element && element.innerText.trim().length > 0) {
				document.title = element.innerText.trim();
				break;
			}
		}
	}

	/*
	 * find all elements inside "ref" that have the data-footnote attribute
	 */
	function parseFootnotes() {
		footnotes = Array.from(ref.querySelectorAll('[data-footnote]'));
	}

	$: if (footnotes?.length > 0 && footnoteContainer) {
		footnotes.forEach((footnote) => {
			footnoteContainer.appendChild(footnote);
		});
	}
</script>

<div
	bind:this={ref}
	id="md-box"
	class="prose prose-zinc dark:prose-invert max-w-none prose-li:my-0 prose-ul:mt-0 prose-ol:mt-0 leading-7
prose-strong:font-bold prose-a:font-normal prose-blockquote:font-normal prose-blockquote:not-italic
prose-blockquote:first:before:content-[''] prose-hr:transition-colors prose-code:before:content-[''] prose-code:after:content-['']"
>
	{#if fileTitle}
		<h1>{fileTitle}</h1>
	{/if}
	<SvelteMarkdown
		onparsed={onParsed}
		renderers={{
			heading: Heading,
			list: List,
			listitem: ListItem,
			link: Link,
			blockquote: Blockquote,
			code: Code,
			// @ts-ignore - custom token types
			'internal-link': InternalLink,
			// @ts-ignore - custom token types
			'internal-embed': InternalEmbed,
			// @ts-ignore - custom token types
			tag: Tag,
			// @ts-ignore - custom token types
			highlight: Highlight,
			// @ts-ignore - custom token types
			'math-inline': MathInline,
			// @ts-ignore - custom token types
			'math-block': MathBlock,
			// @ts-ignore - custom token types
			'footnote-ref': FootnoteRef,
			// @ts-ignore - custom token types
			footnote: Footnote
		}}
		source={plaintext}
	/>

	<!-- footnote container -->
	{#if footnotes?.length > 0}
		<hr />
		<div bind:this={footnoteContainer}></div>
	{/if}
</div>
