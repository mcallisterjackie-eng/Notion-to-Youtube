# Notion → YouTube SaaS
# Claude Code Development Plan
## Version 1.0

---

# Purpose

This document defines the controlled development process for the Notion → YouTube SaaS.

Claude Code must build the application **in phases**.

The goal is to prevent the application from being built all at once, to avoid premature architectural decisions, and to ensure each major subsystem is tested before the next subsystem is added.

The project has three primary reference documents:

- `DESIGN_SPEC.md` — product requirements and backend/system architecture
- `FRONTEND_SPEC.md` — frontend UX, page structure, layouts, and interactions
- `BRAND_GUIDELINES.md` — visual identity and design system

These documents are the source of truth.

---

# CRITICAL DEVELOPMENT RULES

## Rule 1 — Build in phases

Do not build the entire application at once.

Complete one phase, test it, review it, and obtain explicit approval before proceeding to the next phase.

---

## Rule 2 — Do not skip ahead

Do not implement functionality belonging primarily to a later phase simply because it is convenient while working on the current phase.

If a later-phase dependency is required to make the current phase work, explain the dependency before implementing it.

---

## Rule 3 — Explain before coding

Before beginning each phase, provide:

1. What this phase is intended to accomplish.
2. Which requirements from the Design Spec it implements.
3. What files/components will be created or changed.
4. What will explicitly NOT be built yet.
5. Any architectural decisions that need approval.

Wait for approval before beginning substantial implementation.

---

## Rule 4 — Test every phase

At the end of each phase:

1. Run appropriate tests.
2. Verify the implementation.
3. Explain what was completed.
4. Identify any known limitations or unresolved issues.
5. Provide a concise test summary.
6. Wait for explicit approval before moving to the next phase.

---

## Rule 5 — Do not invent product requirements

If a requirement is unclear, do not silently invent a product behavior.

Identify the ambiguity and ask for clarification.

Minor implementation details may be chosen by Claude Code when they do not materially affect product behavior or architecture.

---

## Rule 6 — Preserve the architecture

The system is intended to be:

**Simple → Configurable → Reliable → Secure → Extensible**

Do not introduce unnecessary infrastructure, services, abstractions, queues, storage systems, or third-party tools unless they are justified by the Design Spec or required by implementation.

---

## Rule 7 — Notion is the customer's workflow system

Do not turn the SaaS dashboard into a replacement for Notion.

Notion remains the customer's primary video/content logging and workflow system.

The SaaS dashboard is an automation control, monitoring, configuration, and troubleshooting interface.

---

## Rule 8 — The SaaS does not store customer videos

The MVP does not provide video hosting or video storage.

Google Drive is the MVP video source.

The SaaS retrieves the customer's video from Google Drive and sends it to YouTube.

---

## Rule 9 — Customer configuration must remain flexible

Do not hard-code assumptions such as:

- Status
- Video File
- Publish Date
- YouTube URL
- Ready to Upload
- Published
- Failed

These are examples only.

Customers may use different property names and workflow values.

The Field Mapping Engine must allow the customer's existing Notion workflow to be configured.

---

## Rule 10 — YouTube fields must always be human-friendly

Never expose raw YouTube API property names to customers.

For example:

Do NOT display:

`snippet.title`

Display:

**Video Title**

Do NOT display:

`status.selfDeclaredMadeForKids`

Display:

**Made for Kids**

API terminology may exist internally in code and documentation, but customer-facing UI must use human-friendly terminology.

---

# PHASE 1 — PROJECT FOUNDATION

## Goal

Create the application skeleton and development environment.

## Build

- GitHub repository structure
- Frontend application
- Supabase project connection
- Environment variable structure
- Authentication foundation
- Basic routing
- Base application layout
- Navigation
- Brand/design system implementation
- Responsive framework
- Basic error boundary/logging
- Initial project documentation structure

## Do NOT build yet

- Notion integration
- YouTube integration
- Google Drive integration
- Stripe
- Upload automation
- Field Mapping Engine
- Production upload processing

## Success criteria

A user can:

- Open the application.
- See the branded application shell.
- Navigate basic pages.
- Reach the authentication flow.
- Sign up/log in if authentication is implemented in this phase.
- See a functioning responsive foundation.

## Phase checkpoint

Before moving on:

- Verify the application runs.
- Verify the frontend build works.
- Verify environment configuration.
- Verify the basic design system is applied.
- Explain the project structure.
- Identify any technical decisions made.

