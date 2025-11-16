<script lang="ts">
	import { getCalloutColor, getCalloutIcon } from '$lib/util/callout';
	import CalloutIcon from '$lib/components/CalloutIcon.svelte';

	export let title = '';
	export let type = 'note';
	let color = '--callout-warning';
	let icon = 'note';
	let init = false;

	let content: HTMLElement;

	$: if (content) {
		const titleElement = content.getElementsByTagName('p')[0];
		const preFilled = title != '';

		// Use innerHTML instead of innerText to properly detect line breaks
		const html = titleElement.innerHTML.replace(/<!---->/g, '');
		const textContent = html.replace(/<br\s*\/?>/gi, '\n');
		const firstLine = textContent.split('\n')[0];

		const match = firstLine.match(/\[!(.+?)\]([+-]?)(?:\s(.+))?/);
		if (match && !preFilled) {
			type = match[1] ? match[1].trim() : '';
			title = match[3] ? match[3].trim() : type[0].toUpperCase() + type.substring(1).toLowerCase();
		}

		color = `--${getCalloutColor(type)}`;
		icon = getCalloutIcon(type);

		// Remove title from content
		if (!preFilled) {
			const pos = html.indexOf('<br>');
			const nlPos = html.indexOf('\n');
			if (pos >= 0) {
				titleElement.innerHTML = html.substring(pos + 4);
			} else if (nlPos >= 0) {
				titleElement.innerHTML = html.substring(nlPos + 1);
			} else {
				titleElement.innerHTML = '';
			}
		}
		init = true;
	}
</script>

<div
	style="--callout-color: var({color})"
	class="border-l-4 border-l-callout bg-zinc-100 dark:bg-zinc-800 my-4"
>
	<div class="p-2.5 bg-callout-bg flex items-center gap-2">
		<span class="callout-icon font-bold text-md text-callout h-5 w-5 inline-block"
			><CalloutIcon {icon} /></span
		>
		<span class="callout-title font-bold text-md">{title}</span>
	</div>
	<div bind:this={content} class="callout-content prose-p:my-0 prose-p:mx-0 py-4 px-3">
		<slot />
	</div>
</div>
