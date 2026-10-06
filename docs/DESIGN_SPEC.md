# Notion → YouTube SaaS — Design Specification
## Version 0.5

---

# 1. Product Purpose

The SaaS is a **configurable automation layer** connecting:

**Customer's Notion workflow → Customer's video file → Customer's YouTube channel**

The customer continues using their existing Notion database as their primary video/content workflow.

The SaaS does **not** replace Notion with a separate content-management dashboard.

### Core principle

> **The SaaS adapts to the customer's existing workflow rather than requiring the customer to adapt their workflow to the SaaS.**

The system must therefore be configuration-driven rather than hard-coded around specific Notion property names, status names, or database structures.

---

# 2. Core Architecture

## Customer-facing components

- Account
- Authentication
- Onboarding/setup
- Notion connection
- YouTube connection
- Google Drive connection
- Field Mapping
- Automation controls
- Dashboard
- Upload history
- Error/failure management
- Republish/retry controls
- Billing/subscription

## Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Edge Functions
- Row Level Security
- Notion integration
- YouTube integration
- Google Drive integration
- Field Mapping Engine
- Notion Event Detection
- Upload Job Engine
- Error Handling Engine
- Subscription/Usage Engine

## External services

- Notion
- YouTube / Google
- Google Drive
- Stripe

---

# 3. Notion Event Detection

The preferred approach is **Notion events/webhooks**, rather than continuously polling Notion.

The system must detect:

## New records

If a new Notion page is created and already meets the configured trigger condition, it should be eligible for processing.

Example:

> New page created → Status = Ready to Upload

The system does **not** require the status to transition from another value.

## Existing records

If an existing record changes into the configured trigger state after automation is activated, it becomes eligible.

Example:

> Status = Draft → Status = Ready to Upload

## Activation protection

Records that already existed in the trigger state **before automation was activated must not automatically upload.**

Example:

Before activation:

| Video | Status |
|---|---|
| Video A | Published |
| Video B | Ready to Upload |
| Video C | Draft |
| Video D | Ready to Upload |

After activation:

- B → **Do not upload**
- D → **Do not upload**
- New Video E → Ready to Upload → **Upload**
- A later changes to Ready to Upload → **Upload**

This prevents activating the SaaS and accidentally triggering a large batch of existing records.

Duplicate-event protection is also required.

---

# 4. Google Drive / Video Retrieval

## MVP

Google Drive is the **only supported video source**.

The SaaS does not store customer videos.

The video remains in the customer's Google Drive.

The customer maps a Notion property containing the **Google Drive URL** to the SaaS's video/file input.

Example:

> Notion property: `Video File`  
> Field type: URL  
> Value: Google Drive URL

## Local computer files

Not supported in MVP.

Potentially supported in a future version.

## Invalid or inaccessible file

If the mapped video field is:

- blank
- not a valid Google Drive URL
- deleted
- inaccessible
- permission-restricted
- otherwise unreachable

the SaaS must:

1. Stop the upload.
2. Record the technical error in Supabase.
3. Write the configured error code to Notion.
4. Write the configured error message to Notion.
5. Set the configured failure status.
6. Display the error in the SaaS dashboard.

The user must correct the problem before the video can proceed.

---

# 5. Field Mapping Engine

The Field Mapping Engine is one of the **core subsystems of the product**.

The system must never assume that every customer uses:

- `Status`
- `Video File`
- `Publish Date`
- `YouTube URL`
- etc.

Instead, the customer tells the SaaS which fields correspond to each required function.

## Mapping categories

### Trigger fields

Used to determine when automation should run.

Example:

> Trigger property: Status  
> Field type: Status  
> Trigger value: Ready to Upload

### Video/file field

Example:

> Video File  
> Field type: URL  
> Source: Google Drive

### YouTube input fields

Customer maps Notion properties to YouTube metadata.

### YouTube output fields

Customer maps Notion properties where the SaaS should write:

