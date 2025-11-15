<script lang="ts">
	import { MainLayout, LoadingSpinner } from '$lib/components';
	import { NotificationService } from '$lib/services/index.js';
	import { loading, LoadingOperations } from '$lib/stores/loading.js';
	import { onMount } from 'svelte';

	// Settings state
	let senderName = '';
	let senderTitle = '';
	let senderCompany = '';
	let senderEmail = '';
	let senderPhone = '';

	// UI state - removed local loading/error states, using global notification system

	onMount(() => {
		loadSettings();
	});

	async function loadSettings() {
		// Load settings from localStorage
		senderName = localStorage.getItem('senderName') || '';
		senderTitle = localStorage.getItem('senderTitle') || '';
		senderCompany = localStorage.getItem('senderCompany') || '';
		senderEmail = localStorage.getItem('senderEmail') || '';
		senderPhone = localStorage.getItem('senderPhone') || '';
	}

	async function saveSettings() {
		loading.start(LoadingOperations.SAVING_SETTINGS);

		try {
			// Save to localStorage
			localStorage.setItem('senderName', senderName);
			localStorage.setItem('senderTitle', senderTitle);
			localStorage.setItem('senderCompany', senderCompany);
			localStorage.setItem('senderEmail', senderEmail);
			localStorage.setItem('senderPhone', senderPhone);

			NotificationService.showOperationSuccess('settings_save');
		} catch (err) {
			NotificationService.handleError(err as Error, 'settings');
		} finally {
			loading.stop(LoadingOperations.SAVING_SETTINGS);
		}
	}

	function clearSettings() {
		if (confirm('Are you sure you want to clear all settings? This action cannot be undone.')) {
			try {
				localStorage.clear();
				loadSettings();
				NotificationService.showSuccess('Settings Cleared', 'All settings have been cleared successfully.');
			} catch (err) {
				NotificationService.handleError(err as Error, 'settings');
			}
		}
	}
</script>

<svelte:head>
	<title>Settings - Cold Email Pipeline</title>
</svelte:head>

<MainLayout 
	title="Settings" 
	description="Configure your sender information"
>
	<div class="p-6">
		<!-- Messages -->


		<div class="space-y-8">
			<!-- Sender Information -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Sender Information</h2>
				<p class="text-sm text-gray-600 mb-6">This information will be used in your email templates and signatures.</p>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="sender-name" class="block text-sm font-medium text-gray-700 mb-2">
							Full Name <span class="text-red-500">*</span>
						</label>
						<input
							id="sender-name"
							type="text"
							bind:value={senderName}
							placeholder="John Doe"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					
					<div>
						<label for="sender-title" class="block text-sm font-medium text-gray-700 mb-2">
							Job Title
						</label>
						<input
							id="sender-title"
							type="text"
							bind:value={senderTitle}
							placeholder="Business Development Manager"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					
					<div>
						<label for="sender-company" class="block text-sm font-medium text-gray-700 mb-2">
							Company Name <span class="text-red-500">*</span>
						</label>
						<input
							id="sender-company"
							type="text"
							bind:value={senderCompany}
							placeholder="Your Company Inc."
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					
					<div>
						<label for="sender-email" class="block text-sm font-medium text-gray-700 mb-2">
							Email Address <span class="text-red-500">*</span>
						</label>
						<input
							id="sender-email"
							type="email"
							bind:value={senderEmail}
							placeholder="john.doe@company.com"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					
					<div class="md:col-span-2">
						<label for="sender-phone" class="block text-sm font-medium text-gray-700 mb-2">
							Phone Number
						</label>
						<input
							id="sender-phone"
							type="tel"
							bind:value={senderPhone}
							placeholder="+1 (555) 123-4567"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>
			</div>

			<!-- Database Settings -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Database Settings</h2>
				<p class="text-sm text-gray-600 mb-6">Manage your local database and data storage.</p>
				
				<div class="space-y-4">
					<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
						<div>
							<h3 class="text-sm font-medium text-gray-900">Database Location</h3>
							<p class="text-xs text-gray-500">./data/cold_email.db</p>
						</div>
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
							Active
						</span>
					</div>
					
					<div class="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
						<div>
							<h3 class="text-sm font-medium text-gray-900">Clear All Data</h3>
							<p class="text-xs text-gray-500">This will permanently delete all emails, notes, and business data</p>
						</div>
						<button
							onclick={clearSettings}
							class="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
						>
							Clear Data
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex justify-between items-center pt-6 border-t">
			<button
				onclick={() => window.history.back()}
				class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
			>
				← Back
			</button>
			
			<button
				onclick={saveSettings}
				disabled={$loading[LoadingOperations.SAVING_SETTINGS]}
				class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
			>
				{#if $loading[LoadingOperations.SAVING_SETTINGS]}
					<LoadingSpinner size="sm" color="white" text="Saving..." />
				{:else}
					<span>Save Settings</span>
				{/if}
			</button>
		</div>
	</div>
</MainLayout>