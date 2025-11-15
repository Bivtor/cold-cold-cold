<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout } from '$lib/components';

	let analyticsData: any = null;
	let loading = true;
	let error = '';

	// Date range filters
	let dateFromFilter = '';
	let dateToFilter = '';

	onMount(() => {
		loadAnalytics();
	});

	async function loadAnalytics() {
		loading = true;
		error = '';

		try {
			const params = new URLSearchParams();
			if (dateFromFilter) params.set('dateFrom', dateFromFilter);
			if (dateToFilter) params.set('dateTo', dateToFilter);

			const response = await fetch(`/api/analytics/overview?${params.toString()}`);
			const data = await response.json();

			if (data.success) {
				analyticsData = data.analytics;
			} else {
				error = data.error || 'Failed to load analytics';
			}
		} catch (err) {
			error = 'Network error occurred';
			console.error('Error loading analytics:', err);
		} finally {
			loading = false;
		}
	}

	function handleFilterChange() {
		loadAnalytics();
	}

	function clearFilters() {
		dateFromFilter = '';
		dateToFilter = '';
		loadAnalytics();
	}

	function formatDate(date: Date | string) {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString();
	}
</script>

<MainLayout 
	title="Email Analytics" 
	description="Comprehensive insights into your cold email campaigns"
>
	<div class="p-6">

		<!-- Date Range Filters -->
		<div class="bg-white shadow rounded-lg p-6 mb-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Date Range</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label for="dateFrom" class="block text-sm font-medium text-gray-700 mb-1">
						From Date
					</label>
					<input
						id="dateFrom"
						type="date"
						bind:value={dateFromFilter}
						on:change={handleFilterChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<div>
					<label for="dateTo" class="block text-sm font-medium text-gray-700 mb-1">
						To Date
					</label>
					<input
						id="dateTo"
						type="date"
						bind:value={dateToFilter}
						on:change={handleFilterChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<div class="flex items-end">
					<button
						on:click={clearFilters}
						class="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
					>
						Clear Filters
					</button>
				</div>
			</div>
		</div>

		{#if loading}
			<div class="bg-white shadow rounded-lg p-8">
				<div class="text-center">
					<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<p class="mt-2 text-gray-600">Loading analytics...</p>
				</div>
			</div>
		{:else if error}
			<div class="bg-white shadow rounded-lg p-8">
				<div class="text-center">
					<p class="text-red-600">{error}</p>
					<button
						on:click={loadAnalytics}
						class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
					>
						Retry
					</button>
				</div>
			</div>
		{:else if analyticsData}
			<!-- Overview Statistics -->
			<div class="bg-white shadow rounded-lg p-6 mb-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Overview</h2>
				<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
					<div class="bg-blue-50 p-4 rounded-lg text-center">
						<div class="text-3xl font-bold text-blue-600">{analyticsData.overview.totalEmails}</div>
						<div class="text-sm text-blue-800">Total Emails</div>
					</div>
					<div class="bg-green-50 p-4 rounded-lg text-center">
						<div class="text-3xl font-bold text-green-600">{analyticsData.overview.sentEmails}</div>
						<div class="text-sm text-green-800">Sent</div>
					</div>
					<div class="bg-yellow-50 p-4 rounded-lg text-center">
						<div class="text-3xl font-bold text-yellow-600">{analyticsData.overview.draftEmails}</div>
						<div class="text-sm text-yellow-800">Drafts</div>
					</div>
					<div class="bg-red-50 p-4 rounded-lg text-center">
						<div class="text-3xl font-bold text-red-600">{analyticsData.overview.failedEmails}</div>
						<div class="text-sm text-red-800">Failed</div>
					</div>
					<div class="bg-purple-50 p-4 rounded-lg text-center">
						<div class="text-3xl font-bold text-purple-600">{analyticsData.overview.uniqueBusinesses}</div>
						<div class="text-sm text-purple-800">Businesses</div>
					</div>
					<div class="bg-indigo-50 p-4 rounded-lg text-center">
						<div class="text-3xl font-bold text-indigo-600">{analyticsData.overview.responseRate}%</div>
						<div class="text-sm text-indigo-800">Response Rate</div>
					</div>
					<div class="bg-teal-50 p-4 rounded-lg text-center">
						<div class="text-3xl font-bold text-teal-600">{analyticsData.overview.goodResponseRate}%</div>
						<div class="text-sm text-teal-800">Good Response Rate</div>
					</div>
				</div>
			</div>

			<!-- Response Analysis -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<div class="bg-white shadow rounded-lg p-6">
					<h2 class="text-lg font-medium text-gray-900 mb-4">Response Analysis</h2>
					<div class="space-y-4">
						<div class="flex justify-between items-center p-3 bg-gray-50 rounded">
							<span class="text-sm font-medium text-gray-700">No Response</span>
							<div class="text-right">
								<span class="text-lg font-bold text-gray-900">{analyticsData.responseStats.noResponse}</span>
								<div class="text-xs text-gray-500">
									{analyticsData.overview.sentEmails > 0 
										? ((analyticsData.responseStats.noResponse / analyticsData.overview.sentEmails) * 100).toFixed(1)
										: '0.0'}%
								</div>
							</div>
						</div>
						<div class="flex justify-between items-center p-3 bg-green-50 rounded">
							<span class="text-sm font-medium text-green-700">Good Response</span>
							<div class="text-right">
								<span class="text-lg font-bold text-green-900">{analyticsData.responseStats.goodResponse}</span>
								<div class="text-xs text-green-600">
									{analyticsData.overview.sentEmails > 0 
										? ((analyticsData.responseStats.goodResponse / analyticsData.overview.sentEmails) * 100).toFixed(1)
										: '0.0'}%
								</div>
							</div>
						</div>
						<div class="flex justify-between items-center p-3 bg-orange-50 rounded">
							<span class="text-sm font-medium text-orange-700">Bad Response</span>
							<div class="text-right">
								<span class="text-lg font-bold text-orange-900">{analyticsData.responseStats.badResponse}</span>
								<div class="text-xs text-orange-600">
									{analyticsData.overview.sentEmails > 0 
										? ((analyticsData.responseStats.badResponse / analyticsData.overview.sentEmails) * 100).toFixed(1)
										: '0.0'}%
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white shadow rounded-lg p-6">
					<h2 class="text-lg font-medium text-gray-900 mb-4">Top Contacted Businesses</h2>
					<div class="space-y-3">
						{#each analyticsData.topBusinesses.slice(0, 8) as business, index}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded">
								<div class="flex items-center">
									<div class="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
										{index + 1}
									</div>
									<div>
										<div class="text-sm font-medium text-gray-900 truncate max-w-xs" title={business.businessName}>
											{business.businessName}
										</div>
										<div class="text-xs text-gray-500">
											{business.sent} sent, {business.responses} responses
										</div>
									</div>
								</div>
								<div class="text-right">
									<div class="text-lg font-bold text-gray-900">{business.count}</div>
									<div class="text-xs text-gray-500">emails</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Timeline Chart -->
			{#if analyticsData.timeline.length > 0}
				<div class="bg-white shadow rounded-lg p-6 ">
					<h2 class="text-lg font-medium text-gray-900 mb-4">Email Activity Timeline</h2>
					<div class="w-full ">
						<div class="flex items-end justify-between space-x-1 h-64">
							{#each analyticsData.timeline as day}
								<div class="flex flex-col items-center flex-1 min-w-0">
									<div class="flex flex-col items-center space-y-1 mb-2 w-full">
										<!-- Total emails bar -->
										<div 
											class="bg-blue-500 rounded-t w-full max-w-[16px]" 
											style="height: {Math.max(4, (day.total / Math.max(...analyticsData.timeline.map((d: any) => d.total))) * 180)}px;"
											title="{new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}: {day.total} total emails"
										></div>
										<!-- Sent emails bar -->
										<div 
											class="bg-green-500 rounded w-3/4 max-w-[12px]" 
											style="height: {Math.max(2, (day.sent / Math.max(...analyticsData.timeline.map((d: any) => d.sent))) * 120)}px;"
											title="{new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}: {day.sent} sent emails"
										></div>
										<!-- Responses bar -->
										<div 
											class="bg-purple-500 rounded w-1/2 max-w-[8px]" 
											style="height: {Math.max(1, (day.responses / Math.max(...analyticsData.timeline.map((d: any) => d.responses))) * 80)}px;"
											title="{new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}: {day.responses} responses"
										></div>
									</div>
									<div class="text-xs text-gray-500 transform rotate-45 origin-left whitespace-nowrap mt-2">
										{new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-12 flex items-center justify-center space-x-6 text-xs">
							<div class="flex items-center">
								<div class="w-3 h-3 bg-blue-500 rounded mr-1"></div>
								<span>Total Emails</span>
							</div>
							<div class="flex items-center">
								<div class="w-3 h-3 bg-green-500 rounded mr-1"></div>
								<span>Sent Emails</span>
							</div>
							<div class="flex items-center">
								<div class="w-3 h-3 bg-purple-500 rounded mr-1"></div>
								<span>Responses</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</MainLayout>