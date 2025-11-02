<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout, LoadingSpinner } from '$lib/components';
	import { NotificationService } from '$lib/services/index.js';
	import { loading, LoadingOperations } from '$lib/stores/loading.js';
	import type { Note } from '$lib/types/database.js';

	// State management
	let notes: Note[] = [];
	let filteredNotes: Note[] = [];

	// Search and filter state
	let searchQuery = '';
	let selectedCategory = '';
	let categories: string[] = [];

	// Modal state
	let showModal = false;
	let editingNote: Note | null = null;
	let modalTitle = '';
	let modalContent = '';
	let modalCategory = '';

	// Selection state for bulk operations
	let selectedNotes: Set<number> = new Set();
	let showBulkActions = false;

	// Message state
	let success = '';
	let error = '';

	// Load notes on component mount
	onMount(() => {
		loadNotes();
	});

	// Load all notes from API
	async function loadNotes() {
		loading.start('loading_notes');
		
		try {
			const response = await fetch('/api/notes');
			const result = await response.json();
			
			if (result.success) {
				// Convert date strings to Date objects
				notes = result.data.map((note: any) => ({
					...note,
					createdAt: new Date(note.createdAt),
					updatedAt: new Date(note.updatedAt)
				}));
				updateFilteredNotes();
				updateCategories();
			} else {
				const error = new Error(result.error || 'Failed to load notes');
				NotificationService.handleError(error, 'database');
			}
		} catch (err) {
			NotificationService.handleError(err as Error, 'database');
		} finally {
			loading.stop('loading_notes');
		}
	}

	// Update filtered notes based on search and category filter
	function updateFilteredNotes() {
		filteredNotes = notes.filter(note => {
			const matchesSearch = searchQuery === '' || 
				note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				note.content.toLowerCase().includes(searchQuery.toLowerCase());
			
			const matchesCategory = selectedCategory === '' || note.category === selectedCategory;
			
			return matchesSearch && matchesCategory;
		});
	}

	// Update available categories
	function updateCategories() {
		const categorySet = new Set<string>();
		notes.forEach(note => {
			if (note.category) {
				categorySet.add(note.category);
			}
		});
		categories = Array.from(categorySet).sort();
	}

	// Handle search input
	function handleSearch() {
		updateFilteredNotes();
	}

	// Handle category filter change
	function handleCategoryFilter() {
		updateFilteredNotes();
	}

	// Open modal for creating new note
	function openCreateModal() {
		editingNote = null;
		modalTitle = '';
		modalContent = '';
		modalCategory = '';
		showModal = true;
	}

	// Open modal for editing existing note
	function openEditModal(note: Note) {
		editingNote = note;
		modalTitle = note.title;
		modalContent = note.content;
		modalCategory = note.category || '';
		showModal = true;
	}

	// Close modal
	function closeModal() {
		showModal = false;
		editingNote = null;
		modalTitle = '';
		modalContent = '';
		modalCategory = '';
	}

	// Save note (create or update)
	async function saveNote() {
		if (!modalTitle.trim() || !modalContent.trim()) {
			NotificationService.showWarning('Missing Information', 'Title and content are required');
			return;
		}

		loading.start(LoadingOperations.SAVING_NOTE);

		try {
			const noteData = {
				title: modalTitle.trim(),
				content: modalContent.trim(),
				category: modalCategory.trim() || undefined
			};

			let response;
			if (editingNote) {
				// Update existing note
				response = await fetch(`/api/notes/${editingNote.id}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(noteData)
				});
			} else {
				// Create new note
				response = await fetch('/api/notes', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(noteData)
				});
			}

			const result = await response.json();
			
			if (result.success) {
				NotificationService.showOperationSuccess('note_save');
				closeModal();
				await loadNotes(); // Reload notes
			} else {
				const error = new Error(result.error || 'Failed to save note');
				NotificationService.handleError(error, 'database');
			}
		} catch (err) {
			NotificationService.handleError(err as Error, 'database');
		} finally {
			loading.stop(LoadingOperations.SAVING_NOTE);
		}
	}

	// Delete note
	async function deleteNote(note: Note) {
		if (!confirm(`Are you sure you want to delete "${note.title}"?`)) {
			return;
		}

		loading.start(LoadingOperations.DELETING_NOTE);

		try {
			const response = await fetch(`/api/notes/${note.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();
			
			if (result.success) {
				NotificationService.showOperationSuccess('note_delete');
				await loadNotes(); // Reload notes
			} else {
				const error = new Error(result.error || 'Failed to delete note');
				NotificationService.handleError(error, 'database');
			}
		} catch (err) {
			NotificationService.handleError(err as Error, 'database');
		} finally {
			loading.stop(LoadingOperations.DELETING_NOTE);
		}
	}

	// Copy note content to clipboard
	let copiedNoteId: number | null = null;
	
	async function copyToClipboard(content: string, noteId: number) {
		try {
			await navigator.clipboard.writeText(content);
			copiedNoteId = noteId;
			success = 'Content copied to clipboard';
			
			// Clear success message and copied state after 3 seconds
			setTimeout(() => {
				success = '';
				copiedNoteId = null;
			}, 3000);
		} catch (err) {
			error = 'Failed to copy to clipboard';
			console.error('Error copying to clipboard:', err);
		}
	}

	// Copy multiple notes content to clipboard
	async function copySelectedNotes() {
		if (selectedNotes.size === 0) return;
		
		const selectedNotesData = notes.filter(note => selectedNotes.has(note.id));
		const combinedContent = selectedNotesData
			.map(note => `=== ${note.title} ===\n${note.content}`)
			.join('\n\n');
		
		try {
			await navigator.clipboard.writeText(combinedContent);
			success = `${selectedNotes.size} notes copied to clipboard`;
			selectedNotes.clear();
			showBulkActions = false;
			
			setTimeout(() => {
				success = '';
			}, 3000);
		} catch (err) {
			error = 'Failed to copy notes to clipboard';
			console.error('Error copying notes:', err);
		}
	}

	// Toggle note selection
	function toggleNoteSelection(noteId: number) {
		if (selectedNotes.has(noteId)) {
			selectedNotes.delete(noteId);
		} else {
			selectedNotes.add(noteId);
		}
		selectedNotes = selectedNotes; // Trigger reactivity
		showBulkActions = selectedNotes.size > 0;
	}

	// Select all filtered notes
	function selectAllNotes() {
		filteredNotes.forEach(note => selectedNotes.add(note.id));
		selectedNotes = selectedNotes;
		showBulkActions = true;
	}

	// Clear selection
	function clearSelection() {
		selectedNotes.clear();
		selectedNotes = selectedNotes;
		showBulkActions = false;
	}

	// Clear messages after some time
	$: if (error) {
		setTimeout(() => {
			error = '';
		}, 5000);
	}
</script>

<svelte:head>
	<title>Notes Management - Cold Email Pipeline</title>
</svelte:head>

<MainLayout 
	title="Notes Management" 
	description="Manage your AI prompt templates and personal notes"
>
	<div class="p-6">

		<!-- Messages -->


		<!-- Controls -->
		<div class="mb-6 bg-white p-6 rounded-lg shadow">
			<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
				<div class="flex flex-col sm:flex-row gap-4 flex-1">
					<!-- Search -->
					<div class="flex-1">
						<label for="search" class="sr-only">Search notes</label>
						<input
							id="search"
							type="text"
							placeholder="Search notes by title or content..."
							bind:value={searchQuery}
							on:input={handleSearch}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					<!-- Category filter -->
					<div class="sm:w-48">
						<label for="category" class="sr-only">Filter by category</label>
						<select
							id="category"
							bind:value={selectedCategory}
							on:change={handleCategoryFilter}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">All categories</option>
							{#each categories as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="flex gap-2">
					<!-- Bulk actions -->
					{#if filteredNotes.length > 0}
						<button
							on:click={selectAllNotes}
							class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
						>
							Select All
						</button>
					{/if}

					<!-- Add note button -->
					<button
						on:click={openCreateModal}
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
					>
						Add Note
					</button>
				</div>
			</div>

			<!-- Bulk actions bar -->
			{#if showBulkActions}
				<div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
					<div class="flex items-center justify-between">
						<span class="text-sm text-blue-800">
							{selectedNotes.size} note{selectedNotes.size === 1 ? '' : 's'} selected
						</span>
						<div class="flex gap-2">
							<button
								on:click={copySelectedNotes}
								class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
							>
								Copy Selected
							</button>
							<button
								on:click={clearSelection}
								class="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
							>
								Clear
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Loading state -->
		{#if $loading['loading_notes']}
			<div class="text-center py-8">
				<LoadingSpinner size="lg" text="Loading notes..." />
			</div>
		{/if}

		<!-- Notes list -->
		{#if !$loading['loading_notes']}
			{#if filteredNotes.length === 0}
				<div class="text-center py-12">
					<p class="text-gray-500 text-lg">
						{notes.length === 0 ? 'No notes found. Create your first note!' : 'No notes match your search criteria.'}
					</p>
				</div>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredNotes as note (note.id)}
						<div class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow {selectedNotes.has(note.id) ? 'ring-2 ring-blue-500' : ''}">
							<!-- Note header -->
							<div class="flex items-start justify-between mb-3">
								<div class="flex items-start gap-3 flex-1">
									<!-- Selection checkbox -->
									<input
										type="checkbox"
										checked={selectedNotes.has(note.id)}
										on:change={() => toggleNoteSelection(note.id)}
										class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
									<div class="flex-1">
										<h3 class="text-lg font-semibold text-gray-900 truncate">{note.title}</h3>
										{#if note.category}
											<span class="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
												{note.category}
											</span>
										{/if}
									</div>
								</div>
							</div>

							<!-- Note content preview -->
							<div class="mb-4">
								<p class="text-gray-600 text-sm line-clamp-3">
									{note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content}
								</p>
							</div>

							<!-- Note metadata -->
							<div class="text-xs text-gray-500 mb-4">
								<p>Created: {new Date(note.createdAt).toLocaleDateString()}</p>
								{#if note.updatedAt.getTime() !== note.createdAt.getTime()}
									<p>Updated: {new Date(note.updatedAt).toLocaleDateString()}</p>
								{/if}
							</div>

							<!-- Actions -->
							<div class="flex gap-2">
								<button
									on:click={() => copyToClipboard(note.content, note.id)}
									class="flex-1 px-3 py-2 text-sm {copiedNoteId === note.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
									title="Copy to clipboard"
								>
									{copiedNoteId === note.id ? '✓ Copied' : 'Copy'}
								</button>
								<button
									on:click={() => openEditModal(note)}
									class="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
								>
									Edit
								</button>
								<button
									on:click={() => deleteNote(note)}
									class="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
									title="Delete note"
								>
									Delete
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</MainLayout>

<!-- Modal for creating/editing notes -->
{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">
					{editingNote ? 'Edit Note' : 'Create New Note'}
				</h2>

				<form on:submit|preventDefault={saveNote}>
					<!-- Title -->
					<div class="mb-4">
						<label for="modal-title" class="block text-sm font-medium text-gray-700 mb-2">
							Title *
						</label>
						<input
							id="modal-title"
							type="text"
							bind:value={modalTitle}
							placeholder="Enter note title..."
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					<!-- Category -->
					<div class="mb-4">
						<label for="modal-category" class="block text-sm font-medium text-gray-700 mb-2">
							Category (optional)
						</label>
						<input
							id="modal-category"
							type="text"
							bind:value={modalCategory}
							placeholder="Enter category..."
							list="categories-list"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<datalist id="categories-list">
							{#each categories as category}
								<option value={category}></option>
							{/each}
						</datalist>
						{#if categories.length > 0}
							<div class="mt-2">
								<p class="text-xs text-gray-500 mb-1">Existing categories:</p>
								<div class="flex flex-wrap gap-1">
									{#each categories as category}
										<button
											type="button"
											on:click={() => modalCategory = category}
											class="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
										>
											{category}
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Content -->
					<div class="mb-6">
						<label for="modal-content" class="block text-sm font-medium text-gray-700 mb-2">
							Content *
						</label>
						<textarea
							id="modal-content"
							bind:value={modalContent}
							placeholder="Enter note content..."
							required
							rows="10"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
						></textarea>
					</div>

					<!-- Actions -->
					<div class="flex gap-3 justify-end">
						<button
							type="button"
							on:click={closeModal}
							class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={$loading[LoadingOperations.SAVING_NOTE]}
							class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if $loading[LoadingOperations.SAVING_NOTE]}
								<LoadingSpinner size="sm" color="white" text="Saving..." />
							{:else}
								{editingNote ? 'Update Note' : 'Create Note'}
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>