Wait for explicit approval.

---

# PHASE 2 — DATABASE & SECURITY FOUNDATION

## Goal

Build the underlying application data model and customer isolation.

## Build

Supabase/PostgreSQL structures for:

- Users
- Accounts
- Subscriptions
- Connections
- Notion databases
- Field mappings
- Automation configuration
- Upload jobs
- Errors
- Usage tracking
- YouTube connections
- Google Drive connections

Implement:

- Supabase Auth
- Row Level Security
- Customer/account isolation
- Basic account lifecycle
- Secure backend access patterns

## Important

The database should support the configurable architecture defined in `DESIGN_SPEC.md`.

Do not design tables around one specific customer's Notion database structure.

## Success criteria

The backend can securely:

- Create an account.
- Associate authenticated users with the correct account.
- Store account configuration.
- Prevent one customer from accessing another customer's data.

## Phase checkpoint

Explain:

- Database tables
- Relationships
- RLS policies
- Authentication model
- Any assumptions

Run security and database tests.

Wait for explicit approval.

---

# PHASE 3 — ONBOARDING & CONNECTIONS

## Goal

Allow a real customer to connect the external services required by the MVP.

## Build

Onboarding flow:

### Step 1
Create account.

### Step 2
Connect Notion.

### Step 3
Connect YouTube.

### Step 4
Connect Google Drive.

### Step 5
Select/configure the relevant Notion database.

### Step 6
Validate connections.

The UI should clearly communicate:

- Connected
- Not connected
- Connection error
- Permission problem
- Reconnect
- Connection health

## Important

Do not begin the actual upload automation yet.

The purpose of this phase is to establish secure, working connections.

## Success criteria

A real test account can:

- Connect Notion.
- Connect YouTube.
- Connect Google Drive.
- Select the appropriate Notion database.
- Validate each connection.

## Phase checkpoint

Test all three integrations.

Document:

- OAuth scopes
- Tokens/credentials handling
- Permissions
- Connection storage
- Reconnection behavior

Wait for explicit approval.

---

# PHASE 4 — FIELD MAPPING ENGINE

## Goal

Build the system that allows the SaaS to adapt to each customer's existing Notion database.

This is one of the most important phases.

## Build

### Notion property discovery

Retrieve and understand the properties available in the customer's selected database.

Display:

- Property name
- Property type
- Available options where relevant

### Mapping interface

Allow the customer to map:

- Trigger field
- Trigger value
- Video/file field
- YouTube input fields
- YouTube output fields
- Workflow/status field
- Publication/scheduling fields
- Error fields

### Validation

Validate:

- Required mappings exist.
- Property types are compatible.
- Required status options exist.
- Required output fields exist.
- Required configuration is complete.

### Missing fields

If a required field is missing:

- Identify it.
- Display the required field type.
- Prompt the customer to create it.
- Allow them to return to setup.
- Revalidate.

Do not silently create fields.

### Status mapping

Support reuse of a Notion status option across multiple SaaS workflow stages.

Example:

Notion:

> Status → Published

may represent:

- Uploaded → Published
- Scheduled → Published

Do not assume one Notion status option can only represent one internal workflow stage.

### YouTube fields

Customer-facing labels must be human-friendly.

Examples:

- Video Title
- Description
- Tags
- Category
- Visibility
- Publish Date & Time
- Made for Kids
- Contains Synthetic Media
- License
- Recording Date

Do not expose raw API names.

## Success criteria

The customer can connect a Notion database with arbitrary property names and configure the SaaS correctly.

For example:

One customer might use:

- Status
- Video
- YouTube Title
- Publish
- YouTube URL

Another might use:

- Workflow
- Final Video
- Title
- Release Date
- Published Link

Both must be supported without code changes.

## Phase checkpoint

Test the mapping engine against multiple different Notion database structures.

Verify that:

- No property names are hard-coded.
- Property types are validated.
- Status mappings are flexible.
- Human-friendly YouTube labels are used.
- Missing configuration is clearly identified.

Wait for explicit approval.

---

# PHASE 5 — NOTION TRIGGER & AUTOMATION ENGINE

## Goal

Make the system correctly determine when a Notion record is ready for processing.

## Build

- Notion webhook/event handling
- Trigger evaluation
- Automation Enabled/Inactive
- Subscription eligibility check
- Usage-limit check
- Activation protection
- New-record detection
- Existing-record trigger-state changes
- Duplicate-event protection
- Event/job deduplication

## Critical activation behavior

