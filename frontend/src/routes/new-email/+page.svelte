<script lang="ts">
	import { MainLayout, LoadingSpinner } from '$lib/components';
	import type { ScrapedData, EmailGenerationRequest, RenderedEmail } from '$lib/types/index.js';
	import { EmailTemplateService, NotificationService } from '$lib/services/index.js';
	import { loading, LoadingOperations } from '$lib/stores/loading.js';
	import type { ScrapingResult } from '$lib/services/WebScraperService.js';
	import type { ClaudeServiceResult } from '$lib/services/index.js';
	import { onMount } from 'svelte';

	// Form state
	let manualContent = '';
	let websiteUrl = '';
	let personalNotes = '';
	let scrapedData: ScrapedData | null = null;
	let combinedContent = '';

	// Email generation and preview state
	let generatedEmailContent = '';
	let renderedEmail: RenderedEmail | null = null;
	let isEditingEmail = false;
	let editableEmailContent = '';

	// Sender information for email template
	let senderName = '';
	let senderTitle = '';
	let senderCompany = '';
	let senderEmail = '';
	let senderPhone = '';

	// Recipient information
	let recipientCompany = '';
	let recipientEmail = '';
	let emailSubject = '';
	
	// Template selection
	let selectedTemplateId = 'default';
	let availableTemplates: any[] = [];

	// UI state
	let showScrapedContent = false;
	let showEmailPreview = false;
	let showSendConfirmation = false;

	// Error state
	let scrapingError = '';
	let generationError = '';

	// Services
	const emailTemplateService = new EmailTemplateService();

	// Reactive statements to save form data to localStorage
	$: if (typeof window !== 'undefined') {
		localStorage.setItem('newEmail_websiteUrl', websiteUrl);
		localStorage.setItem('newEmail_recipientCompany', recipientCompany);
		localStorage.setItem('newEmail_recipientEmail', recipientEmail);
		localStorage.setItem('newEmail_emailSubject', emailSubject);
		localStorage.setItem('newEmail_selectedTemplateId', selectedTemplateId);
	}

	// Load sender information from settings on mount
	onMount(() => {
		loadSenderSettings();
		loadFormData();
		loadTemplates();
	});
	
	function loadTemplates() {
		availableTemplates = emailTemplateService.getAllTemplates();
		// Load custom templates from localStorage
		const savedTemplates = localStorage.getItem('customTemplates');
		if (savedTemplates) {
			try {
				const customTemplates = JSON.parse(savedTemplates);
				customTemplates.forEach((t: any) => emailTemplateService.saveTemplate(t));
				availableTemplates = emailTemplateService.getAllTemplates();
			} catch (e) {
				console.error('Failed to load custom templates:', e);
			}
		}
	}

	function loadSenderSettings() {
		senderName = localStorage.getItem('senderName') || '';
		senderTitle = localStorage.getItem('senderTitle') || '';
		senderCompany = localStorage.getItem('senderCompany') || '';
		senderEmail = localStorage.getItem('senderEmail') || '';
		senderPhone = localStorage.getItem('senderPhone') || '';
	}

	function loadFormData() {
		// Load form values from localStorage
		manualContent = localStorage.getItem('newEmail_manualContent') || '';
		websiteUrl = localStorage.getItem('newEmail_websiteUrl') || '';
		personalNotes = localStorage.getItem('newEmail_personalNotes') || '';
		recipientCompany = localStorage.getItem('newEmail_recipientCompany') || '';
		recipientEmail = localStorage.getItem('newEmail_recipientEmail') || '';
		emailSubject = localStorage.getItem('newEmail_emailSubject') || '';
		selectedTemplateId = localStorage.getItem('newEmail_selectedTemplateId') || 'default';
		
		// Load scraped data if exists
		const savedScrapedData = localStorage.getItem('newEmail_scrapedData');
		if (savedScrapedData) {
			try {
				scrapedData = JSON.parse(savedScrapedData);
				showScrapedContent = true;
			} catch (e) {
				console.error('Failed to parse saved scraped data:', e);
			}
		}
		
		// Update combined content if manual content exists
		if (manualContent.trim()) {
			updateCombinedContent();
		}
	}

	function saveFormData() {
		// Save form values to localStorage
		localStorage.setItem('newEmail_manualContent', manualContent);
		localStorage.setItem('newEmail_websiteUrl', websiteUrl);
		localStorage.setItem('newEmail_personalNotes', personalNotes);
		localStorage.setItem('newEmail_recipientCompany', recipientCompany);
		localStorage.setItem('newEmail_recipientEmail', recipientEmail);
		localStorage.setItem('newEmail_emailSubject', emailSubject);
		localStorage.setItem('newEmail_selectedTemplateId', selectedTemplateId);
		
		// Save scraped data if exists
		if (scrapedData) {
			localStorage.setItem('newEmail_scrapedData', JSON.stringify(scrapedData));
		} else {
			localStorage.removeItem('newEmail_scrapedData');
		}
	}

	// Handle manual content input (primary method)
	function handleManualContentChange() {
		updateCombinedContent();
		saveFormData();
	}

	// Handle website URL scraping (optional secondary method)
	async function handleScrapeWebsite() {
		if (!websiteUrl.trim()) {
			NotificationService.showWarning('Missing URL', 'Please enter a website URL to scrape');
			return;
		}

		loading.start(LoadingOperations.SCRAPING);
		scrapedData = null;
		showScrapedContent = false;

		// Show operation start notification
		NotificationService.showOperationStart('scraping');

		try {
			const response = await fetch('/api/scrape', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ url: websiteUrl.trim() })
			});

			const result: ScrapingResult = await response.json();

			if (result.success && result.data) {
				scrapedData = result.data;
				showScrapedContent = true;
				updateCombinedContent();

				// Auto-populate recipient info from scraped data
				if (result.data.businessName) {
					recipientCompany = result.data.businessName;
				}
				if (result.data.contactInfo?.email) {
					recipientEmail = result.data.contactInfo.email;
				}

				// Save to localStorage
				saveFormData();

				// Show success notification
				NotificationService.showOperationSuccess('scraping');

				if (result.requiresManualInput && result.suggestions) {
					NotificationService.showWarning(
						'Scraping Completed', 
						`May need manual review: ${result.suggestions.join(', ')}`
					);
				}
			} else if (result.error) {
				// Handle API-returned errors
				const error = new Error(result.error.message);
				NotificationService.handleError(error, 'scraping');
			}
		} catch (error) {
			// Handle network and other errors
			NotificationService.handleError(error as Error, 'scraping');
		} finally {
			loading.stop(LoadingOperations.SCRAPING);
		}
	}

	// Update combined content from manual input and scraped data
	function updateCombinedContent() {
		let content = '';

		// Primary: Manual content
		if (manualContent.trim()) {
			content += manualContent.trim();
		}

		// Secondary: Scraped content (if available and manual content exists)
		if (scrapedData && manualContent.trim()) {
			content += '\n\nAdditional scraped information:\n';
			content += `Business: ${scrapedData.businessName}\n`;
			if (scrapedData.description) {
				content += `Description: ${scrapedData.description}\n`;
			}
			if (scrapedData.services.length > 0) {
				content += `Services: ${scrapedData.services.join(', ')}\n`;
			}
			if (scrapedData.contactInfo.email) {
				content += `Email: ${scrapedData.contactInfo.email}\n`;
			}
		}

		combinedContent = content;
	}

	// Handle scraped content editing
	function handleScrapedContentEdit(field: string, value: string) {
		if (!scrapedData) return;

		switch (field) {
			case 'businessName':
				scrapedData.businessName = value;
				break;
			case 'description':
				scrapedData.description = value;
				break;
			case 'email':
				scrapedData.contactInfo.email = value;
				break;
		}

		updateCombinedContent();
		saveFormData();
	}

	// Generate email using Claude AI
	async function generateEmail() {
		if (!combinedContent.trim() && !personalNotes.trim()) {
			NotificationService.showWarning(
				'Missing Content', 
				'Please provide either business information or personal notes to generate an email'
			);
			return;
		}

		loading.start(LoadingOperations.GENERATING_EMAIL);
		generatedEmailContent = '';
		showEmailPreview = false;

		// Show operation start notification
		NotificationService.showOperationStart('email_generation');

		try {
			const request: EmailGenerationRequest = {
				manualContent: manualContent.trim() || undefined,
				scrapedData: scrapedData || undefined,
				personalNotes: personalNotes.trim(),
				promptTemplate: `Generate a professional cold email. Use HTML formatting for structure (paragraphs with <p> tags, line breaks with <br>, etc.) but DO NOT include any CSS styling. Write complete, natural sentences - never use placeholders like [your_name_here] or [company_name]. The recipient company name is: ${recipientCompany}`,
				businessContext: combinedContent,
				business_name: recipientCompany
			};

			const response = await fetch('/api/generate-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(request)
			});

			const result: ClaudeServiceResult = await response.json();

			if (result.success && result.data) {
				generatedEmailContent = result.data;
				editableEmailContent = result.data;
				
				// Generate a default subject if not provided
				if (!emailSubject.trim()) {
					emailSubject = `Partnership Opportunity with ${recipientCompany || 'Your Company'}`;
				}
				
				renderEmailWithTemplate();
				showEmailPreview = true;

				// Show success notification
				NotificationService.showOperationSuccess('email_generation');
			} else if (result.error) {
				// Handle API-returned errors
				const error = new Error(result.error.message);
				NotificationService.handleError(error, 'ai claude generate');
			}
		} catch (error) {
			// Handle network and other errors
			NotificationService.handleError(error as Error, 'ai claude generate');
		} finally {
			loading.stop(LoadingOperations.GENERATING_EMAIL);
		}
	}

	// Render email with HTML template
	function renderEmailWithTemplate() {
		try {
			// Simply render the email content with the selected template
			renderedEmail = emailTemplateService.renderEmail(selectedTemplateId, editableEmailContent, recipientCompany);
		} catch (error) {
			console.error('Template rendering error:', error);
			generationError = 'Failed to render email template';
		}
	}

	// Handle email content editing
	function handleEmailEdit() {
		isEditingEmail = true;
	}

	// Save edited email content
	function saveEmailEdit() {
		isEditingEmail = false;
		renderEmailWithTemplate();
	}

	// Cancel email editing
	function cancelEmailEdit() {
		isEditingEmail = false;
		editableEmailContent = generatedEmailContent;
	}

	// Show send confirmation modal
	function showSendModal() {
		showSendConfirmation = true;
	}

	// Hide send confirmation modal
	function hideSendModal() {
		showSendConfirmation = false;
	}

	// Save as draft
	async function saveAsDraft() {
		if (!renderedEmail?.htmlContent) {
			NotificationService.showWarning('No Email Content', 'Please generate an email first');
			return;
		}

		if (!recipientCompany) {
			NotificationService.showWarning('Missing Recipient', 'Please specify the recipient company');
			return;
		}

		loading.start(LoadingOperations.SENDING_EMAIL);

		try {
			// First, create or find the business
			const businessResponse = await fetch('/api/businesses', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: recipientCompany,
					contactEmail: recipientEmail || scrapedData?.contactInfo?.email,
					websiteUrl: websiteUrl || undefined,
					description: manualContent || undefined,
					scrapedData: scrapedData || undefined
				})
			});

			const businessResult = await businessResponse.json();

			if (!businessResult.success) {
				throw new Error('Failed to create business record');
			}

			// Save draft email
			const draftResponse = await fetch('/api/emails/drafts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					businessId: businessResult.businessId,
					subject: emailSubject || `Partnership Opportunity with ${recipientCompany}`,
					htmlContent: renderedEmail.htmlContent,
					personalNotes: personalNotes || undefined
				})
			});

			const draftResult = await draftResponse.json();

			if (draftResult.success) {
				NotificationService.showSuccess('Draft Saved', 'Your email has been saved as a draft');
			} else {
				throw new Error(draftResult.error || 'Failed to save draft');
			}
		} catch (error) {
			NotificationService.handleError(error as Error, 'save draft');
		} finally {
			loading.stop(LoadingOperations.SENDING_EMAIL);
		}
	}

	// Send email
	async function sendEmail() {
		if (!renderedEmail?.htmlContent) {
			NotificationService.showWarning('No Email Content', 'Please generate an email first');
			return;
		}

		if (!recipientCompany) {
			NotificationService.showWarning('Missing Recipient', 'Please specify the recipient company');
			return;
		}

		if (!recipientEmail && !scrapedData?.contactInfo?.email) {
			NotificationService.showWarning('Missing Email', 'Please specify the recipient email address');
			return;
		}

		loading.start(LoadingOperations.SENDING_EMAIL);
		
		// Show operation start notification
		NotificationService.showOperationStart('email_sending');

		try {
			// First, create or find the business
			const businessResponse = await fetch('/api/businesses', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: recipientCompany,
					contactEmail: recipientEmail || scrapedData?.contactInfo?.email,
					websiteUrl: websiteUrl || undefined,
					description: manualContent || undefined,
					scrapedData: scrapedData || undefined
				})
			});

			const businessResult = await businessResponse.json();

			if (!businessResult.success) {
				throw new Error('Failed to create business record');
			}

			const emailData = {
				businessId: businessResult.businessId,
				recipientEmail: recipientEmail || scrapedData?.contactInfo?.email,
				subject: emailSubject || `Partnership Opportunity with ${recipientCompany}`,
				htmlContent: renderedEmail.htmlContent,
				personalNotes: personalNotes || undefined,
				fromName: senderName,
				fromEmail: senderEmail
			};

			const response = await fetch('/api/emails', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(emailData)
			});

			const result = await response.json();

			if (result.success) {
				NotificationService.showOperationSuccess('email_sending');
				hideSendModal();
				
				// Reset form for next email
				resetForm();
			} else {
				const error = new Error(result.error?.message || 'Failed to send email');
				NotificationService.handleError(error, 'email send zoho');
			}
		} catch (error) {
			NotificationService.handleError(error as Error, 'email send zoho');
		} finally {
			loading.stop(LoadingOperations.SENDING_EMAIL);
		}
	}

	// Reset form after successful send
	function resetForm() {
		manualContent = '';
		websiteUrl = '';
		personalNotes = '';
		scrapedData = null;
		combinedContent = '';
		generatedEmailContent = '';
		renderedEmail = null;
		editableEmailContent = '';
		recipientCompany = '';
		recipientEmail = '';
		showScrapedContent = false;
		showEmailPreview = false;
		
		// Clear localStorage (but keep subject and template for reuse)
		clearFormDataFromStorage();
	}

	function clearFormDataFromStorage() {
		localStorage.removeItem('newEmail_manualContent');
		localStorage.removeItem('newEmail_websiteUrl');
		localStorage.removeItem('newEmail_personalNotes');
		localStorage.removeItem('newEmail_recipientCompany');
		localStorage.removeItem('newEmail_recipientEmail');
		localStorage.removeItem('newEmail_scrapedData');
		// Keep subject and template for reuse
	}

	// Clear all form data
	function clearForm() {
		manualContent = '';
		websiteUrl = '';
		personalNotes = '';
		scrapedData = null;
		combinedContent = '';
		showScrapedContent = false;
		generatedEmailContent = '';
		editableEmailContent = '';
		renderedEmail = null;
		showEmailPreview = false;
		isEditingEmail = false;
		showSendConfirmation = false;
		scrapingError = '';
		generationError = '';
		recipientCompany = '';
		recipientEmail = '';
		
		// Clear localStorage (but keep subject and template for reuse)
		clearFormDataFromStorage();
	}