- YouTube Video ID
- YouTube Video URL
- YouTube Studio Edit URL
- Error Code
- Error Message
- Workflow/status information

### Workflow/status fields

Customer defines which Notion property and options represent the SaaS workflow.

---

# 6. Notion Property Types

The SaaS should explicitly identify the **Notion field type** required for each mapping.

Example:

| SaaS Requirement | Required Notion Type |
|---|---|
| Trigger status | Status / Select |
| Video file URL | URL |
| YouTube title | Title / Text |
| YouTube description | Text |
| YouTube tags | Text |
| Publish date/time | Date |
| YouTube Video ID | Text |
| YouTube Video URL | URL |
| YouTube Studio Edit URL | URL |
| Error Code | Text |
| Error Message | Text |

The final implementation will define the complete compatibility matrix, including which Notion property types can satisfy each SaaS mapping.

---

# 7. Status Mapping

Status mapping must be highly flexible.

The customer selects an existing Notion status property and maps its options to SaaS workflow stages.

## Important capability

**A single Notion status option may be mapped to multiple SaaS workflow stages.**

For example:

**Notion property:** Status  
**Field type:** Status

Notion option:

> Published

can represent both:

- Uploaded → Published
- Scheduled → Published

The mapping system must therefore **not assume that one Notion status option represents only one internal SaaS stage.**

## Missing status options

If a required status option does not exist:

1. SaaS identifies the missing option.
2. SaaS prompts the customer.
3. Customer can approve adding it through the SaaS, where technically supported, or manually add it in Notion.
4. Setup cannot be considered complete until the mapping is valid.

The SaaS must **never silently create workflow fields or status options.**

---

# 8. Upload Process

The general process is:

### Step 1 — Detect event

Notion event is received.

### Step 2 — Evaluate trigger

The record is checked against the customer's configured trigger.

### Step 3 — Validate

The system verifies:

- Required Notion fields
- Field mappings
- Required values
- Google Drive URL
- Google Drive accessibility
- YouTube connection
- YouTube permissions
- Required YouTube information
- Publication/scheduling information
- Usage limit
- Subscription status
- Automation status

### Step 4 — Retrieve video

Retrieve the video from Google Drive.

### Step 5 — Upload to YouTube

Send the video and configured metadata to YouTube.

### Step 6 — Apply YouTube configuration

Apply the customer's mapped YouTube settings supported by the applicable YouTube API operation.

### Step 7 — Update Notion

Write the configured outputs back to the Notion record.

At minimum:

- Workflow/status
- YouTube Video ID
- YouTube Video URL
- YouTube Studio Edit URL
- Error Code
- Error Message

### Step 8 — Failure

If processing fails:

- Store technical error in Supabase.
- Set configured failure status in Notion.
- Write error code to Notion.
- Write error message to Notion.
- Display failure in dashboard.

There will be **no automated Notion notifications in MVP.**

---

# 9. YouTube Field Mapping

## 9.1 Human-friendly naming — REQUIRED

This is a fundamental UX rule.

> **Customers should never be presented with raw YouTube API field names.**

The underlying implementation can use official API names such as:

`snippet.title`

or

`status.selfDeclaredMadeForKids`

but the customer-facing interface should always use clear, human-friendly terminology.

Example:

| Customer sees | API implementation |
|---|---|
| Video Title | `snippet.title` |
| Description | `snippet.description` |
| Tags | `snippet.tags[]` |
| Category | `snippet.categoryId` |
| Default Language | `snippet.defaultLanguage` |
| Video Language / Localization | `localizations` |
| Embedding Allowed | `status.embeddable` |
| License | `status.license` |
| Visibility | `status.privacyStatus` |
| Public Statistics | `status.publicStatsViewable` |
| Publish Date & Time | `status.publishAt` |
| Made for Kids | `status.selfDeclaredMadeForKids` |
| Contains Synthetic Media | `status.containsSyntheticMedia` |
| Recording Date | `recordingDetails.recordingDate` |

