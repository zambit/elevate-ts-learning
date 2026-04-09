# Commercial Licensing: How It Works in Practice

This document explains the real-world process of selling and managing commercial licenses for elevate-ts. From the sales pitch to renewals, here's what actually happens.

## The Sales Pitch

**When someone asks about commercial licensing:**

```
"elevate-ts is available under AGPL-3.0 (free, open source) or a 
Commercial License ($$$) if you need to use it in a closed-source project.

With the Commercial License you can:
- Use elevate-ts in proprietary/closed-source software
- Keep your modifications private
- No requirement to share improvements back

Cost: $[X] per year, includes email support"
```

---

## The Commercial Agreement Process

**Step 1: They Express Interest**

```
You: "Great! Here's the Commercial License Agreement. 
     Review it, let me know if you have questions."
```

**Step 2: They Review & Sign**

- Send them `COMMERCIAL-LICENSE.md` (or a PDF version signed by you)
- They review with their legal team if needed
- They sign (or you both sign digitally)
- They send payment

**Step 3: You Deliver What?**

This depends on your model. Here are three common approaches.

---

## Delivery Models

### Option A: "Just Use the npm Package" (Simplest)

```
They buy the license → 
You send them signed agreement + npm tag

They can now: npm install @zambit/elevate-ts@commercial

No forking needed. They use the same code as AGPL users, 
but they have a signed agreement allowing closed-source use.
```

**Pros:**
- Simplest for you
- They get updates automatically
- No maintenance of forks

**Cons:**
- No protection if they don't follow the agreement
- License is "honor system"

---

### Option B: "Private Repo with License Key" (Medium)

```
They buy the license → 
You send them:
  1. Signed commercial agreement
  2. Private GitHub repo access (OR a Git URL with embedded token)
  3. License key (that validates in their code)

They can now: 
  git clone https://github.com/zambit/elevate-ts-commercial-[theirname]
  OR
  npm install from private npm registry
```

**Pros:**
- More control (private repo = you can track who has access)
- License key proves they paid
- Can revoke access if they stop paying

**Cons:**
- You maintain multiple repos/forks
- Updates require managing multiple branches
- More operational overhead

---

### Option C: "Support Tier with Modifications" (Premium)

```
They buy license → 
They also buy support ($XXX/month) →
You create a private fork with their modifications

Structure:
  github.com/zambit/elevate-ts-[company-name] (private)
    ↓
  Contains their customizations (features they need)
  ↓
  You merge elevate-ts updates regularly
  ↓
  They pull updates and get support from you
```

**Pros:**
- Highest revenue (license + support)
- You own the relationship
- You can offer customizations

**Cons:**
- Most work for you (maintenance, support, merging)
- Complex if many customers
- Need to be careful about not mixing their code with AGPL

---

## Recommendation: Start with Option A

This is the simplest approach that requires zero maintenance overhead from you.

### Year 1: Option A
```
Commercial customer buys license for $X/year

What they get:
  1. Signed COMMERCIAL-LICENSE.md
  2. Access to npm install @zambit/elevate-ts@commercial
  3. Email support (2-3 business day response)
  4. Invoiced annually

What you do:
  - No forking
  - They use the public code
  - Agreement prevents them from redistributing
```

---

## Commercial License Agreement Template

**Send this to customers who want commercial licensing:**

```markdown
# Commercial License Agreement

**Customer:** [Company Name]
**Product:** elevate-ts
**License Fee:** $2,000/year (adjust as needed)
**Term:** 1 year, renews annually
**Support:** Email support, 48-hour response time
**Effective Date:** [Date]

## 1. Grant of License

Licensor grants Licensee a non-exclusive, non-transferable license to use elevate-ts
in proprietary/closed-source projects, subject to the terms of this Agreement.

## 2. Permitted Uses

- ✅ Use in proprietary/closed-source software
- ✅ Modify for internal use
- ✅ Run on company servers/systems
- ✅ Use in commercial products

## 3. Not Permitted

- ❌ Distribute to third parties or sublicense
- ❌ Bundle in competing products
- ❌ Redistribute the source code
- ❌ Publish as a separate product

## 4. Payment

- License Fee: $2,000 per year
- Invoice issued on: [date annually]
- Payment due: Within 30 days of invoice
- Accepted: Wire transfer, credit card, ACH

## 5. Support

- Email: support@elevate-ts.com
- Response SLA: 48 business hours
- Support scope: Usage questions, bug reports, documentation
- NOT included: Custom feature development

## 6. Termination

This license terminates immediately if:
- Payment is not made within 30 days of invoice date
- Licensee materially breaches this Agreement

Upon termination, Licensee must cease all use of elevate-ts in proprietary projects.

## 7. No Warranty

THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT.

## 8. Limitation of Liability

IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR RELATED TO THIS AGREEMENT.

## 9. Governing Law

This Agreement is governed by [Your Jurisdiction] law.

## 10. Entire Agreement

This is the complete agreement between the parties regarding the use of elevate-ts.

---

**Customer Signature:** ________________________  **Date:** __________

**Licensor Signature:** ________________________   **Date:** __________
```

