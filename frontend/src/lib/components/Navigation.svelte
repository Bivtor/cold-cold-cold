<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let isMobileMenuOpen = $state(false);
	let isMobile = $state(false);

	// Navigation items
	const navigationItems = [
		{
			name: 'Dashboard',
			href: '/',
			icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
		},
		{
			name: 'New Email',
			href: '/new-email',
			icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6'
		},
		{
			name: 'History',
			href: '/history',
			icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
		},
		{
			name: 'Templates',
			href: '/templates',
			icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z'
		},
		{
			name: 'Notes',
			href: '/notes',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
		},
		{
			name: 'Analytics',
			href: '/analytics',
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
		},
		{
			name: 'How It Works',
			href: '/how-it-works',
			icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
		},
		{
			name: 'Settings',
			href: '/settings',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
		}
	];

	// Check if current path matches navigation item
	function isActive(href: string): boolean {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}

	// Handle mobile menu toggle
	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	// Close mobile menu when clicking outside or on navigation
	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	// Check if we're on mobile
	onMount(() => {
		function checkMobile() {
			isMobile = window.innerWidth < 768;
			if (!isMobile) {
				isMobileMenuOpen = false;
			}
		}
		
		checkMobile();
		window.addEventListener('resize', checkMobile);
		
		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>

<!-- Mobile menu button -->
<div class="md:hidden fixed top-4 left-4 z-50">
	<button
		onclick={toggleMobileMenu}
		class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
		aria-expanded="false"
	>
		<span class="sr-only">Open main menu</span>
		{#if !isMobileMenuOpen}
			<!-- Menu icon -->
			<svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		{:else}
			<!-- Close icon -->
			<svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		{/if}
	</button>
</div>

<!-- Mobile menu overlay -->
{#if isMobileMenuOpen}
	<button
	aria-label="fuckoff"
		class="md:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
		onclick={closeMobileMenu}
	></button>
{/if}

<!-- Sidebar -->
<div class="flex">
	<!-- Desktop sidebar -->
	<div class="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
		<div class="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
			<div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
				<div class="flex items-center flex-shrink-0 px-4">
					<h1 class="text-xl font-bold text-gray-900">Cold Email Pipeline</h1>
				</div>
				<nav class="mt-8 flex-1 px-2 space-y-1">
					{#each navigationItems as item}
						<a
							href={item.href}
							class="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out {isActive(item.href)
								? 'bg-blue-100 text-blue-900'
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<svg
								class="mr-3 flex-shrink-0 h-6 w-6 {isActive(item.href)
									? 'text-blue-500'
									: 'text-gray-400 group-hover:text-gray-500'}"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
							</svg>
							{item.name}
						</a>
					{/each}
				</nav>
			</div>
		</div>
	</div>

	<!-- Mobile sidebar -->
	<div class="md:hidden p-10">
		<div class="fixed inset-0 flex z-40 {isMobileMenuOpen ? '' : 'pointer-events-none'}">
			<div class="pt-10 relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform duration-300 ease-in-out {isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}">
				<div class="absolute top-0 right-0 -mr-12 pt-2">
					<button
						onclick={closeMobileMenu}
						class=" ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
					>
						<span class="sr-only">Close sidebar</span>
						<svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
					<div class="flex-shrink-0 flex items-center px-4">
						<h1 class="text-xl font-bold text-gray-900">Cold Email Pipeline</h1>
					</div>
					<nav class="mt-8 px-2 space-y-1">
						{#each navigationItems as item}
							<a
								href={item.href}
								onclick={closeMobileMenu}
								class="group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-150 ease-in-out {isActive(item.href)
									? 'bg-blue-100 text-blue-900'
									: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
							>
								<svg
									class="mr-4 flex-shrink-0 h-6 w-6 {isActive(item.href)
										? 'text-blue-500'
										: 'text-gray-400 group-hover:text-gray-500'}"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
								</svg>
								{item.name}
							</a>
						{/each}
					</nav>
				</div>
			</div>
		</div>
	</div>
</div>