The API terminology remains an **internal implementation detail**.

---

# 10. YouTube Insert Fields

The MVP should support the applicable writable fields associated with the YouTube video upload/insert operation.

## Video information

- Video Title
- Description
- Tags
- Category
- Default Language
- Localized Title
- Localized Description

## Visibility and publishing

- Visibility
- Publish Date & Time
- Embedding Allowed
- Public Statistics

## Compliance / classification

- Made for Kids
- Contains Synthetic Media
- License

## Recording information

- Recording Date

## Upload behavior

The applicable upload operation may also support configuration such as:

- Notify Subscribers

Content-partner-specific parameters such as `onBehalfOfContentOwner` are not expected to be part of the normal customer-facing MVP.

---

# 11. YouTube API Field Architecture

The system should distinguish between three categories:

## A. Customer-configurable inputs

Values the customer can map from Notion and send to YouTube.

Example:

> Notion `Video Title` → YouTube **Video Title**

## B. System-generated outputs

Values returned or derived from YouTube.

Examples:

- YouTube Video ID
- YouTube Video URL
- YouTube Studio Edit URL

These should not be treated as ordinary customer-entered YouTube metadata.

## C. Read-only / system information

YouTube exposes many additional properties that are not intended to be written during the upload.

These should not appear as configurable upload fields.

This distinction prevents the mapping interface from becoming confusing or exposing API implementation details that customers don't need.

---

# 12. YouTube Processing

Uploading the video to YouTube and YouTube finishing its processing are potentially **two separate events**.

Therefore, the system should distinguish between:

**Upload accepted by YouTube**

and

**YouTube processing completed**

This will be finalized during implementation.

The system may need to use YouTube's processing status information before determining that the entire upload workflow has successfully completed.

This is an important implementation consideration because the file can be successfully transferred to YouTube while YouTube is still processing it.

---

# 13. Scheduling

Publication timing is configurable.

The customer may use:

## One combined field

Example:

> Publish Date & Time

or:

## Multiple fields

Example:

> Publish Now = Yes/No  
> Schedule Date = Date/Time

The mapping engine must support both configurations.

## Time zone

Timezone is an account-level configuration and must be respected when interpreting scheduled publication dates.

## Blank publication date

If the configured publication/scheduling information is blank:

**DO NOT upload.**

Instead:

1. Display an error.
2. Record the error in Supabase.
3. Write configured error code to Notion.
4. Write configured error message to Notion.
5. Show the failure in the dashboard.
6. Require the user to correct the date/time information.

The SaaS must **not guess**, default to immediate publishing, or silently substitute a date.

---

# 14. Republish

MVP republishing is initiated through a **Republish button in the SaaS dashboard**.

Republish is different from Retry.

## Retry

Attempts to complete an existing failed upload job.

## Republish

Creates a **new upload job** and intentionally creates another YouTube upload.

The system must retrieve the **current Notion record and current mapped video URL** when republishing.

It must not rely on the original file URL stored in the historical job.

## Future

Notion-triggered republishing may be supported later through the Field Mapping Engine.

---

# 15. Upload Jobs

Every upload attempt receives its own job.

Example:

**Notion record**

→ Job 1: Failed  
→ Job 2: Successful → YouTube Video A  
→ Job 3: Republished → YouTube Video B

This provides an audit trail and allows legitimate multiple uploads of the same Notion record.

---

# 16. Error Handling

Supabase stores technical details including:

- Error type
- Error code
- Technical message
- Timestamp
- Upload job
- Notion record
- YouTube operation
- Relevant external-service response information

Notion receives:

- Configured failure status
- Error Code
- Error Message

The dashboard displays the customer-friendly failure information.

## Error philosophy

The system should distinguish between:

- Customer/configuration errors
- Authentication errors
- Permission errors
- Notion errors
- Google Drive errors
- YouTube errors
- Network/system errors
- Temporary service errors
- Usage/subscription errors

