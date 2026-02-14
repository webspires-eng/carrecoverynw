# Task: Separate Home Page Services Component

The user reported that the Home Page still displays "& Outskirts" and requested a separate component for the Home Page to avoid conflicts with the Area pages.

## Context
- **Current Issue:** The Home Page text says "West Midlands & Outskirts" or "United Kingdom & Outskirts" (likely due to database content containing placeholders that include "& outskirts").
- **Goal:** ensuring the Home Page says "United Kingdom" without "& Outskirts", while preserving the behavior for Area pages.
- **Constraint:** Create a separate component for the Home Page (`HomeServicesSection`) instead of modifying the shared `ServicesSection`.

## Plan

### 1. Create `HomeServicesSection.jsx`
- Duplicate `src/components/ServicesSection.jsx`.
- Rename to `HomeServicesSection`.
- Modify the text processing logic:
    - If strictly using `defaultServices`:
        - Hardcode "United Kingdom" context.
        - Remove "& outskirts" from the description.
    - If using `dynamicServices` (from DB):
        - Implement robust string replacement to strip "& outskirts" if present.
        - Replace `{{location}}` with "United Kingdom".
        - Replace `{{location}} & outskirts` with "United Kingdom".

### 2. Update `src/app/page.jsx`
- Import `HomeServicesSection`.
- Replace `<ServicesSection ... />` with `<HomeServicesSection ... />`.
- Ensure `location="United Kingdom"` is passed (already done, but verify).

### 3. Revert/Cleanup `ServicesSection.jsx`
- Revert the conditional ternary operator added in the previous step (`location === "United Kingdom" ? ...`) to restore original clean code for Area pages.

### 4. Verification
- Verify that `ServicesSection` remains used in `src/app/area/[slug]/page.jsx`.
- Verify Key differences in `HomeServicesSection`.

## Nuance checklist
- **Database Content:** The DB services likely contain the string `{{location}} & outskirts`. The new component must handle removing this suffix specifically.
- **Major Roads:** Ensure major roads are still handled if needed, or default to UK motorways.

## Future Considerations
- If other sections show "& outskirts", applying a similar pattern might be needed, but `ServicesSection` is the primary place this text appears.
