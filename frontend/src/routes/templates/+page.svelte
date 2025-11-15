<script lang="ts">
	import { MainLayout } from '$lib/components';
	import { EmailTemplateService } from '$lib/services';
	import type { EmailTemplate } from '$lib/types/email-template';
	import { onMount } from 'svelte';

	const templateService = new EmailTemplateService();
	
	let templates = $state<EmailTemplate[]>([]);
	let selectedTemplate = $state<EmailTemplate | null>(null);
	let isEditing = $state(false);
	let isCreating = $state(false);
	let previewHtml = $state('');
	
	// Form fields for template editing
	let templateName = $state('');
	let templateDescription = $state('');
	let htmlTemplate = $state('');
	let validationError = $state('');

	onMount(() => {
		loadTemplates();
	});

	function loadTemplates() {
		templates = templateService.getAllTemplates();
		// Load custom templates from localStorage
		const savedTemplates = localStorage.getItem('customTemplates');
		if (savedTemplates) {
			try {
				const customTemplates = JSON.parse(savedTemplates);
				customTemplates.forEach((t: EmailTemplate) => templateService.saveTemplate(t));
				templates = templateService.getAllTemplates();
			} catch (e) {
				console.error('Failed to load custom templates:', e);
			}
		}
	}

	function saveTemplatesToStorage() {
		const customTemplates = templates.filter(t => !t.isDefault);
		localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
	}

	function selectTemplate(template: EmailTemplate) {
		selectedTemplate = template;
		loadTemplateFields(template);
		isEditing = false;
		isCreating = false;
		generatePreview();
	}

	function loadTemplateFields(template: EmailTemplate) {
		templateName = template.name;
		templateDescription = template.description;
		htmlTemplate = template.htmlTemplate;
	}

	function startCreating() {
		isCreating = true;
		isEditing = false;
		selectedTemplate = null;
		resetFields();
	}

	function startEditing() {
		if (!selectedTemplate) return;
		isEditing = true;
		isCreating = false;
	}

	function resetFields() {
		templateName = '';
		templateDescription = '';
		htmlTemplate = '';
		validationError = '';
	}

	function saveTemplate() {
		// Validate required fields
		validationError = '';
		
		if (!templateName.trim()) {
			validationError = 'Template name is required';
			return;
		}
		
		if (!templateDescription.trim()) {
			validationError = 'Template description is required';
			return;
		}
		
		if (!htmlTemplate.trim()) {
			validationError = 'HTML template is required';
			return;
		}
		
		// Validate that {{CONTENT}} placeholder exists
		if (!htmlTemplate.includes('{{CONTENT}}')) {
			validationError = 'HTML template must include {{CONTENT}} placeholder for AI-generated text';
			return;
		}
		
		// Validate that {{BUSINESS_NAME}} placeholder exists
		if (!htmlTemplate.includes('{{BUSINESS_NAME}}')) {
			validationError = 'HTML template must include {{BUSINESS_NAME}} placeholder (e.g., "Hi {{BUSINESS_NAME}},")';
			return;
		}

		const template: EmailTemplate = {
			id: isCreating ? `custom-${Date.now()}` : selectedTemplate!.id,
			name: templateName,
			description: templateDescription,
			htmlTemplate: htmlTemplate,
			isDefault: false
		};

		templateService.saveTemplate(template);
		
		// Update the templates array with the saved template
		if (isCreating) {
			templates = [...templates, template];
		} else {
			templates = templates.map(t => t.id === template.id ? template : t);
		}
		
		saveTemplatesToStorage();
		selectTemplate(template);
		isEditing = false;
		isCreating = false;
	}

	function cancelEdit() {
		if (selectedTemplate) {
			loadTemplateFields(selectedTemplate);
		}
		isEditing = false;
		isCreating = false;
	}

	function deleteTemplate() {
		if (!selectedTemplate || selectedTemplate.isDefault) return;
		if (!confirm(`Are you sure you want to delete "${selectedTemplate.name}"?`)) return;
		
		templates = templates.filter(t => t.id !== selectedTemplate!.id);
		saveTemplatesToStorage();
		selectedTemplate = null;
		isEditing = false;
	}

	function generatePreview() {
		if (!selectedTemplate) return;
		
		const sampleContent = `
			<p>I hope this email finds you well. I wanted to reach out because I believe there's a great opportunity for our companies to work together.</p>
			<p>Our team has been following your company's impressive growth in the market, and we think our solutions could help accelerate your success even further.</p>
			<p>Would you be available for a brief call to discuss this opportunity?</p>
			<p>Best regards,<br>
			Jane Doe<br>
			Business Development Manager<br>
			Your Company<br>
			jane@yourcompany.com<br>
			+1 (555) 123-4567</p>
		`;

		const rendered = templateService.renderEmail(selectedTemplate.id, sampleContent, 'Acme Corporation');
		previewHtml = rendered.htmlContent;
	}

	$effect(() => {
		if (selectedTemplate && !isEditing && !isCreating) {
			generatePreview();
		}
	});