---

## Practical Workflow: Customer Buys License

### Step 1: Initial Inquiry

```
Email from: customer@acme.com
Subject: Commercial licensing for elevate-ts

Body: "We want to use elevate-ts in a closed-source product.
       Can we get a commercial license?"
```

### Step 2: You Respond

```
Subject: Commercial License Available

Hi ACME Corp,

Yes! elevate-ts is available under a commercial license for $2,000/year.

With a commercial license you can:
- Use elevate-ts in closed-source/proprietary software
- Keep your modifications private
- No requirement to share improvements back

Attached: Commercial License Agreement

Please review it with your legal team, let me know if you have 
questions or need modifications.

Once approved, we'll process payment and get you set up.

Best,
[Your Name]
```

### Step 3: They Review & Sign

- They review the agreement
- Legal team reviews if it's a big company
- They sign it (digital signature is fine)
- They send it back to you

### Step 4: Payment & Setup

```
Email from: customer@acme.com
Subject: Re: Commercial License - Signed Agreement

Body: "Agreement signed and attached. 
       Wire details for payment?"

---

You: "Perfect! Here's the invoice:

Invoice #001
Date: Jan 2, 2025
Bill To: ACME Corp
Description: elevate-ts Commercial License (1 year)
Amount: $2,000
Due Date: Feb 1, 2025
Wire Details: [your bank info]

Once payment clears, I'll send you access details.

Best,
[Your Name]
"
```

### Step 5: They Pay

```
Payment received: Jan 5, 2025
```

### Step 6: You Send Access Details

```
Subject: elevate-ts Commercial License - Setup

Hi ACME Corp,

Payment received! Your commercial license is now active.

Setup Instructions:
1. Install via npm: npm install @zambit/elevate-ts@commercial
2. Support email: support@elevate-ts.com
3. Response SLA: 48 business hours
4. Annual renewal: January 2026

Questions? Email support.

You're all set! 🚀

Best,
[Your Name]
```

### Step 7: They Use It

```
ACME Corp uses elevate-ts in their proprietary product
They never share source code (agreement says they don't have to)
They can bundle it with their paid software
No obligation to contribute back
```

---

## Handling Support Requests

### Example 1: Usage Question

```
Email from: dev@acme.com
To: support@elevate-ts.com
Subject: How to use undo/redo with React?

Body: "We're trying to implement undo/redo in our React app.
       The example in the docs uses Svelte. Can you help?"

---

Your response (within 48 hours):

Subject: Re: How to use undo/redo with React?

Hi ACME Dev Team,

Great question! The State monad pattern works exactly the same in React.
Here's an example:

[code example]

See lessons/05-state-fp-examples.md for more details on the pattern.

Let me know if you have more questions!

Best,
[Your Name]
```

### Example 2: Bug Report

```
Email from: dev@acme.com
Subject: Potential bug in State monad composition

Body: "When we chain multiple State operations, 
       the history sometimes gets out of sync.
       [reproduction steps]"

---

Your response:

Subject: Re: State monad composition issue

Hi ACME Dev,

Thanks for the detailed report! I can reproduce this.
This is a bug in how we're handling the future stack.

Fix coming in v1.2.5 (ETA: 2 weeks).
In the meantime, here's a workaround: [explanation]

I'll notify you when the fix is released.

Best,
[Your Name]
```

---

## Annual Renewals

### 90 Days Before Expiry

```
Email to: customer@acme.com
Subject: elevate-ts Commercial License - Renewal Notice

Hi ACME Corp,

Your commercial license expires on April 2, 2025 (90 days).

To continue commercial use, please renew by April 1.

Renewal Cost: $2,000/year
Same terms and support level

Reply to confirm renewal, and I'll send an updated invoice.

Best,
[Your Name]
```

### 30 Days Before Expiry

```
Email to: customer@acme.com
Subject: URGENT: elevate-ts License Expires in 30 Days

Hi ACME Corp,

Reminder: Your commercial license expires on April 2, 2025.

If you need to continue commercial use of elevate-ts, 
please renew now.

Renewal invoice will be sent upon confirmation.

Best,
[Your Name]
```

### License Expired

```
Email to: customer@acme.com
Subject: elevate-ts Commercial License - EXPIRED

Hi ACME Corp,

Your commercial license expired on April 2, 2025.

You must renew your commercial license to continue 
proprietary use of elevate-ts.

Contact us to renew or with questions.

Best,
[Your Name]
```

