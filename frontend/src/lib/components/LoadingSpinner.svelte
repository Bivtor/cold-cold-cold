<script lang="ts">
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let color: 'primary' | 'white' | 'gray' = 'primary';
	export let text: string = '';

	function getSizeClasses(size: string) {
		switch (size) {
			case 'sm':
				return 'w-4 h-4';
			case 'lg':
				return 'w-8 h-8';
			default:
				return 'w-6 h-6';
		}
	}

	function getColorClasses(color: string) {
		switch (color) {
			case 'white':
				return 'text-white';
			case 'gray':
				return 'text-gray-400';
			default:
				return 'text-blue-600';
		}
	}
</script>

<div class="flex items-center space-x-2">
	<svg 
		class="animate-spin {getSizeClasses(size)} {getColorClasses(color)}" 
		fill="none" 
		viewBox="0 0 24 24"
		aria-hidden="true"
	>
		<circle 
			class="opacity-25" 
			cx="12" 
			cy="12" 
			r="10" 
			stroke="currentColor" 
			stroke-width="4"
		></circle>
		<path 
			class="opacity-75" 
			fill="currentColor" 
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
		></path>
	</svg>
	{#if text}
		<span class="text-sm {getColorClasses(color)}">{text}</span>
	{/if}
</div>