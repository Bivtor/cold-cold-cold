<script lang="ts">
	import Navigation from './Navigation.svelte';
	import NotificationContainer from './NotificationContainer.svelte';

	interface Props {
		children: any;
		title?: string;
		description?: string;
	}

	let { children, title, description }: Props = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<Navigation />
	
	<!-- Main content -->
	<div class="md:pl-64 flex flex-col flex-1">
		<main class="flex-1">
			<div class="py-6">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
					{#if title}
						<div class="mb-8">
							<h1 class="text-2xl font-bold text-gray-900">{title}</h1>
							{#if description}
								<p class="mt-2 text-sm text-gray-600">{description}</p>
							{/if}
						</div>
					{/if}
					
					<div class="bg-white shadow-sm rounded-lg">
						{@render children()}
					</div>
				</div>
			</div>
		</main>
	</div>
	
	<!-- Global notification container -->
	<NotificationContainer />
</div>