This classification will form the basis of the retry strategy.

---

# 17. Retry Strategy

**Open implementation decision.**

The system should first identify the actual error classes encountered across:

- Notion
- Google Drive
- YouTube
- Google OAuth
- Stripe
- Network/API requests
- Internal processing

Then determine which errors are:

- Automatically retryable
- Manually retryable
- Non-retryable

The system should not simply retry every failure.

---

# 18. Subscription & Account Lifecycle

## Pricing

**$12/month**

## Usage

**100 videos/month**

If the customer reaches 100 processed videos:

> Additional videos cannot be processed until the next billing cycle or a future higher-tier plan is selected.

## Automation status

Separate from subscription status:

- Enabled
- Inactive

## Cancellation

By default:

> Subscription remains active until the end of the paid billing period.

Automation can continue during the paid period unless the customer explicitly stops it.

## Immediate deactivation

The customer can turn automation off immediately.

The UI should clearly explain:

> Your subscription remains active until the end of the billing period, but automation will stop now.

## Payment failure

There is no grace period.

Automation cannot be re-enabled until payment is successfully processed.

## Expired subscription

Account configuration remains stored.

Automation cannot run.

If the customer attempts to enable automation:

> Resubscription is required.

Connections and mappings remain available so the customer does not need to rebuild their setup.

---

# 19. Critical Activation Protection

This is a core safety requirement.

The system must maintain an activation timestamp/state that allows it to distinguish:

**Existing records already matching the trigger**

from

**Records that newly enter the trigger after activation.**

This prevents accidental bulk uploads when a customer first enables automation.

---

# 20. Onboarding

Customers can skip individual setup steps, but automation cannot become active until setup is complete.

Setup validation includes:

- Notion connection
- YouTube connection
- Google Drive connection
- Required Notion properties
- Property types
- Status options
- Field mappings
- Output fields
- Permissions
- Trigger configuration
- Publication/scheduling configuration

## Missing fields

If a required field is missing:

1. Identify the missing field.
2. Show its required field type.
3. Ask the customer to create it.
4. Allow the customer to return to setup.
5. Revalidate.

The SaaS must **not silently create fields.**

Example:

> **Missing field:** YouTube Video URL  
> **Required Notion field type:** URL

## Missing status option

Example:

> **Notion Property:** Status  
> **Field Type:** Status  
> **Required Option:** Upload Failed

The customer must approve adding it or manually add it before setup can be completed.

---

# 21. YouTube Channels & Future Team Accounts

## MVP

One YouTube channel per SaaS account.

## Future

- Multiple YouTube channels
- Team accounts
- Multiple users
- User permissions
- Shared workspaces

The architecture should allow these later without requiring a fundamental redesign.

---

# 22. Dashboard

The SaaS dashboard is **not a replacement for Notion.**

Notion remains the customer's content/video logging system.

The dashboard is primarily an **automation control and monitoring interface**.

It should provide:

## Overview

- Automation status
- Connection health
- Recent uploads
- Failed uploads
- Scheduled uploads
- Usage this billing period

## Configuration

- Notion connection
- YouTube connection
- Google Drive connection
- Field mappings
- Trigger configuration
- Workflow/status mappings
- Scheduling configuration

## Operations

- Retry
- Republish
- View upload job
- View errors

## Account

- Subscription
- Usage
- Billing
- Automation enabled/inactive

Exact dashboard UI remains a later design decision.

---

# 23. Admin / Customer Service System

Deferred to a later development phase.

Future internal admin portal may allow authorized staff to:

- Search customers
- View account information
- View subscription status
- View connections
- View mappings
- View upload jobs
- View errors
- Assist with configuration problems

Admin permissions must remain separate from customer permissions.

---

# 24. Future Data Sources

The Field Mapping Engine should eventually support additional structured sources such as:

