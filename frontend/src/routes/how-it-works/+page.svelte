<script lang="ts">
	import { MainLayout } from '$lib/components';
</script>

<svelte:head>
	<title>How It Works - Cold Email Pipeline</title>
</svelte:head>

<MainLayout 
	title="How It Works" 
	description="Understanding the AI-powered email generation process"
>
	<div class="p-6 max-w-4xl mx-auto">
		<div class="space-y-8">
			<!-- Overview -->
			<section class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
				<p class="text-gray-700 leading-relaxed">
					This application uses Claude AI (Anthropic) to generate personalized cold emails based on business information you provide. 
					The system combines multiple data sources and your personal insights to create targeted, professional outreach emails.
				</p>
			</section>

			<!-- Data Collection -->
			<section class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">1. Data Collection</h2>
				
				<div class="space-y-4">
					<div class="border-l-4 border-blue-500 pl-4">
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Primary Input: Business Information</h3>
						<p class="text-gray-700 mb-2">
							The main way to provide information about your target business. This field is sent to the AI as:
						</p>
						<ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
							<li><code class="bg-gray-100 px-2 py-1 rounded text-sm">manualContent</code> - Your description of the business</li>
							<li><code class="bg-gray-100 px-2 py-1 rounded text-sm">businessContext</code> - Combined content from all sources</li>
						</ul>
					</div>

					<div class="border-l-4 border-green-500 pl-4">
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Secondary Input: Website Scraping (Optional)</h3>
						<p class="text-gray-700 mb-2">
							If you provide a URL, the system scrapes and extracts:
						</p>
						<ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
							<li>Business name</li>
							<li>Description</li>
							<li>Services offered</li>
							<li>Contact information</li>
							<li>Key content from the website</li>
						</ul>
						<p class="text-sm text-gray-500 mt-2">
							This data is sent to the AI as <code class="bg-gray-100 px-2 py-1 rounded">scrapedData</code> object
						</p>
					</div>

					<div class="border-l-4 border-purple-500 pl-4">
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Required: Personal Notes & Analysis</h3>
						<p class="text-gray-700 mb-2">
							Your insights and analysis about the business. This is sent to the AI as:
						</p>
						<ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
							<li><code class="bg-gray-100 px-2 py-1 rounded text-sm">personalNotes</code> - Your specific insights and value propositions</li>
						</ul>
					</div>
				</div>
			</section>

			<!-- AI Processing -->
			<section class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">2. AI Processing</h2>
				
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Model Used</h3>
					<p class="text-gray-700">
						<strong>Claude 3 Haiku</strong> (claude-3-haiku-20240307)
					</p>
					<ul class="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-2">
						<li>Max tokens: 1000</li>
						<li>Temperature: 0.7 (balanced creativity)</li>
						<li>Automatic retry with backoff on failures</li>
					</ul>
				</div>

				<h3 class="text-lg font-semibold text-gray-900 mb-3">The AI Prompt Structure</h3>
				<p class="text-gray-700 mb-3">The system constructs a detailed prompt that includes:</p>
				
				<div class="bg-gray-50 rounded-lg p-4 space-y-3">
					<div>
						<p class="font-mono text-sm text-gray-800 font-semibold">BUSINESS CONTEXT:</p>
						<p class="text-sm text-gray-600 ml-4">Combined content from manual input and scraped data</p>
					</div>
					
					<div>
						<p class="font-mono text-sm text-gray-800 font-semibold">PERSONAL NOTES/ANALYSIS:</p>
						<p class="text-sm text-gray-600 ml-4">Your insights and value propositions</p>
					</div>
					
					<div>
						<p class="font-mono text-sm text-gray-800 font-semibold">MANUAL BUSINESS INFORMATION:</p>
						<p class="text-sm text-gray-600 ml-4">Your description of the target business (if provided)</p>
					</div>
					
					<div>
						<p class="font-mono text-sm text-gray-800 font-semibold">SCRAPED WEBSITE DATA:</p>
						<p class="text-sm text-gray-600 ml-4">Structured data from website scraping (if available)</p>
					</div>
				</div>

				<div class="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h4 class="font-semibold text-gray-900 mb-2">AI Instructions</h4>
					<p class="text-sm text-gray-700 mb-2">The AI is instructed to:</p>
					<ul class="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
						<li>Write a personalized email demonstrating research</li>
						<li>Keep it concise (150-250 words)</li>
						<li>Include a clear value proposition</li>
						<li>End with a specific, low-commitment call to action</li>
						<li>Use professional but conversational tone</li>
						<li>Make it feel personal, not templated</li>
						<li>Focus on solving their problems or improving their business</li>
					</ul>
				</div>
			</section>

			<!-- Email Rendering -->
			<section class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">3. Email Rendering</h2>
				
				<p class="text-gray-700 mb-4">
					After the AI generates the email content, the system wraps it in a professional HTML template with:
				</p>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="bg-gray-50 rounded-lg p-4">
						<h3 class="font-semibold text-gray-900 mb-2">From Settings & Environment</h3>
						<ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
							<li>Your name</li>
							<li>Your title</li>
							<li>Your company</li>
							<li>Your email</li>
							<li>Your phone (optional)</li>
						</ul>
					</div>

					<div class="bg-gray-50 rounded-lg p-4">
						<h3 class="font-semibold text-gray-900 mb-2">From Form</h3>
						<ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
							<li>Recipient name (optional)</li>
							<li>Recipient company</li>
							<li>AI-generated content</li>
							<li>Call to action</li>
						</ul>
					</div>
				</div>

				<div class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
					<p class="text-sm text-gray-700">
						<strong>Output:</strong> Both HTML and plain text versions of the email are generated for maximum compatibility.
					</p>
				</div>
			</section>

			<!-- What's NOT Sent to AI -->
			<section class="bg-red-50 border border-red-200 rounded-lg p-6">
				<h2 class="text-2xl font-bold text-red-900 mb-4">What's NOT Sent to the AI</h2>
				
				<p class="text-gray-700 mb-3">
					The following information is used only for email rendering and is NOT included in the AI prompt:
				</p>

				<ul class="list-disc list-inside text-gray-700 space-y-2 ml-4">
					<li>Your sender information (name, title, company, email, phone)</li>
					<li>Recipient name</li>
					<li>Recipient company name (used only in template)</li>
					<li>Email template styling and formatting</li>
					<li>Unsubscribe links</li>
				</ul>

				<p class="text-sm text-gray-600 mt-3">
					These fields are added after the AI generates the email content, during the template rendering phase.
				</p>
			</section>

			<!-- API Flow -->
			<section class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Technical Flow</h2>
				
				<div class="space-y-3">
					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
						<div>
							<p class="font-semibold text-gray-900">Form Submission</p>
							<p class="text-sm text-gray-600">Frontend sends <code class="bg-gray-100 px-2 py-1 rounded">EmailGenerationRequest</code> to <code class="bg-gray-100 px-2 py-1 rounded">/api/generate-email</code></p>
						</div>
					</div>

					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
						<div>
							<p class="font-semibold text-gray-900">API Validation</p>
							<p class="text-sm text-gray-600">Server validates that at least one of: personalNotes, manualContent, or scrapedData is provided</p>
						</div>
					</div>

					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
						<div>
							<p class="font-semibold text-gray-900">Claude Service</p>
							<p class="text-sm text-gray-600">ClaudeService builds prompt and calls Anthropic API with retry logic</p>
						</div>
					</div>

					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
						<div>
							<p class="font-semibold text-gray-900">Response Processing</p>
							<p class="text-sm text-gray-600">AI-generated content is returned to frontend</p>
						</div>
					</div>

					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
						<div>
							<p class="font-semibold text-gray-900">Template Rendering</p>
							<p class="text-sm text-gray-600">Frontend combines AI content with sender/recipient info using EmailTemplateService</p>
						</div>
					</div>

					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">6</div>
						<div>
							<p class="font-semibold text-gray-900">Preview & Edit</p>
							<p class="text-sm text-gray-600">User can review, edit, and send the final email</p>
						</div>
					</div>
				</div>
			</section>

			<!-- Error Handling -->
			<section class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Error Handling & Retry Logic</h2>
				
				<div class="space-y-3">
					<p class="text-gray-700">The system includes robust error handling:</p>
					
					<ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
						<li><strong>Automatic Retries:</strong> Up to 2 retries with exponential backoff (1000ms base delay)</li>
						<li><strong>API Key Validation:</strong> Checks if Claude API key is configured before making requests</li>
						<li><strong>User-Friendly Errors:</strong> Converts technical errors into actionable messages</li>
						<li><strong>Retry Indicators:</strong> Tells you if an error is retryable or requires action</li>
					</ul>
				</div>
			</section>

			<!-- Data Storage -->
			<section class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Data Storage</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="bg-blue-50 rounded-lg p-4">
						<h3 class="font-semibold text-gray-900 mb-2">LocalStorage</h3>
						<ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
							<li>Sender settings</li>
						</ul>
					</div>

					<div class="bg-purple-50 rounded-lg p-4">
						<h3 class="font-semibold text-gray-900 mb-2">Environment Variables (.env)</h3>
						<ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
							<li>API keys (Claude, Zoho)</li>
							<li>Database configuration</li>
						</ul>
					</div>

					<div class="bg-green-50 rounded-lg p-4">
						<h3 class="font-semibold text-gray-900 mb-2">SQLite Database</h3>
						<ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
							<li>Email history</li>
							<li>Business notes</li>
							<li>Analytics data</li>
						</ul>
					</div>
				</div>
			</section>
		</div>
	</div>
</MainLayout>
