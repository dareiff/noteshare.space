<script lang="ts">
	import { marked } from 'marked';
	import extensions from '$lib/marked/extensions';
	import hljs from 'highlight.js/lib/core';
	import 'katex/dist/katex.min.css';
	import katex from 'katex';

	export let plaintext: string;
	export let fileTitle: string | undefined;

	let ref: HTMLDivElement;
	let footnotes: HTMLDivElement[];
	let footnoteContainer: HTMLDivElement;
	let renderedHtml = '';

	// Configure marked with extensions
	marked.use({
		extensions: extensions,
		breaks: true,
		gfm: true
	});

	// Add custom renderer for the custom token types
	const renderer = {
		// Internal links [[link]]
		'internal-link'(token: any) {
			return `<span class="internal-link text-blue-600 dark:text-blue-400">${token.text}</span>`;
		},
		// Internal embeds ![[embed]]
		'internal-embed'(token: any) {
			return `<span class="internal-embed italic text-gray-600 dark:text-gray-400">Embed: ${token.text}</span>`;
		},
		// Tags #tag
		'tag'(token: any) {
			return `<span class="tag inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">#${token.text}</span>`;
		},
		// Highlights ==text==
		'highlight'(token: any) {
			const text = token.tokens ? marked.parser(token.tokens) : token.text;
			return `<mark class="bg-yellow-200 dark:bg-yellow-600">${text}</mark>`;
		},
		// Math inline $...$
		'math-inline'(token: any) {
			try {
				return katex.renderToString(token.text, { throwOnError: false, displayMode: false });
			} catch (e) {
				return `<span class="text-red-500">Math Error: ${token.text}</span>`;
			}
		},
		// Math block $$...$$
		'math-block'(token: any) {
			try {
				return katex.renderToString(token.text, { throwOnError: false, displayMode: true });
			} catch (e) {
				return `<div class="text-red-500">Math Error: ${token.text}</div>`;
			}
		},
		// Footnote reference [^1]
		'footnote-ref'(token: any) {
			return `<sup><a href="#fn-${token.id}" id="fnref-${token.id}" class="footnote-ref">${token.id}</a></sup>`;
		},
		// Footnote definition [^1]: text
		'footnote'(token: any) {
			const text = token.tokens ? marked.parser(token.tokens) : token.text;
			return `<div class="footnote" data-footnote id="fn-${token.id}">
				<a href="#fnref-${token.id}" class="footnote-backref">↩</a>
				<span class="footnote-id">${token.id}</span>: ${text}
			</div>`;
		},
		// Override code block to use highlight.js
		code(token: any) {
			const lang = token.lang || '';
			const code = token.text;

			if (lang && hljs.getLanguage(lang)) {
				try {
					const highlighted = hljs.highlight(code, { language: lang }).value;
					return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
				} catch (e) {
					// Fall through to default
				}
			}

			return `<pre><code>${code}</code></pre>`;
		}
	};

	marked.use({ renderer });

	function renderMarkdown(text: string) {
		try {
			renderedHtml = marked.parse(text) as string;
			// Wait for next tick to process footnotes
			setTimeout(() => {
				if (ref) {
					!fileTitle && setTitle();
					parseFootnotes();
				}
			}, 0);
		} catch (e) {
			console.error('Markdown parsing error:', e);
			renderedHtml = '<p class="text-red-500">Error rendering markdown</p>';
		}
	}

	$: if (plaintext) {
		renderMarkdown(plaintext);
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
	{@html renderedHtml}

	<!-- footnote container -->
	{#if footnotes?.length > 0}
		<hr />
		<div bind:this={footnoteContainer}></div>
	{/if}
</div>

<style>
	:global(.footnote) {
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	:global(.footnote-ref) {
		text-decoration: none;
		font-weight: bold;
	}

	:global(.footnote-backref) {
		text-decoration: none;
		margin-right: 0.25rem;
	}

	:global(.internal-link),
	:global(.tag) {
		cursor: default;
	}
</style>
