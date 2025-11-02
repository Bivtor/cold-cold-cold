-- Cold Email Pipeline Database Schema

-- Businesses table - stores information about target businesses
CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  website_url TEXT,
  contact_email TEXT,
  description TEXT,
  scraped_data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email drafts and sent emails
CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  personal_notes TEXT,
  send_status TEXT CHECK(send_status IN ('draft', 'sent', 'failed')) DEFAULT 'draft',
  response_status TEXT CHECK(response_status IN ('no_response', 'good_response', 'bad_response')) DEFAULT 'no_response',
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses (id)
);

-- Saved notes/prompts for AI generation
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email tracking and analytics
CREATE TABLE IF NOT EXISTS email_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id INTEGER,
  event_type TEXT, -- 'sent', 'opened', 'clicked', 'replied'
  event_data JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_id) REFERENCES emails (id)
);

-- Indexes for performance optimization

-- Business indexes
CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(name);
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(contact_email);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);

-- Email indexes
CREATE INDEX IF NOT EXISTS idx_emails_business_id ON emails(business_id);
CREATE INDEX IF NOT EXISTS idx_emails_send_status ON emails(send_status);
CREATE INDEX IF NOT EXISTS idx_emails_response_status ON emails(response_status);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- Email analytics indexes
CREATE INDEX IF NOT EXISTS idx_email_analytics_email_id ON email_analytics(email_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_event_type ON email_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_email_analytics_timestamp ON email_analytics(timestamp);