---

## When Do You Actually Fork?

### Don't fork unless they ask for customizations

**Fork if:**
- They want features specific to their use case
- They need modifications you don't want in the public AGPL version
- You're offering a "support + customization" tier

### Example Scenario: Custom Fork

```
Customer: "We need elevate-ts to work with our async Redux store.
           Can you add that?"

You: "Sure, that's a custom modification. That's $5,000/year 
     (base license) + $2,000/year (custom support and modifications).
     
     We'll maintain a private fork for you with your customizations,
     and merge in updates from the main elevate-ts branch monthly."

Customer: "Sounds good!"

---

Then you create:
  github.com/zambit/elevate-ts-acme-corp (private)
  
You regularly merge main branch updates into their fork,
ensuring their customizations still work.
```

---

## Simple Spreadsheet to Track Customers

Keep a simple spreadsheet of commercial customers:

| Customer | License Start | License End | Status | Paid | Support |
|----------|---|---|---|---|---|
| ACME Corp | Jan 2, 2025 | Jan 1, 2026 | Active | Yes | Email |
| TechCorp | Mar 15, 2025 | Mar 14, 2026 | Active | Yes | Email |
| StartupXYZ | Feb 1, 2025 | Jan 31, 2026 | Active | No (pending) | Pending |
| OldCorp | Apr 1, 2024 | Mar 31, 2025 | Expired | Yes | None |

---

## Tax & Legal Considerations

**You need:**
- A business entity (LLC, S-Corp, sole proprietor, etc.)
- To invoice customers (professional paper trail)
- To keep signed agreements (legal protection)
- To report income (tax time)

**Simple invoicing template:**

```
Invoice #001
Date: Jan 2, 2025
Bill To: ACME Corp, Inc.
Invoice For: elevate-ts Commercial License (1 year)
Amount: $2,000.00
Due Date: Feb 1, 2025

Wire Transfer Details:
[Your bank name, account number, routing number]

Payment Terms:
Net 30 days
```

---

## Support email Setup

**Create a support email address:**
- `support@elevate-ts.com` (or use your domain)
- Can forward to your personal email initially
- Set up a filter/label to organize support requests
- Respond within 48 hours (your SLA)

**Simple support guidelines:**
- **In scope:** Usage questions, bugs, documentation
- **Out of scope:** Custom feature development, system design consulting
- **Out of scope escalation:** "That's beyond free support, but we can discuss a custom engagement"

---

## Full Workflow Summary

```
1. Customer emails interest
   ↓
2. You send: Agreement template + pricing
   ↓
3. They review & sign (maybe with legal team)
   ↓
4. You send: Invoice
   ↓
5. They pay (wire, check, or card)
   ↓
6. You send: Setup details + support email
   ↓
7. They install: npm install @elevate-ts@commercial
   ↓
8. They use it in their proprietary product
   ↓
9. They email support with questions
   ↓
10. You respond within 48 hours
   ↓
11. License runs for 1 year
   ↓
12. 90 days before expiry: Renewal notice
   ↓
13. They renew or license expires
   ↓
14. Repeat
```

---

## Revenue Model Example

**Year 1:**
- 3 customers × $2,000/year = $6,000
- Support time: ~3-4 hours/month = ~36-48 hours/year
- Hourly rate: ~$125-166/hour

**Year 2:**
- 8 customers × $2,000/year = $16,000
- Support time: ~5-6 hours/month (scales slowly)
- Hourly rate: ~$270-320/hour

**Year 3 (with custom forks):**
- 5 standard licenses: 5 × $2,000 = $10,000
- 2 custom packages: 2 × ($5,000 + $2,000) = $14,000
- Total: $24,000
- Support + custom work: ~15 hours/month
- Profit per hour: ~$133/hour

---

## Bottom Line

**Start simple (Option A - no forks):**

```
Their workflow:
  npm install @elevate-ts@commercial
  Email support@elevate-ts.com if they have questions
  Renew license annually

Your workflow:
  1. Get email "we want commercial"
  2. Send agreement template ($X/year)
  3. They sign and pay
  4. You mark them in a spreadsheet as "licensed"
  5. Every year, send renewal invoice
  6. Answer their support emails (2-4 hours/month)
  7. Profit!
```

Once you have 3-5 commercial customers and they ask for customizations, *then* you create private forks. Until then, keep it simple and focus on building the product.

---

## Next Steps

1. Create a `COMMERCIAL-LICENSE.md` in the elevate-ts repo with your terms
2. Set up a support email address
3. Create a simple spreadsheet to track customers
4. Add licensing info to your README.md
5. When someone inquires, send them this agreement and wait for payment
6. After payment, send them setup details
7. Answer their support emails
8. Invoice annually for renewal
