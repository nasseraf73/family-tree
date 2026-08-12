# Project Custom Rules & Persistent Memory

## Disabled & Hidden Features Log

### 1. Data Management Button (`/admin/database`)
- **Status**: HIDDEN_FOR_DEMO (Disabled / Commented out).
- **Target File**: `src/app/dashboard/page.tsx`
- **Location in Code**: Inside the `isSuperAdmin` cards grid container (`<Link href="/admin/database">`).
- **Reason**: The site is currently shared with test admin accounts for live user testing. The Data Management button (`/admin/database`) is commented out to prevent test admin users from downloading database backups or tampering with database administration tools.
- **How to Restore (إعادة التفعيل)**: When the user requests to re-enable or show "زر إدارة البيانات" (Data Management button), simply uncomment the `{/* HIDDEN_FOR_DEMO ... */}` block in `src/app/dashboard/page.tsx`.
