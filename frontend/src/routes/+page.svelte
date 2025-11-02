<script lang="ts">
	import { MainLayout } from '$lib/components';
</script>

<MainLayout 
	title="Dashboard" 
	description="Overview of your cold email pipeline and quick access to key features"
>
	<div class="p-6">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<a
				href="/new-email"
				class="block p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-150 ease-in-out"
			>
				<div class="flex items-center">
					<svg class="h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					<h2 class="text-xl font-semibold text-blue-900">New Email</h2>
				</div>
				<p class="text-blue-700 mt-2">Create a new personalized cold email</p>
			</a>
			
			<a
				href="/history"
				class="block p-6 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors duration-150 ease-in-out"
			>
				<div class="flex items-center">
					<svg class="h-8 w-8 text-purple-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<h2 class="text-xl font-semibold text-purple-900">Email History</h2>
				</div>
				<p class="text-purple-700 mt-2">View and manage sent emails</p>
			</a>
			
			<a
				href="/notes"
				class="block p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-150 ease-in-out"
			>
				<div class="flex items-center">
					<svg class="h-8 w-8 text-green-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<h2 class="text-xl font-semibold text-green-900">Notes Panel</h2>
				</div>
				<p class="text-green-700 mt-2">Manage AI prompt templates and personal notes</p>
			</a>
			
			<a
				href="/analytics"
				class="block p-6 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors duration-150 ease-in-out"
			>
				<div class="flex items-center">
					<svg class="h-8 w-8 text-indigo-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
					<h2 class="text-xl font-semibold text-indigo-900">Analytics</h2>
				</div>
				<p class="text-indigo-700 mt-2">View detailed email campaign statistics</p>
			</a>
		</div>

		<!-- Quick Stats Section -->
		<div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="bg-gray-50 p-4 rounded-lg">
				<h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
				<p class="text-sm text-gray-600 mt-1">Quick overview of your latest email activities</p>
				<div class="mt-4">
					<p class="text-2xl font-bold text-gray-900">0</p>
					<p class="text-sm text-gray-500">Emails sent this week</p>
				</div>
			</div>
			
			<div class="bg-gray-50 p-4 rounded-lg">
				<h3 class="text-lg font-medium text-gray-900">Response Rate</h3>
				<p class="text-sm text-gray-600 mt-1">Track your email effectiveness</p>
				<div class="mt-4">
					<p class="text-2xl font-bold text-gray-900">0%</p>
					<p class="text-sm text-gray-500">Overall response rate</p>
				</div>
			</div>
			
			<div class="bg-gray-50 p-4 rounded-lg">
				<h3 class="text-lg font-medium text-gray-900">Saved Notes</h3>
				<p class="text-sm text-gray-600 mt-1">Your AI prompt templates</p>
				<div class="mt-4">
					<p class="text-2xl font-bold text-gray-900">0</p>
					<p class="text-sm text-gray-500">Prompt templates saved</p>
				</div>
			</div>
		</div>
	</div>
</MainLayout>
