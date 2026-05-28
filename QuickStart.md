# ⚡ VOTEX Quick Start (5 minutes)

## 1. Install Dependencies
```bash
cd votex
npm install zustand @tanstack/react-query @tanstack/react-query-devtools recharts framer-motion react-hook-form zod @hookform/resolvers clsx date-fns react-hot-toast
```

## 2. Copy All Files
Download the complete project from the outputs folder and copy:
- `stores/` → your `stores/`
- `lib/` → your `lib/`
- `providers/` → your `providers/`
- `types/` → your `types/`
- `app/(auth)/` → your `app/(auth)/`
- `app/(dashboard)/` → your `app/(dashboard)/`
- `components/dashboard/` → your `components/dashboard/`
- Update `app/layout.tsx`

## 3. Run Development Server
```bash
npm run dev
```

## 4. Test
- **Landing:** http://localhost:3000
- **Login:** http://localhost:3000/login
- **Admin Dashboard:** http://localhost:3000/admin
  - Demo: admin@votex.io / Demo@1234

## 5. Next Steps
1. Implement backend API (Node.js/Python/Go)
2. Replace API mock calls in `lib/api.ts`
3. Add authentication middleware
4. Deploy to Vercel/Docker

---

## 📁 File Checklist

- [ ] `package.json` - Updated with new packages
- [ ] `types/index.ts` - TypeScript types
- [ ] `stores/authStore.ts` - Auth state
- [ ] `stores/electionStore.ts` - Election state
- [ ] `stores/uiStore.ts` - UI state
- [ ] `lib/api.ts` - API functions
- [ ] `lib/queryClient.ts` - TanStack Query setup
- [ ] `providers/QueryProvider.tsx` - Query provider
- [ ] `app/layout.tsx` - Root layout (UPDATED)
- [ ] `app/(auth)/login/page.tsx` - Login page
- [ ] `app/(auth)/register/page.tsx` - Register page
- [ ] `components/dashboard/Sidebar.tsx` - Sidebar nav
- [ ] `components/dashboard/DashboardHeader.tsx` - Header
- [ ] `components/dashboard/StatsCard.tsx` - Stats card
- [ ] `components/dashboard/charts/Charts.tsx` - Charts
- [ ] `app/(dashboard)/layout.tsx` - Dashboard layout
- [ ] `app/(dashboard)/admin/page.tsx` - Admin dashboard

---

## 🎯 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@votex.io | Demo@1234 |
| Voter | voter@votex.io | Demo@1234 |
| Candidate | candidate@votex.io | Demo@1234 |
| Party Admin | party@votex.io | Demo@1234 |

---

## 🔗 Key Integration Points

### Auth Store
```typescript
import { useAuthStore } from '@/stores/authStore'
const user = useAuthStore(s => s.user)
const logout = useAuthStore(s => s.logout)
```

### Fetch Data
```typescript
import { useQuery } from '@tanstack/react-query'
import { electionApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'

const { data } = useQuery({
  queryKey: queryKeys.elections(),
  queryFn: () => electionApi.list()
})
```

### Notifications
```typescript
import toast from 'react-hot-toast'
toast.success('Election created!')
toast.error('Something went wrong')
```

---

## ✅ Verification Commands

```bash
# Check types compile
npx tsc --noEmit

# Check build works
npm run build

# Lint check
npm run lint

# Start production
npm start
```

That's it! You now have a full-featured cyberpunk election platform ready for development. 🚀


Files to create:

prisma/schema.prisma - Full database schema

Frontend Pages:
25. app/(dashboard)/admin/elections/[id]/configure/page.tsx
29. app/(dashboard)/admin/settings/page.tsx
30. app/(dashboard)/candidate/page.tsx
31. app/(dashboard)/candidate/profile/page.tsx
32. app/(dashboard)/candidate/assets/page.tsx
33. app/(dashboard)/candidate/manifesto/page.tsx
34. app/(dashboard)/candidate/standings/page.tsx
35. …