</script>

<svelte:head>
	<title>New Email - Cold Email Pipeline</title>
</svelte:head>

<MainLayout 
	title="Create New Cold Email" 
	description="Enter business information manually or scrape from a website, then generate a personalized email"
>
	<div class="bg-white">
		<div>

			<div class="p-6 space-y-8">
				<!-- Manual Content Input (Primary Method) -->
				<div class="space-y-4">
					<div>
						<label for="manual-content" class="block text-sm font-medium text-gray-700 mb-2">
							Business Information
							<span class="text-red-500">*</span>
							<span class="text-xs text-gray-500 ml-2">(Primary method - describe the target business)</span>
						</label>
						<textarea
							id="manual-content"
							bind:value={manualContent}
							on:input={handleManualContentChange}
							placeholder="Describe the target business: What do they do? What services do they offer? What challenges might they face? Any specific details about their industry or recent news?"
							rows="6"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-vertical"
						></textarea>
						<p class="mt-1 text-xs text-gray-500">
							This is the primary way to provide business information. Be specific about their services, challenges, and opportunities.
						</p>
					</div>
				</div>

				<!-- Website Scraping (Optional Secondary Method) -->
				<div class="space-y-4 border-t pt-6">
					<div>
						<label for="website-url" class="block text-sm font-medium text-gray-700 mb-2">
							Website URL
							<span class="text-xs text-gray-500 ml-2">(Optional - supplement manual information)</span>
						</label>
						<div class="flex space-x-3">
							<input
								id="website-url"
								type="url"
								bind:value={websiteUrl}
								placeholder="https://example.com"
								class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
							/>
							<button
								on:click={handleScrapeWebsite}
								disabled={$loading[LoadingOperations.SCRAPING] || !websiteUrl.trim()}
								class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
							>
								{#if $loading[LoadingOperations.SCRAPING]}
									<LoadingSpinner size="sm" color="white" text="Scraping..." />
								{:else}
									<span>Scrape Website</span>
								{/if}
							</button>
						</div>

						<p class="mt-1 text-xs text-gray-500">
							Optional: Scrape additional information from the business website to supplement your manual description.
						</p>
					</div>
				</div>

				<!-- Scraped Content Display and Editing -->
				{#if showScrapedContent && scrapedData}
					<div class="space-y-4 bg-blue-50 p-4 rounded-lg border-t">
						<h3 class="text-lg font-medium text-gray-900">Scraped Information</h3>
						<p class="text-sm text-gray-600">Review and edit the scraped information as needed:</p>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="scraped-business-name" class="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
								<input
									id="scraped-business-name"
									type="text"
									bind:value={scrapedData.businessName}
									on:input={() => handleScrapedContentEdit('businessName', scrapedData?.businessName || '')}
									class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
							
							<div>
								<label for="scraped-contact-email" class="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
								<input
									id="scraped-contact-email"
									type="email"
									bind:value={scrapedData.contactInfo.email}
									on:input={() => handleScrapedContentEdit('email', scrapedData?.contactInfo.email || '')}
									class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						</div>
						
						<div>
							<label for="scraped-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
							<textarea
								id="scraped-description"
								bind:value={scrapedData.description}
								on:input={() => handleScrapedContentEdit('description', scrapedData?.description || '')}
								rows="3"
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
							></textarea>
						</div>
						
						{#if scrapedData.services.length > 0}
							<div>
								<p class="block text-sm font-medium text-gray-700 mb-1">Services</p>
								<p class="text-sm text-gray-600">{scrapedData.services.join(', ')}</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Personal Notes Input -->
				<div class="space-y-4 border-t pt-6">
					<div>
						<label for="personal-notes" class="block text-sm font-medium text-gray-700 mb-2">
							Personal Notes & Analysis
							<span class="text-red-500">*</span>
						</label>
						<textarea
							id="personal-notes"
							bind:value={personalNotes}
							on:input={() => {
								if (typeof window !== 'undefined') {
									localStorage.setItem('newEmail_personalNotes', personalNotes);
								}
							}}
							placeholder="Add your personal insights, analysis, or specific talking points about this business. What value can you offer them? What problems might they have that you can solve?"
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-vertical"
						></textarea>
						<p class="mt-1 text-xs text-gray-500">
							Your personal analysis and insights about the business that will help create a more targeted email.
						</p>
					</div>
				</div>

				<!-- Recipient Information -->
				<div class="space-y-4 border-t pt-6">
					<h3 class="text-lg font-medium text-gray-900">Recipient Information</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="recipient-company" class="block text-sm font-medium text-gray-700 mb-1">
								Recipient Company <span class="text-red-500">*</span>
							</label>
							<input
								id="recipient-company"
								type="text"
								bind:value={recipientCompany}
								placeholder="Acme Corporation"
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
							/>
							<p class="mt-1 text-xs text-gray-500">
								This will be used as the business name in your email template
							</p>
						</div>
						
						<div>
							<label for="recipient-email" class="block text-sm font-medium text-gray-700 mb-1">
								Recipient Email <span class="text-red-500">*</span>
							</label>
							<input
								id="recipient-email"
								type="email"
								bind:value={recipientEmail}
								placeholder="contact@acme.com"
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>
				</div>

				<!-- Email Configuration -->
				<div class="space-y-4 border-t pt-6">
					<h3 class="text-lg font-medium text-gray-900">Email Configuration</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="md:col-span-2">
							<label for="email-subject" class="block text-sm font-medium text-gray-700 mb-1">
								Email Subject
							</label>
							<input
								id="email-subject"
								type="text"
								bind:value={emailSubject}
								placeholder="Partnership Opportunity"
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
							/>
							<p class="mt-1 text-xs text-gray-500">
								Subject is saved for reuse. Leave blank to use auto-generated subject.
							</p>
						</div>
						
						<div class="md:col-span-2">
							<label for="template-selector" class="block text-sm font-medium text-gray-700 mb-1">
								Email Template
							</label>
							<div class="flex space-x-3">
								<select
									id="template-selector"
									bind:value={selectedTemplateId}
									class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
								>
									{#each availableTemplates as template}
										<option value={template.id}>{template.name}</option>
									{/each}
								</select>
								<a
									href="/templates"
									target="_blank"
									class="px-4 py-2 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								>
									Manage Templates
								</a>
							</div>
						</div>
					</div>
				</div>

				<!-- Sender Information -->
				<div class="space-y-4 border-t pt-6">
					<h3 class="text-lg font-medium text-gray-900">Sender Information</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="sender-name" class="block text-sm font-medium text-gray-700 mb-1">
								Your Name <span class="text-red-500">*</span>
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
							<label for="sender-title" class="block text-sm font-medium text-gray-700 mb-1">
								Your Title
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
							<label for="sender-company" class="block text-sm font-medium text-gray-700 mb-1">
								Your Company <span class="text-red-500">*</span>
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
							<label for="sender-email" class="block text-sm font-medium text-gray-700 mb-1">
								Your Email <span class="text-red-500">*</span>
							</label>
							<input
								id="sender-email"
								type="email"
								bind:value={senderEmail}
								placeholder="john.doe@company.com"
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						
						<div>
							<label for="sender-phone" class="block text-sm font-medium text-gray-700 mb-1">
								Your Phone
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

				<!-- Action Buttons -->
				<div class="flex justify-between items-center pt-6 border-t">
					<button
						on:click={clearForm}
						class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					>
						Clear Form
					</button>
					
					<button
						on:click={generateEmail}
						disabled={$loading[LoadingOperations.GENERATING_EMAIL] || (!combinedContent.trim() && !personalNotes.trim())}
						class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
					>
						{#if $loading[LoadingOperations.GENERATING_EMAIL]}
							<LoadingSpinner size="sm" color="white" text="Generating..." />
						{:else}
							<span>Generate Email</span>
						{/if}
					</button>
				</div>


			</div>
		</div>

		<!-- Email Preview Section -->
		{#if showEmailPreview && renderedEmail}
			<div class="mt-8 bg-white shadow-lg rounded-lg">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-xl font-bold text-gray-900">Generated Email Preview</h2>
					<p class="mt-1 text-sm text-gray-600">Review and edit your generated email before sending.</p>
				</div>
				
				<div class="p-6">
					<!-- Email Subject -->
					<div class="mb-6">
						<label for="preview-subject" class="block text-sm font-medium text-gray-700 mb-2">
							Subject Line
						</label>
						<input
							id="preview-subject"
							type="text"
							bind:value={emailSubject}
							placeholder="Partnership Opportunity"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						/>
						<p class="mt-1 text-xs text-gray-500">
							Edit the subject line. It will be saved for reuse.
						</p>
					</div>
					
					<!-- Recipient Email -->
					<div class="mb-6">
						<label for="preview-to" class="block text-sm font-medium text-gray-700 mb-2">
							To
						</label>
						<input
							id="preview-to"
							type="email"
							bind:value={recipientEmail}
							placeholder="recipient@company.com"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<!-- Email Content Editing -->
					{#if isEditingEmail}
						<div class="mb-6">
							<label for="edit-email-content" class="block text-sm font-medium text-gray-700 mb-2">
								Edit Email Content
							</label>
							<textarea
								id="edit-email-content"
								bind:value={editableEmailContent}
								rows="12"
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-vertical font-mono text-sm"
							></textarea>
							<div class="mt-3 flex justify-end space-x-3">
								<button
									on:click={cancelEmailEdit}
									class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
								>
									Cancel
								</button>
								<button
									on:click={saveEmailEdit}
									class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
								>
									Save Changes
								</button>
							</div>
						</div>
					{:else}
						<!-- HTML Email Preview -->
						<div class="mb-6">
							<div class="flex justify-between items-center mb-3">
								<h3 class="text-lg font-medium text-gray-900">HTML Preview</h3>
								<button
									on:click={handleEmailEdit}
									class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								>
									Edit Content
								</button>
							</div>
							<div class="border border-gray-300 rounded-lg overflow-hidden">
								<div class="bg-gray-100 px-4 py-2 border-b border-gray-300">
									<p class="text-xs text-gray-600">Email Preview</p>
								</div>
								<div class="bg-white p-4 max-h-96 overflow-y-auto">
									{@html renderedEmail.htmlContent}
								</div>
							</div>
						</div>

						<!-- Plain Text Version -->
						<div class="mb-6">
							<h3 class="text-lg font-medium text-gray-900 mb-3">Plain Text Version</h3>
							<div class="bg-gray-50 p-4 rounded-lg border">
								<pre class="whitespace-pre-wrap text-sm text-gray-800 font-mono">{renderedEmail.textContent}</pre>
							</div>
						</div>
					{/if}

					<!-- Action Buttons -->
					{#if !isEditingEmail}
						<div class="flex justify-between items-center pt-4 border-t">
							<button
								on:click={clearForm}
								class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
							>
								Start Over
							</button>
							
							<div class="flex space-x-3">
								<button
									on:click={handleEmailEdit}
									class="px-4 py-2 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								>
									Edit Email
								</button>
								<button
									on:click={saveAsDraft}
									disabled={$loading[LoadingOperations.SENDING_EMAIL]}
									class="px-4 py-2 text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Save as Draft
								</button>
								<button
									on:click={showSendModal}
									class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
								>
									Send Email
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Send Confirmation Modal -->
		{#if showSendConfirmation}
			<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
				<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
					<div class="mt-3 text-center">
						<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
							<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
							</svg>
						</div>
						<h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Send Email</h3>
						<div class="mt-2 px-7 py-3">
							<p class="text-sm text-gray-500">
								Are you ready to send this email? Make sure all the information is correct.
							</p>
							{#if recipientEmail}
								<p class="text-sm text-gray-700 mt-2">
									<strong>To:</strong> {recipientEmail}
								</p>
							{/if}
							{#if recipientCompany}
								<p class="text-sm text-gray-700">
									<strong>Company:</strong> {recipientCompany}
								</p>
							{/if}
							{#if emailSubject}
								<p class="text-sm text-gray-700">
									<strong>Subject:</strong> {emailSubject}
								</p>
							{/if}
						</div>
						<div class="items-center px-4 py-3">
							<div class="flex justify-center space-x-3">
								<button
									on:click={hideSendModal}
									class="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
								>
									Cancel
								</button>
								<button
									on:click={sendEmail}
									disabled={$loading[LoadingOperations.SENDING_EMAIL]}
									class="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
								>
									{#if $loading[LoadingOperations.SENDING_EMAIL]}
										<LoadingSpinner size="sm" color="white" text="Sending..." />
									{:else}
										<span>Send Email</span>
									{/if}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</MainLayout>