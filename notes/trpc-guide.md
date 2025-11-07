# TRPC Guide: Client and Server Component Fetching

This guide explains how to fetch data using TRPC in both client and server components, and when to use `useSuspenseQuery` vs `useQuery`.

## Table of Contents
1. [Server Component Fetch](#server-component-fetch)
2. [Client Component Fetch](#client-component-fetch)
3. [useSuspenseQuery vs useQuery](#usesuspensequery-vs-usequery)
4. [Complete Flow Example](#complete-flow-example)

---

## Server Component Fetch

Server components run on the server during the initial render. They can prefetch data and pass it to client components through React Query's hydration mechanism.

### Step-by-Step: Server Component Fetch

#### Step 1: Import Required Dependencies
```typescript
import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
```

**Why these imports?**
- `getQueryClient`: Gets a stable query client instance for the server request
- `trpc`: Server-side TRPC client that can directly call procedures
- `HydrationBoundary`: Wraps client components to hydrate prefetched data
- `dehydrate`: Serializes the query client state to pass to the client
- `Suspense`: Provides a fallback while client components load

#### Step 2: Create an Async Server Component
```typescript
const HomePage = async () => {
  // Server components must be async to use await
  // ...
};
```

**Why async?**
- Server components can use `await` to fetch data during SSR
- This allows data to be ready before the initial HTML is sent to the client

#### Step 3: Get the Query Client
```typescript
const queryClient = getQueryClient();
```

**Why getQueryClient?**
- Uses React's `cache()` to ensure the same query client instance is used throughout the same request
- Prevents creating multiple query clients during server-side rendering
- Ensures data consistency across the request lifecycle

#### Step 4: Prefetch the Query
```typescript
void queryClient.prefetchQuery(trpc.getUsers.queryOptions());
```

**Why prefetchQuery?**
- Fetches data on the server before sending HTML to the client
- The `void` keyword is used because we don't need to await it (React Query handles it)
- Data is stored in the query client's cache
- This eliminates the loading state on initial render for the client

**What happens?**
1. TRPC procedure `getUsers` is called on the server
2. Data is fetched from the database (via Prisma)
3. Result is stored in the query client cache
4. Cache state is ready to be serialized and sent to the client

#### Step 5: Dehydrate and Hydrate
```typescript
<HydrationBoundary state={dehydrate(queryClient)}>
  <Suspense fallback={<Spinner />}>
    <Client />
  </Suspense>
</HydrationBoundary>
```

**Why HydrationBoundary?**
- `dehydrate(queryClient)`: Serializes the query client's cache state into a plain object
- This serialized state is embedded in the HTML sent to the client
- `HydrationBoundary`: Provides this state to child client components
- Client components can access the prefetched data without making a new request

**Why Suspense?**
- Wraps client components that use `useSuspenseQuery`
- Provides a fallback UI while the component is suspended
- In this case, since data is prefetched, the Suspense boundary typically won't trigger on initial render

### Complete Server Component Example
```typescript
import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import Client from "./Client";
import { Spinner } from "@/components/ui/spinner";

const HomePage = async () => {
  // Step 1: Get query client (cached per request)
  const queryClient = getQueryClient();
  
  // Step 2: Prefetch data on the server
  void queryClient.prefetchQuery(trpc.getUsers.queryOptions());
  
  // Step 3: Dehydrate and pass to client
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Spinner />}>
        <Client />
      </Suspense>
    </HydrationBoundary>
  );
};

export default HomePage;
```

---

## Client Component Fetch

Client components run in the browser and can use React hooks to fetch data. They receive prefetched data from server components through hydration.

### Step-by-Step: Client Component Fetch

#### Step 1: Mark Component as Client Component
```typescript
"use client";

const Client = () => {
  // ...
};
```

**Why "use client"?**
- Tells Next.js this component runs in the browser
- Required to use React hooks like `useSuspenseQuery` or `useQuery`
- Enables interactivity and client-side data fetching

#### Step 2: Import TRPC Hook
```typescript
import { useTRPC } from "@/trpc/client";
```

**Why useTRPC?**
- Provides access to the TRPC client in client components
- Returns a typed TRPC client that matches your router
- Works with React Query under the hood

#### Step 3: Get TRPC Client
```typescript
const trpc = useTRPC();
```

**What is trpc?**
- A typed client that knows all your router procedures
- Provides methods like `trpc.getUsers.queryOptions()` to create query options
- These options are compatible with React Query hooks

#### Step 4: Fetch Data with useSuspenseQuery
```typescript
const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions());
```

**What happens?**
1. `trpc.getUsers.queryOptions()` creates React Query options for the `getUsers` procedure
2. `useSuspenseQuery` checks if data exists in the hydrated cache
3. If data exists (from server prefetch), it returns immediately
4. If data doesn't exist, the component suspends and shows the Suspense fallback
5. Once data is fetched, the component re-renders with the data

**Why useSuspenseQuery?**
- Automatically suspends the component while data is loading
- Works seamlessly with React Suspense boundaries
- Provides a better UX by showing fallback UI instead of loading states
- Perfect for server-prefetched data (data is usually already available)

### Complete Client Component Example
```typescript
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const Client = () => {
  // Step 1: Get TRPC client
  const trpc = useTRPC();
  
  // Step 2: Fetch data (suspends if not available)
  const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions());
  
  // Step 3: Render data
  return <div>{JSON.stringify(users)}</div>;
};

export default Client;
```

---

## useSuspenseQuery vs useQuery

### useSuspenseQuery

**When to use:**
- ✅ When data is prefetched on the server (most common case)
- ✅ When you want automatic Suspense integration
- ✅ When you don't need manual loading/error states
- ✅ For initial data fetching in components wrapped in Suspense

**Characteristics:**
- Suspends the component while data is loading
- Throws a promise that Suspense boundaries catch
- No `isLoading` or `isError` states (handled by Suspense)
- Data is guaranteed to be available after the component renders
- Perfect for server-side prefetched data

**Example:**
```typescript
const { data } = useSuspenseQuery(trpc.getUsers.queryOptions());
// data is always available here, no need to check isLoading
```

### useQuery

**When to use:**
- ✅ When you need manual control over loading/error states
- ✅ When fetching data based on user interactions (not initial render)
- ✅ When you want to show custom loading/error UI
- ✅ When data might not be available immediately and you want to handle it gracefully

**Characteristics:**
- Does NOT suspend the component
- Returns `isLoading`, `isError`, `error`, and `data` states
- Component renders immediately, even while data is loading
- You must manually handle loading and error states
- Better for conditional or user-triggered queries

**Example:**
```typescript
const { data, isLoading, isError, error } = useQuery(trpc.getUsers.queryOptions());

if (isLoading) return <Spinner />;
if (isError) return <div>Error: {error.message}</div>;
return <div>{JSON.stringify(data)}</div>;
```

### Comparison Table

| Feature | useSuspenseQuery | useQuery |
|---------|------------------|----------|
| Suspends component | ✅ Yes | ❌ No |
| Loading state | Handled by Suspense | Manual (`isLoading`) |
| Error state | Handled by ErrorBoundary | Manual (`isError`) |
| Data availability | Always available after render | May be `undefined` |
| Best for | Server-prefetched data | User-triggered queries |
| Requires Suspense | ✅ Yes | ❌ No |

---

## Complete Flow Example

Here's how the entire flow works from server to client:

### 1. Server Component (page.tsx)
```typescript
// Server-side: Prefetch data
const HomePage = async () => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.getUsers.queryOptions());
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Spinner />}>
        <Client />
      </Suspense>
    </HydrationBoundary>
  );
};
```

**What happens:**
1. Server calls `getUsers` procedure
2. Data is fetched from database
3. Data is stored in query client cache
4. Cache is dehydrated (serialized)
5. HTML is sent to client with serialized cache embedded

### 2. Client Component (Client.tsx)
```typescript
"use client";

const Client = () => {
  const trpc = useTRPC();
  const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions());
  return <div>{JSON.stringify(users)}</div>;
};
```

**What happens:**
1. Component mounts in browser
2. `useSuspenseQuery` checks hydrated cache
3. Data is found in cache (from server prefetch)
4. Component renders immediately with data
5. No network request needed! 🎉

### 3. If Data Wasn't Prefetched

If the server component didn't prefetch:
1. `useSuspenseQuery` doesn't find data in cache
2. Component suspends (throws promise)
3. Suspense boundary shows fallback (`<Spinner />`)
4. Query executes in background
5. Once data arrives, component re-renders with data

---

## Best Practices

### ✅ Do's

1. **Prefetch on server when possible**
   - Reduces client-side loading states
   - Improves initial page load performance
   - Better SEO (data in initial HTML)

2. **Use useSuspenseQuery with prefetched data**
   - Data is usually already available
   - Cleaner code (no loading checks)
   - Better UX with Suspense boundaries

3. **Wrap client components in Suspense**
   - Required for `useSuspenseQuery` to work
   - Provides fallback UI during loading
   - Handles errors gracefully

4. **Use useQuery for user-triggered actions**
   - Button clicks, form submissions
   - Conditional queries
   - When you need manual state control

### ❌ Don'ts

1. **Don't use useSuspenseQuery without Suspense boundary**
   - Will cause errors
   - Suspense is required for it to work

2. **Don't prefetch everything**
   - Only prefetch critical above-the-fold data
   - Too much prefetching can slow down initial render

3. **Don't mix useSuspenseQuery and useQuery for the same data**
   - Choose one approach and be consistent
   - Mixing can cause confusion and bugs

---

## Summary

- **Server Components**: Prefetch data using `prefetchQuery` and pass it via `HydrationBoundary`
- **Client Components**: Use `useSuspenseQuery` for prefetched data or `useQuery` for manual control
- **useSuspenseQuery**: Best for server-prefetched data, suspends component, requires Suspense boundary
- **useQuery**: Best for user-triggered queries, provides manual loading/error states, no Suspense needed

The combination of server prefetching + client hydration + `useSuspenseQuery` provides the best user experience with instant data availability and no loading spinners on initial render.

