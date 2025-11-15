<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout, LoadingSpinner } from '$lib/components';
	import { NotificationService } from '$lib/services/index.js';
	import { loading, LoadingOperations } from '$lib/stores/loading.js';
	import type { Email } from '$lib/types/database.js';

	interface EmailWithBusinessName extends Email {
		businessName: string;
	}

	interface ContactFrequency {
		businessId: number;
		businessName: string;
		totalEmails: number;
		sentEmails: number;
		lastContact: Date | null;
	}

	let emails: EmailWithBusinessName[] = [];

	// Filter states
	let businessNameFilter = '';
	let sendStatusFilter = '';
	let responseStatusFilter = '';
	let dateFromFilter = '';
	let dateToFilter = '';

	// Pagination
	let currentPage = 1;
	let itemsPerPage = 10;
	let totalEmails = 0;

	// Sorting
	let sortBy = 'createdAt';
	let sortOrder: 'asc' | 'desc' = 'desc';

	// Modal states
	let showEmailModal = false;
	let selectedEmail: EmailWithBusinessName | null = null;
	let showContactFrequencyModal = false;
	let selectedBusinessId: number | null = null;
	let contactFrequencyData: any = null;
	
	// HTML editing state
	let isEditingHtml = false;
	let editableHtmlContent = '';

	// Analytics data
	let analyticsData: any = null;
	let analyticsLoading = false;

	onMount(() => {
		loadEmails();
		loadAnalytics();
	});

	async function loadEmails() {
		loading.start(LoadingOperations.LOADING_HISTORY);

		try {
			const params = new URLSearchParams();
			
			if (businessNameFilter) params.set('businessName', businessNameFilter);
			if (sendStatusFilter) params.set('sendStatus', sendStatusFilter);
			if (responseStatusFilter) params.set('responseStatus', responseStatusFilter);
			if (dateFromFilter) params.set('dateFrom', dateFromFilter);
			if (dateToFilter) params.set('dateTo', dateToFilter);
			
			params.set('limit', itemsPerPage.toString());
			params.set('offset', ((currentPage - 1) * itemsPerPage).toString());

			const response = await fetch(`/api/emails?${params.toString()}`);
			const data = await response.json();

			if (data.success) {
				emails = data.emails;
				totalEmails = data.emails.length; // Note: This is just the current page count
			} else {
				const error = new Error(data.error || 'Failed to load emails');
				NotificationService.handleError(error, 'database');
			}
		} catch (err) {
			NotificationService.handleError(err as Error, 'database');
		} finally {
			loading.stop(LoadingOperations.LOADING_HISTORY);
		}
	}

	async function updateResponseStatus(emailId: number, status: string) {
		loading.start(LoadingOperations.UPDATING_STATUS);

		try {
			const response = await fetch(`/api/emails/${emailId}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ responseStatus: status })
			});

			const data = await response.json();
			if (data.success) {
				// Update the email in the local array
				emails = emails.map(email => 
					email.id === emailId 
						? { ...email, responseStatus: status as any }
						: email
				);
				NotificationService.showOperationSuccess('status_update');
			} else {
				const error = new Error(data.error || 'Failed to update response status');
				NotificationService.handleError(error, 'database');
			}
		} catch (err) {
			NotificationService.handleError(err as Error, 'database');
		} finally {
			loading.stop(LoadingOperations.UPDATING_STATUS);
		}
	}

	async function loadAnalytics() {
		analyticsLoading = true;
		try {
			const params = new URLSearchParams();
			if (dateFromFilter) params.set('dateFrom', dateFromFilter);
			if (dateToFilter) params.set('dateTo', dateToFilter);
			
			const response = await fetch(`/api/analytics/overview?${params.toString()}`);
			const data = await response.json();
			
			if (data.success) {
				analyticsData = data.analytics;
			} else {
				// Analytics errors are not critical, just log them
				console.error('Analytics loading failed:', data.error);
			}
		} catch (err) {
			// Analytics errors are not critical, just log them
			console.error('Error loading analytics:', err);
		} finally {
			analyticsLoading = false;
		}
	}

	function handleFilterChange() {
		currentPage = 1;
		loadEmails();
		loadAnalytics();
	}

	function clearFilters() {
		businessNameFilter = '';
		sendStatusFilter = '';
		responseStatusFilter = '';
		dateFromFilter = '';
		dateToFilter = '';
		currentPage = 1;
		loadEmails();
		loadAnalytics();
	}

	function formatDate(date: Date | string) {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' }) + ' ' + 
		       d.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' });
	}

	function getStatusBadgeClass(status: string) {
		switch (status) {
			case 'sent':
				return 'bg-green-100 text-green-800';
			case 'draft':
				return 'bg-yellow-100 text-yellow-800';
			case 'failed':
				return 'bg-red-100 text-red-800';
			case 'unsent':
				return 'bg-purple-100 text-purple-800';
			case 'good_response':
				return 'bg-blue-100 text-blue-800';
			case 'bad_response':
				return 'bg-orange-100 text-orange-800';
			case 'no_response':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'unsent':
				return 'Unsent';
			case 'good_response':
				return 'Good Response';
			case 'bad_response':
				return 'Bad Response';
			case 'no_response':
				return 'No Response';
			default:
				return status.charAt(0).toUpperCase() + status.slice(1);
		}
	}

	function sortEmails(field: string) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'desc';
		}

		emails = emails.sort((a, b) => {
			let aVal: any = a[field as keyof EmailWithBusinessName];
			let bVal: any = b[field as keyof EmailWithBusinessName];

			if (field === 'createdAt' || field === 'sentAt') {
				aVal = new Date(aVal as string).getTime();
				bVal = new Date(bVal as string).getTime();
			}

			if (aVal == null && bVal == null) return 0;
			if (aVal == null) return 1;
			if (bVal == null) return -1;

			if (sortOrder === 'asc') {
				return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
			} else {
				return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
			}
		});
	}

	function nextPage() {
		currentPage++;
		loadEmails();
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			loadEmails();
		}
	}

	async function viewEmail(emailId: number) {
		try {
			const response = await fetch(`/api/emails/${emailId}`);
			const data = await response.json();
			
			if (data.success) {
				selectedEmail = data.email;
				editableHtmlContent = data.email.htmlContent;
				isEditingHtml = false;
				showEmailModal = true;
			} else {
				const error = new Error(data.error || 'Failed to load email');
				NotificationService.handleError(error, 'database');
			}
		} catch (err) {
			NotificationService.handleError(err as Error, 'database');
		}
	}

	async function viewContactFrequency(businessId: number) {
		try {
			selectedBusinessId = businessId;
			showContactFrequencyModal = true;
			
			const response = await fetch(`/api/businesses/${businessId}/contact-frequency`);
			const data = await response.json();
			
			if (data.success) {
				contactFrequencyData = data.contactFrequency;
			} else {
				const error = new Error(data.error || 'Failed to load contact frequency');
				NotificationService.handleError(error, 'database');
				showContactFrequencyModal = false;
			}
		} catch (err) {
			NotificationService.handleError(err as Error, 'database');
			showContactFrequencyModal = false;
		}
	}

	function closeModals() {
		showEmailModal = false;
		showContactFrequencyModal = false;
		selectedEmail = null;
		selectedBusinessId = null;
		contactFrequencyData = null;
		isEditingHtml = false;
		editableHtmlContent = '';
	}
	
	function copyHtmlToClipboard() {
		if (editableHtmlContent) {
			navigator.clipboard.writeText(editableHtmlContent).then(() => {
				NotificationService.showSuccess('Copied!', 'HTML content copied to clipboard');
			}).catch(err => {
				NotificationService.handleError(err, 'clipboard');
			});
		}
	}
	
	async function saveHtmlChanges() {
		if (!selectedEmail) return;
		
		loading.start(LoadingOperations.UPDATING_STATUS);
		
		try {
			const response = await fetch(`/api/emails/${selectedEmail.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ htmlContent: editableHtmlContent })
			});
			
			const data = await response.json();
			if (data.success) {
				selectedEmail.htmlContent = editableHtmlContent;
				// Update in the emails array
				emails = emails.map(email => 
					email.id === selectedEmail!.id 
						? { ...email, htmlContent: editableHtmlContent }
						: email
				);
				isEditingHtml = false;
				NotificationService.showSuccess('Saved!', 'Email HTML content updated successfully');
			} else {
				const error = new Error(data.error || 'Failed to update email content');
				NotificationService.handleError(error, 'database');
			}
		} catch (err) {
			NotificationService.handleError(err as Error, 'database');
		} finally {
			loading.stop(LoadingOperations.UPDATING_STATUS);
		}
	}

	async function deleteEmail(emailId: number) {
		if (!confirm('Are you sure you want to delete this email? This action cannot be undone.')) {
			return;
		}

		loading.start(LoadingOperations.DELETING_EMAIL);

		try {
			const response = await fetch(`/api/emails/${emailId}`, {
				method: 'DELETE'
			});

			const data = await response.json();
			if (data.success) {
				// Remove the email from the local array
				emails = emails.filter(email => email.id !== emailId);
				NotificationService.showSuccess('Email Deleted', 'The email has been deleted successfully');
			} else {
				const error = new Error(data.error || 'Failed to delete email');
				NotificationService.handleError(error, 'database');
			}
		} catch (err) {
			NotificationService.handleError(err as Error, 'database');
		} finally {
			loading.stop(LoadingOperations.DELETING_EMAIL);
		}
	}

	// Group emails by business to show contact frequency
	$: businessContactFrequency = emails.reduce((acc, email) => {
		const key = email.businessId;
		if (!acc[key]) {
			acc[key] = {
				businessId: email.businessId,
				businessName: email.businessName,
				totalEmails: 0,
				sentEmails: 0,
				lastContact: null
			};
		}
		acc[key].totalEmails++;
		if (email.sendStatus === 'sent') {
			acc[key].sentEmails++;
			if (email.sentAt && (!acc[key].lastContact || new Date(email.sentAt) > acc[key].lastContact)) {
				acc[key].lastContact = new Date(email.sentAt);
			}
		}
		return acc;
	}, {} as Record<number, ContactFrequency>);
