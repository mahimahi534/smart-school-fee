# Project Technical & Business Assumptions

This document records key technical, financial, and architectural assumptions adopted during the development of Smart School Fee.

## 1. Currency & Financial Standards
- **Primary Currency**: Ethiopian Birr (ETB).
- **Precision**: 2 decimal places (`DECIMAL(12, 2)`).
- **Rounding Rule**: Standard round-half-up applied at the line-item level.
- **Floating-point Rule**: JavaScript numbers are converted to Prisma `Prisma.Decimal` instances or fixed strings before arithmetic operations to prevent floating-point representation drift.

## 2. Multi-Branch & Tenant Isolation
- A **School** is the highest tenant boundary. Students, academic structures, fee templates, and invoices belong to a single school.
- A **Branch** represents a physical campus (e.g., Bole Campus, Kazanchis Campus).
- Branch administrators and cashiers can only view and process records within their assigned branch.
- Super Admins and School Admins can view and operate across all branches belonging to their school.

## 3. Identifiers & Numbering Formats
- **Student ID**: `<SchoolPrefix>-<SequenceNumber>` (e.g. `AF-0001` or `ABY-0001`), guaranteed unique within each school.
- **Invoice Number**: `INV-<Year>-<SequenceNumber>` (e.g. `INV-2026-0001`), unique within each school.
- **Receipt Number**: `REC-<Year>-<SequenceNumber>` (e.g. `REC-2026-0001`), unique within each school.
- Concurrency protection: Sequence allocation runs inside Prisma interactive transactions with atomic updates.

## 4. Payment Workflows & Reconciliation
- **Payment Modes**: Cash, Bank Transfer (with bank reference slip number), CBE Birr, Telebirr, Check, and Other.
- **Partial Payments**: Fully supported. A single invoice may receive multiple partial payments until `balanceAmount == 0`.
- **Payment Allocations**: When a payment is recorded against an invoice with multiple fee line items, payments are allocated to invoice line items in priority order or proportionally.
- **Reversals**: Reversing a payment recalculates the associated invoice's `paidAmount` and `balanceAmount`, moves the invoice from `PAID` back to `PARTIALLY_PAID` or `ISSUED`, and records an immutable `PaymentReversal` audit record.

## 5. Bilingual Localization (English & Amharic)
- Amharic text uses Ethiopic Unicode characters (Ge'ez script) supported natively by modern web browsers and mobile devices.
- System dates support standard Gregorian display with Amharic localized month and day labels.
- Bilingual labels are provided for all navigation, form controls, validation errors, and report headers.

## 6. Hosting & Cloud Provider Policy
- If external cloud deployment credentials (e.g., Vercel, Railway, Render token) are not provided in the local environment, the application is packaged with production-ready build artifacts, environment configuration templates, Dockerfile, and instructions for zero-friction one-click deployment.