Records already in the trigger state before activation must NOT be processed automatically.

Example:

Before activation:

- Video A → Published
- Video B → Ready to Upload
- Video C → Draft
- Video D → Ready to Upload

After activation:

- B → Do not upload
- D → Do not upload
- New Video E → Ready to Upload → eligible
- A changes to Ready to Upload → eligible

## Important

At the end of this phase, the system should be able to correctly identify:

> "This Notion record is eligible for processing."

It should **not yet perform the real YouTube upload.**

## Success criteria

Test:

- New record already in trigger state.
- Existing record entering trigger state.
- Existing record already in trigger state before activation.
- Duplicate events.
- Automation disabled.
- Subscription inactive.
- Usage limit reached.

## Phase checkpoint

Run extensive trigger tests.

Do not proceed until event detection and activation protection are reliable.

Wait for explicit approval.

---

# PHASE 6 — GOOGLE DRIVE → YOUTUBE UPLOAD ENGINE

## Goal

Build the core video upload pipeline.

This is the first phase where the SaaS performs the actual end-to-end upload.

## Build

Pipeline:

```text
Notion trigger
      ↓
Validate record
      ↓
Get Google Drive URL
      ↓
Access video
      ↓
Retrieve video
      ↓
Send to YouTube
      ↓
Apply mapped YouTube fields
      ↓
Receive YouTube Video ID
```

Implement:

- Google Drive file access
- Google Drive permission handling
- File validation
- Video retrieval
- YouTube upload
- YouTube metadata
- Visibility
- Scheduling
- Upload job creation
- Job state tracking
- Initial YouTube error handling

## Important

Prioritize the happy path first.

The first successful end-to-end flow should be:

> Notion → Google Drive → YouTube → success

Do not attempt to perfect every retry/error behavior before the core upload works.

## Success criteria

A valid Notion record can trigger an upload.

The system can:

1. Detect the record.
2. Retrieve the Google Drive video.
3. Upload it to YouTube.
4. Apply configured YouTube metadata.
5. Receive the YouTube Video ID.
6. Record the upload job.

## Phase checkpoint

Perform real end-to-end testing with an actual video.

Verify:

- Video retrieval
- Upload
- Metadata
- Visibility
- Scheduling
- Job creation

Wait for explicit approval.

---

# PHASE 7 — NOTION OUTPUTS & ERROR SYSTEM

## Goal

Complete the feedback loop between the SaaS and the customer's Notion workflow.

## Successful upload

Write configured outputs back to Notion:

- Workflow/status
- YouTube Video ID
- YouTube Video URL
- YouTube Studio Edit URL
- Other configured outputs

## Failure

Write:

- Configured failure status
- Error Code
- Error Message

Also:

- Store technical error in Supabase.
- Store the related upload job.
- Display the error in the SaaS dashboard.

## Error categories

Begin classifying errors into categories such as:

- Customer/configuration error
- Authentication error
- Permission error
- Notion error
- Google Drive error
- YouTube error
- Network/system error
- Temporary service error
- Usage/subscription error

## Important

Do not automatically retry every error.

Retry behavior will be finalized after the error classes are understood.

## Success criteria

A successful upload updates Notion correctly.

A failed upload updates Notion correctly and creates an appropriate backend error record.

## Phase checkpoint

Test:

- Missing video
- Invalid video URL
- Inaccessible Google Drive file
- Missing required metadata
- YouTube error
- Permission error
- Successful upload

Wait for explicit approval.

---

# PHASE 8 — DASHBOARD & OPERATIONS

## Goal

Build the customer-facing operational interface around the working automation engine.

The dashboard is **not** a replacement for Notion.

It allows the customer to monitor, configure, troubleshoot, and control the automation.

## Build

### Dashboard overview

Show:

- Automation status
- Connection health
- Recent uploads
- Failed uploads
- Scheduled uploads
- Usage this billing period

### Upload history

Show:

- Video/record reference
- Status
- Date
- YouTube result
- Error
- Job information

### Job detail

Show:

- Notion record
- Upload attempt
- Source
- YouTube result
- Errors
- Timestamp
- Job state

### Actions

- Retry
- Republish

### Settings

- Connections
- Field mappings
- Automation
- Account
- Billing

## Success criteria

A customer can operate and troubleshoot the SaaS without needing access to Supabase or developer logs.

## Phase checkpoint

Review the complete frontend against:

- `FRONTEND_SPEC.md`
- `BRAND_GUIDELINES.md`
- `DESIGN_SPEC.md`