</script>

<svelte:head>
	<title>Email Templates - Cold Email Pipeline</title>
</svelte:head>

<MainLayout title="Email Templates" description="Create and manage your email templates">
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Template List -->
		<div class="lg:col-span-1 bg-white rounded-lg shadow p-6">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-lg font-semibold text-gray-900">Templates</h2>
				<button
					onclick={startCreating}
					class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
				>
					+ New
				</button>
			</div>

			<div class="space-y-2">
				{#each templates as template}
					<button
						onclick={() => selectTemplate(template)}
						class="w-full text-left p-3 rounded-lg border transition-colors {selectedTemplate?.id === template.id
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200 hover:border-gray-300'}"
					>
						<div class="font-medium text-gray-900">{template.name}</div>
						<div class="text-xs text-gray-500 mt-1">{template.description}</div>
						{#if template.isDefault}
							<span class="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
								Default
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Template Editor/Preview -->
		<div class="lg:col-span-2 bg-white rounded-lg shadow">
			{#if isEditing || isCreating}
				<!-- Edit Mode -->
				<div class="p-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">
						{isCreating ? 'Create Template' : 'Edit Template'}
					</h2>

					<div class="space-y-4">
						{#if validationError}
							<div class="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
								{validationError}
							</div>
						{/if}

						<div>
							<label for="template-name" class="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
							<input
								id="template-name"
								type="text"
								bind:value={templateName}
								placeholder="e.g., Professional Blue"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label for="template-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
							<input
								id="template-description"
								type="text"
								bind:value={templateDescription}
								placeholder="Brief description of this template"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label for="html-template" class="block text-sm font-medium text-gray-700 mb-1">
								HTML Template
								<span class="text-xs text-gray-500 ml-2">(Must include {'{{CONTENT}}'} and {'{{BUSINESS_NAME}}'} placeholders)</span>
							</label>
							<textarea
								id="html-template"
								bind:value={htmlTemplate}
								placeholder="Paste your HTML/CSS template here. Include {'{{BUSINESS_NAME}}'} for the company name (e.g., Hi {'{{BUSINESS_NAME}}'},) and {'{{CONTENT}}'} for the AI-generated text."
								rows="15"
								class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							></textarea>
							<p class="mt-1 text-xs text-gray-500">
								Required: {'{{BUSINESS_NAME}}'} for company name and {'{{CONTENT}}'} for AI-generated email content.
							</p>
						</div>

						<!-- Buttons -->
						<div class="flex justify-end space-x-3 pt-4 border-t">
							<button
								onclick={cancelEdit}
								class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
							>
								Cancel
							</button>
							<button
								onclick={saveTemplate}
								class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
							>
								Save Template
							</button>
						</div>
					</div>
				</div>
			{:else if selectedTemplate}
				<!-- Preview Mode -->
				<div class="p-6">
					<div class="flex justify-between items-center mb-4">
						<div>
							<h2 class="text-xl font-semibold text-gray-900">{selectedTemplate.name}</h2>
							<p class="text-sm text-gray-600">{selectedTemplate.description}</p>
						</div>
						<div class="flex space-x-2">
							{#if !selectedTemplate.isDefault}
								<button
									onclick={startEditing}
									class="px-3 py-1 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
								>
									Edit
								</button>
								<button
									onclick={deleteTemplate}
									class="px-3 py-1 text-red-700 bg-red-100 rounded-md hover:bg-red-200"
								>
									Delete
								</button>
							{/if}
						</div>
					</div>

					<div class="border border-gray-300 rounded-lg overflow-hidden">
						<div class="bg-gray-100 px-4 py-2 border-b border-gray-300">
							<p class="text-xs text-gray-600">Preview</p>
						</div>
						<div class="bg-white p-4 max-h-[600px] overflow-y-auto">
							{@html previewHtml}
						</div>
					</div>
				</div>
			{:else}
				<!-- No Selection -->
				<div class="p-6 text-center text-gray-500">
					<p>Select a template to preview or create a new one</p>
				</div>
			{/if}
		</div>
	</div>
</MainLayout>