- Google Sheets
- Other spreadsheets
- Other structured databases

The underlying automation engine should remain largely the same:

**Data Source → Mapping → Video Source → YouTube → Output**

This is why the mapping system must not be tightly coupled to Notion-specific assumptions.

---

# 25. Security

The system must include:

- Customer data isolation
- Supabase Row Level Security
- Server-side OAuth credential handling
- Protected API secrets
- Authentication validation
- Incoming request validation
- Secure Notion event/webhook handling
- Stripe webhook validation
- Least-privilege API scopes
- Protection against customers accessing another customer's data
- Backend validation of customer/account ownership
- Appropriate operational logging

The backend must never blindly trust customer/account IDs supplied by the frontend.

---

# 26. MVP Non-Goals

The first version will **not** include:

- Local computer video access
- Video hosting
- Video editing
- Video transcoding
- AI title generation
- AI description generation
- Thumbnail generation
- Social media publishing
- Advanced YouTube analytics
- Team accounts
- Multiple YouTube channels
- Multiple subscription tiers
- Notion-triggered republishing
- Automated Notion notifications
- Admin/customer-service portal
- Spreadsheet/Google Sheets input
- Zapier integration

---

# 27. Backend Mission

> **The backend is a secure, configurable orchestration layer that allows each customer to connect their own Notion workflow, video source, and YouTube account without requiring them to restructure their existing system.**

The architecture should prioritize:

**Simple → Configurable → Reliable → Secure → Extensible**

rather than building unnecessary infrastructure into the MVP.

---

# 28. Current Open Decisions

## 1. Retry rules
**Open**

We need to classify real error types before deciding what should automatically retry.

## 2. Exact Notion property compatibility
**Open**

We need the final mapping matrix defining which Notion field types can satisfy each SaaS requirement.

## 3. YouTube field mapping
**Substantially defined**

The MVP will support the applicable writable YouTube video fields, with:

- human-friendly customer-facing names
- API names hidden internally
- clear distinction between inputs, outputs, and read-only properties

## 4. Usage cap
**Decided**

100 videos/month at $12/month.

## 5. Invalid Google Drive URL/file
**Decided**

Error → no upload → error recorded → Notion updated → dashboard displays problem.

## 6. Blank publication date
**Decided**

Error → no upload → user must correct the date/time.

## 7. YouTube processing completion
**Open**

Need to determine exactly when the SaaS considers an upload fully successful versus merely accepted by YouTube.

## 8. Exact dashboard design
**Open**

## 9. Exact onboarding UX
**Open**

---

# 29. Current MVP Architecture

```text
                    CUSTOMER
                       │
                       ▼
                 ┌───────────┐
                 │   Notion  │
                 │  Database │
                 └─────┬─────┘
                       │
                  Notion Event
                       │
                       ▼
              ┌──────────────────┐
              │      SUPABASE    │
              │                  │
              │ Event Detection  │
              │ Field Mapping    │
              │ Validation       │
              │ Upload Jobs      │
              │ Error Handling   │
              │ Usage/Billing    │
              └───────┬──────────┘
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
      ┌─────────────┐   ┌─────────────┐
      │ Google Drive│   │   YouTube   │
      │             │   │     API     │
      │ Video File  │──▶│ Video Upload│
      └─────────────┘   └──────┬──────┘
                               │
                               ▼
                         YouTube Video
                               │
                               ▼
                    ┌──────────────────┐
                    │     SUPABASE     │
                    │ Upload Result    │
                    │ Video ID         │
                    │ Errors           │
                    │ Job History      │
                    └────────┬─────────┘
                             │
                             ▼
                         ┌─────────┐
                         │ Notion  │
                         │ Outputs │
                         └─────────┘
```

## Important architectural distinction

Notion is still the customer's **workflow/logging system**.

The SaaS is the **automation engine sitting between Notion, Google Drive, and YouTube**.

The SaaS does not host or manage the customer's video files.