Wait for explicit approval.

---

# PHASE 9 — BILLING & USAGE

## Goal

Turn the working MVP into a subscription product.

## Pricing

**$12/month**

## Usage limit

**100 videos/month**

Once the customer reaches the limit:

> Additional videos cannot be processed until the next billing cycle or a future higher-tier plan is selected.

## Build

Stripe integration for:

- Checkout
- Subscription creation
- Subscription status
- Billing status
- Cancellation
- Payment failure
- Subscription expiration

Usage system for:

- Monthly video count
- Usage reset
- Usage limit enforcement

## Automation rules

Subscription status and automation status are separate.

### Active subscription + Automation Enabled

Automation can run.

### Active subscription + Automation Inactive

Automation cannot run.

### Expired subscription + Automation Enabled

Automation cannot run.

### Payment failure

Automation cannot be re-enabled until payment is successfully processed.

## Success criteria

A test customer can:

- Subscribe.
- Use the service.
- Reach the usage limit.
- See usage.
- Cancel.
- Become inactive.
- Be prevented from processing when subscription requirements are not met.

## Phase checkpoint

Test Stripe webhooks and all subscription states.

Wait for explicit approval.

---

# PHASE 10 — HARDENING, TESTING & PRODUCTION LAUNCH

## Goal

Prepare the MVP for real customers.

This phase should occur only after the complete MVP workflow works.

---

## Notion testing

Test:

- Different property names
- Different property types
- Missing fields
- Missing status options
- New records
- Existing records
- Trigger changes
- Duplicate events
- Activation protection

---

## Google Drive testing

Test:

- Valid file
- Missing file
- Deleted file
- Wrong permissions
- Invalid URL
- Inaccessible file
- Large file
- Unsupported file

---

## YouTube testing

Test:

- Successful upload
- Invalid metadata
- Invalid scheduling
- Permission errors
- OAuth expiration
- API failures
- Processing delays
- Visibility settings
- Metadata mapping

---

## Account testing

Test:

- Active subscription
- Expired subscription
- Payment failure
- 100-video limit
- Automation disabled
- Automation enabled
- Subscription cancellation
- Re-subscription

---

## Security testing

Test:

- Customer A cannot access Customer B.
- RLS policies.
- Authentication.
- OAuth credential protection.
- Webhook validation.
- API endpoint authorization.
- Frontend manipulation attempts.
- Backend account ownership validation.
- Sensitive information exposure.

---

## Reliability testing

Test:

- Duplicate events
- Failed jobs
- Interrupted operations
- Retry behavior
- Republish behavior
- Multiple upload jobs for one Notion record
- YouTube processing delays

---

## Production preparation

Configure:

- Vercel production deployment
- Supabase production environment
- Production environment variables
- Stripe production configuration
- Google/YouTube production configuration
- Notion production configuration
- Google Drive production configuration
- Logging
- Monitoring
- Error reporting
- OAuth production requirements
- API verification requirements where applicable

---

# DEVELOPMENT ORDER SUMMARY

```text
PHASE 1
Project Foundation
        ↓
PHASE 2
Database + Security
        ↓
PHASE 3
Connections + Onboarding
        ↓
PHASE 4
Field Mapping Engine
        ↓
PHASE 5
Notion Trigger Engine
        ↓
PHASE 6
Google Drive → YouTube
        ↓
PHASE 7
Notion Results + Errors
        ↓
PHASE 8
Dashboard + Operations
        ↓
PHASE 9
Stripe + Usage
        ↓
PHASE 10
Testing + Production Launch
```

---

# FINAL INSTRUCTION TO CLAUDE CODE

The objective is **not** to generate the entire application as quickly as possible.

The objective is to build a reliable, understandable, maintainable SaaS through controlled increments.

At every phase:

1. Understand the requirements.
2. Explain the proposed implementation.
3. Identify dependencies.
4. Identify what is intentionally deferred.
5. Obtain approval.
6. Implement.
7. Test.
8. Report results.
9. Obtain approval before continuing.

If a significant architectural, product, security, or UX decision is not defined by the reference documents, stop and ask before proceeding.

Do not silently change the product architecture.

Do not add features because they "might be useful."

Do not replace Notion with a SaaS content-management system.

Do not introduce video storage.

Do not expose raw API terminology to customers.

Do not bypass the Field Mapping Engine by hard-coding Notion property names.

Build the MVP deliberately, one phase at a time.