</script>

<MainLayout 
	title="Email History" 
	description="Track and manage your cold email campaigns"
>
	<div class="p-6">

		<!-- Filters -->
		<div class="bg-white shadow rounded-lg p-6 mb-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Filters</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
				<div>
					<label for="businessName" class="block text-sm font-medium text-gray-700 mb-1">
						Business Name
					</label>
					<input
						id="businessName"
						type="text"
						bind:value={businessNameFilter}
						on:input={handleFilterChange}
						placeholder="Search business..."
						class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<div>
					<label for="sendStatus" class="block text-sm font-medium text-gray-700 mb-1">
						Send Status
					</label>
					<select
						id="sendStatus"
						bind:value={sendStatusFilter}
						on:change={handleFilterChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">All</option>
						<option value="draft">Draft</option>
						<option value="sent">Sent</option>
						<option value="failed">Failed</option>
					</select>
				</div>

				<div>
					<label for="responseStatus" class="block text-sm font-medium text-gray-700 mb-1">
						Response Status
					</label>
					<select
						id="responseStatus"
						bind:value={responseStatusFilter}
						on:change={handleFilterChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">All</option>
						<option value="unsent">Unsent</option>
						<option value="no_response">No Response</option>
						<option value="good_response">Good Response</option>
						<option value="bad_response">Bad Response</option>
					</select>
				</div>

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
			</div>

			<div class="mt-4">
				<button
					on:click={clearFilters}
					class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					Clear Filters
				</button>
			</div>
		</div>

		<!-- Analytics Dashboard -->
		{#if analyticsData}
			<div class="bg-white shadow rounded-lg p-6 mb-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Email Analytics</h2>
				
				<!-- Overview Statistics -->
				<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
					<div class="bg-blue-50 p-4 rounded-lg">
						<div class="text-2xl font-bold text-blue-600">{analyticsData.overview.totalEmails}</div>
						<div class="text-sm text-blue-800">Total Emails</div>
					</div>
					<div class="bg-green-50 p-4 rounded-lg">
						<div class="text-2xl font-bold text-green-600">{analyticsData.overview.sentEmails}</div>
						<div class="text-sm text-green-800">Sent</div>
					</div>
					<div class="bg-yellow-50 p-4 rounded-lg">
						<div class="text-2xl font-bold text-yellow-600">{analyticsData.overview.draftEmails}</div>
						<div class="text-sm text-yellow-800">Drafts</div>
					</div>
					<div class="bg-red-50 p-4 rounded-lg">
						<div class="text-2xl font-bold text-red-600">{analyticsData.overview.failedEmails}</div>
						<div class="text-sm text-red-800">Failed</div>
					</div>
					<div class="bg-purple-50 p-4 rounded-lg">
						<div class="text-2xl font-bold text-purple-600">{analyticsData.overview.uniqueBusinesses}</div>
						<div class="text-sm text-purple-800">Businesses</div>
					</div>
					<div class="bg-indigo-50 p-4 rounded-lg">
						<div class="text-2xl font-bold text-indigo-600">{analyticsData.overview.responseRate}%</div>
						<div class="text-sm text-indigo-800">Response Rate</div>
					</div>
					<div class="bg-teal-50 p-4 rounded-lg">
						<div class="text-2xl font-bold text-teal-600">{analyticsData.overview.goodResponseRate}%</div>
						<div class="text-sm text-teal-800">Good Response Rate</div>
					</div>
				</div>

				<!-- Response Statistics -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
					<div>
						<h3 class="text-md font-medium text-gray-900 mb-3">Response Breakdown</h3>
						<div class="space-y-2">
							<div class="flex justify-between items-center">
								<span class="text-sm text-gray-600">No Response</span>
								<span class="text-sm font-medium">{analyticsData.responseStats.noResponse}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-gray-600">Good Response</span>
								<span class="text-sm font-medium text-green-600">{analyticsData.responseStats.goodResponse}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-gray-600">Bad Response</span>
								<span class="text-sm font-medium text-red-600">{analyticsData.responseStats.badResponse}</span>
							</div>
						</div>
					</div>

					<div>
						<h3 class="text-md font-medium text-gray-900 mb-3">Top Contacted Businesses</h3>
						<div class="space-y-2 max-h-32 overflow-y-auto">
							{#each analyticsData.topBusinesses.slice(0, 5) as business}
								<div class="flex justify-between items-center">
									<span class="text-sm text-gray-600 truncate max-w-xs" title={business.businessName}>
										{business.businessName}
									</span>
									<div class="text-sm font-medium">
										<span class="text-gray-900">{business.count}</span>
										<span class="text-gray-500">({business.sent} sent)</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Timeline Chart (Simple) -->
				{#if analyticsData.timeline.length > 0}
					<div>
						<h3 class="text-md font-medium text-gray-900 mb-3 ">Email Activity Timeline</h3>
						<div class="flex items-end justify-between space-x-1  pb-20">
							{#each analyticsData.timeline as day}
								<div class="flex flex-col items-center flex-1 min-w-0">
									<div 
										class="bg-blue-500 rounded-t w-full max-w-[12px]" 
										style="height: {Math.max(2, (day.total / Math.max(...analyticsData.timeline.map((d: any) => d.total))) * 100)}px;"
										title="{new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}: {day.total} emails, {day.sent} sent, {day.responses} responses"
									></div>
									<div class="text-xs text-gray-500 mt-1 transform rotate-45 origin-left whitespace-nowrap">
										{new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else if analyticsLoading}
			<div class="bg-white shadow rounded-lg p-6 mb-6">
				<div class="animate-pulse">
					<div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
					<div class="grid grid-cols-4 gap-4">
						{#each Array(4) as _}
							<div class="h-16 bg-gray-200 rounded"></div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Email Table -->
		<div class="bg-white shadow rounded-lg overflow-hidden">
			{#if $loading[LoadingOperations.LOADING_HISTORY]}
				<div class="p-8 text-center">
					<LoadingSpinner size="lg" text="Loading emails..." />
				</div>
			{:else if emails.length === 0}
				<div class="p-8 text-center">
					<p class="text-gray-600">No emails found matching your criteria.</p>
					<a
						href="/new-email"
						class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
					>
						Create Your First Email
					</a>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
									on:click={() => sortEmails('businessName')}
								>
									Business Name
									{#if sortBy === 'businessName'}
										<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
									on:click={() => sortEmails('subject')}
								>
									Subject
									{#if sortBy === 'subject'}
										<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Send Status
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Response Status
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
									on:click={() => sortEmails('createdAt')}
								>
									Created
									{#if sortBy === 'createdAt'}
										<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
									on:click={() => sortEmails('sentAt')}
								>
									Sent
									{#if sortBy === 'sentAt'}
										<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each emails as email (email.id)}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
										<button
											class="text-blue-600 hover:text-blue-900 mr-3"
											on:click={() => viewEmail(email.id)}
										>
											View
										</button>
										<button
											class="text-purple-600 hover:text-purple-900 mr-3"
											on:click={() => viewContactFrequency(email.businessId)}
											title="View contact frequency for {email.businessName}"
										>
											Frequency
										</button>
										<button
											class="text-red-600 hover:text-red-900 mr-3"
											on:click={() => deleteEmail(email.id)}
											title="Delete this email"
										>
											Delete
										</button>
										{#if businessContactFrequency[email.businessId]}
											<span class="text-xs text-gray-500">
												({businessContactFrequency[email.businessId].sentEmails} sent)
											</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">{email.businessName}</div>
									</td>
									<td class="px-6 py-4">
										<div class="text-sm text-gray-900 max-w-xs truncate" title={email.subject}>
											{email.subject}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusBadgeClass(email.sendStatus)}">
											{getStatusLabel(email.sendStatus)}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<select
											value={email.responseStatus}
											on:change={(e) => updateResponseStatus(email.id, (e.target as HTMLSelectElement).value)}
											class="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 {getStatusBadgeClass(email.responseStatus)}"
										>
											<option value="unsent">Unsent</option>
											<option value="no_response">No Response</option>
											<option value="good_response">Good Response</option>
											<option value="bad_response">Bad Response</option>
										</select>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{formatDate(email.createdAt)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{email.sentAt ? formatDate(email.sentAt) : '-'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Pagination -->
				<div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
					<div class="flex-1 flex justify-between sm:hidden">
						<button
							on:click={prevPage}
							disabled={currentPage === 1}
							class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						<button
							on:click={nextPage}
							disabled={emails.length < itemsPerPage}
							class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
					<div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
						<div>
							<p class="text-sm text-gray-700">
								Showing page <span class="font-medium">{currentPage}</span>
								({emails.length} emails)
							</p>
						</div>
						<div>
							<nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
								<button
									on:click={prevPage}
									disabled={currentPage === 1}
									class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Previous
								</button>
								<button
									on:click={nextPage}
									disabled={emails.length < itemsPerPage}
									class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Next
								</button>
							</nav>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Email View Modal - Full Width -->
		{#if showEmailModal && selectedEmail}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div 
				class="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-y-auto" 
				role="dialog" 
				aria-modal="true" 
				aria-labelledby="email-modal-title"
				tabindex="0"
				on:keydown={(e) => e.key === 'Escape' && closeModals()}
			>
				<div 
					class="min-h-screen px-4 py-8"
				>
					<div class="max-w-7xl mx-auto bg-white rounded-lg shadow-xl">
						<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
							<div class="flex items-center justify-between">
								<h3 id="email-modal-title" class="text-2xl font-bold text-gray-900">Email Details</h3>
								<button
									on:click={closeModals}
									class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
									aria-label="Close email details modal"
								>
									<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
									</svg>
								</button>
							</div>
							<p class="text-sm text-gray-500 mt-1">Press ESC to close</p>
						</div>
						
						<div class="px-6 py-6">
							<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
								<!-- Left Column - Email Info -->
								<div class="lg:col-span-1 space-y-4">
									<div class="bg-gray-50 p-4 rounded-lg">
										<h4 class="text-sm font-semibold text-gray-700 mb-3">Email Information</h4>
										
										<div class="space-y-3">
											<div>
												<div class="text-xs font-medium text-gray-500">Business</div>
												<p class="mt-1 text-sm text-gray-900">{selectedEmail.businessName}</p>
											</div>
											
											<div>
												<div class="text-xs font-medium text-gray-500">Subject</div>
												<p class="mt-1 text-sm text-gray-900">{selectedEmail.subject}</p>
											</div>
											
											<div>
												<div class="text-xs font-medium text-gray-500">Send Status</div>
												<span class="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusBadgeClass(selectedEmail.sendStatus)}">
													{getStatusLabel(selectedEmail.sendStatus)}
												</span>
											</div>
											
											<div>
												<div class="text-xs font-medium text-gray-500">Response Status</div>
												<span class="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusBadgeClass(selectedEmail.responseStatus)}">
													{getStatusLabel(selectedEmail.responseStatus)}
												</span>
											</div>
											
											<div>
												<div class="text-xs font-medium text-gray-500">Created</div>
												<p class="mt-1 text-sm text-gray-900">{formatDate(selectedEmail.createdAt)}</p>
											</div>
											
											<div>
												<div class="text-xs font-medium text-gray-500">Sent</div>
												<p class="mt-1 text-sm text-gray-900">{selectedEmail.sentAt ? formatDate(selectedEmail.sentAt) : 'Not sent'}</p>
											</div>
											
											{#if selectedEmail.personalNotes}
												<div>
													<div class="text-xs font-medium text-gray-500">Personal Notes</div>
													<p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedEmail.personalNotes}</p>
												</div>
											{/if}
										</div>
									</div>
									
									<!-- Action Buttons -->
									<div class="space-y-2">
										<button
											on:click={() => {
												if (selectedEmail) {
													deleteEmail(selectedEmail.id);
													closeModals();
												}
											}}
											class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
										>
											Delete Email
										</button>
										<button
											on:click={closeModals}
											class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
										>
											Close (ESC)
										</button>
									</div>
								</div>
								
								<!-- Right Column - Email Preview & HTML Editor -->
								<div class="lg:col-span-2 space-y-6">
									<!-- Email Preview -->
									<div>
										<h4 class="text-lg font-semibold text-gray-900 mb-3">Email Preview</h4>
										<div class="border border-gray-300 rounded-lg overflow-hidden bg-white">
											<div class="bg-gray-100 px-4 py-2 border-b border-gray-300">
												<p class="text-xs text-gray-600">Rendered Email</p>
											</div>
											<div class="p-6 max-h-96 overflow-y-auto">
												{@html selectedEmail.htmlContent}
											</div>
										</div>
									</div>
									
									<!-- HTML Source Editor -->
									<div>
										<div class="flex items-center justify-between mb-3">
											<h4 class="text-lg font-semibold text-gray-900">HTML Source</h4>
											<div class="flex space-x-2">
												{#if isEditingHtml}
													<button
														on:click={() => {
															editableHtmlContent = selectedEmail!.htmlContent;
															isEditingHtml = false;
														}}
														class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
													>
														Cancel
													</button>
													<button
														on:click={saveHtmlChanges}
														disabled={$loading[LoadingOperations.UPDATING_STATUS]}
														class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
													>
														{$loading[LoadingOperations.UPDATING_STATUS] ? 'Saving...' : 'Save Changes'}
													</button>
												{:else}
													<button
														on:click={copyHtmlToClipboard}
														class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
													>
														<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
														</svg>
														<span>Copy HTML</span>
													</button>
													<button
														on:click={() => isEditingHtml = true}
														class="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
													>
														Edit HTML
													</button>
												{/if}
											</div>
										</div>
										
										{#if isEditingHtml}
											<textarea
												bind:value={editableHtmlContent}
												rows="20"
												class="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
												placeholder="Edit HTML content..."
											></textarea>
											<p class="mt-2 text-xs text-gray-500">
												Make your changes above and click "Save Changes" to update the email content.
											</p>
										{:else}
											<div class="relative">
												<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto text-sm"><code>{editableHtmlContent}</code></pre>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Contact Frequency Modal - Full Width -->
		{#if showContactFrequencyModal && contactFrequencyData}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div 
				class="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-y-auto" 
				role="dialog" 
				aria-modal="true" 
				aria-labelledby="frequency-modal-title"
				tabindex="0"
				on:keydown={(e) => e.key === 'Escape' && closeModals()}
			>
				<div class="min-h-screen px-4 py-8">
					<div class="max-w-7xl mx-auto bg-white rounded-lg shadow-xl">
						<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
							<div class="flex items-center justify-between">
								<h3 id="frequency-modal-title" class="text-2xl font-bold text-gray-900">Contact Frequency - {contactFrequencyData.business?.name}</h3>
								<button
									on:click={closeModals}
									class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
									aria-label="Close contact frequency modal"
								>
									<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
									</svg>
								</button>
							</div>
							<p class="text-sm text-gray-500 mt-1">Press ESC to close</p>
						</div>
						
						<div class="px-6 py-6">
						
						<!-- Statistics -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							<div class="bg-blue-50 p-4 rounded-lg">
								<div class="text-2xl font-bold text-blue-600">{contactFrequencyData.totalEmails}</div>
								<div class="text-sm text-blue-800">Total Emails</div>
							</div>
							<div class="bg-green-50 p-4 rounded-lg">
								<div class="text-2xl font-bold text-green-600">{contactFrequencyData.sentEmails}</div>
								<div class="text-sm text-green-800">Sent</div>
							</div>
							<div class="bg-yellow-50 p-4 rounded-lg">
								<div class="text-2xl font-bold text-yellow-600">{contactFrequencyData.draftEmails}</div>
								<div class="text-sm text-yellow-800">Drafts</div>
							</div>
							<div class="bg-red-50 p-4 rounded-lg">
								<div class="text-2xl font-bold text-red-600">{contactFrequencyData.failedEmails}</div>
								<div class="text-sm text-red-800">Failed</div>
							</div>
						</div>

						<!-- Response Statistics -->
						<div class="mb-6">
							<h4 class="text-md font-medium text-gray-900 mb-3">Response Statistics</h4>
							<div class="grid grid-cols-3 gap-4">
								<div class="bg-gray-50 p-3 rounded-lg">
									<div class="text-xl font-bold text-gray-600">{contactFrequencyData.responseStats.noResponse}</div>
									<div class="text-sm text-gray-800">No Response</div>
								</div>
								<div class="bg-blue-50 p-3 rounded-lg">
									<div class="text-xl font-bold text-blue-600">{contactFrequencyData.responseStats.goodResponse}</div>
									<div class="text-sm text-blue-800">Good Response</div>
								</div>
								<div class="bg-orange-50 p-3 rounded-lg">
									<div class="text-xl font-bold text-orange-600">{contactFrequencyData.responseStats.badResponse}</div>
									<div class="text-sm text-orange-800">Bad Response</div>
								</div>
							</div>
						</div>

						<!-- Contact Timeline -->
						<div class="mb-6">
							<h4 class="text-md font-medium text-gray-900 mb-3">Contact Timeline</h4>
							{#if contactFrequencyData.firstContact && contactFrequencyData.lastContact}
								<div class="text-sm text-gray-600">
									<p><strong>First Contact:</strong> {formatDate(contactFrequencyData.firstContact)}</p>
									<p><strong>Last Contact:</strong> {formatDate(contactFrequencyData.lastContact)}</p>
								</div>
							{:else}
								<p class="text-sm text-gray-500">No emails sent yet</p>
							{/if}
						</div>

						<!-- Email History -->
						<div>
							<h4 class="text-md font-medium text-gray-900 mb-3">Recent Emails</h4>
							<div class="max-h-64 overflow-y-auto">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
											<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
											<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Response</th>
											<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each contactFrequencyData.emails.slice(0, 10) as email}
											<tr>
												<td class="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">{email.subject}</td>
												<td class="px-4 py-2">
													<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusBadgeClass(email.sendStatus)}">
														{getStatusLabel(email.sendStatus)}
													</span>
												</td>
												<td class="px-4 py-2">
													<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusBadgeClass(email.responseStatus)}">
														{getStatusLabel(email.responseStatus)}
													</span>
												</td>
												<td class="px-4 py-2 text-sm text-gray-500">{formatDate(email.createdAt)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
							
							<div class="mt-6 flex justify-end">
								<button
									on:click={closeModals}
									class="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
								>
									Close (ESC)
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</MainLayout>