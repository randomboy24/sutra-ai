frontend/lib/api.ts
@@ -0,0 +1,51 @@
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
@cubic-dev-ai
cubic-dev-ai Bot
2 minutes ago
Contributor
P1: Backend base URL env var name is incorrect; production config using NEXT_PUBLIC_API_BASE_URL will be ignored.

Prompt for AI agents
Check if this issue is valid — if so, understand the root cause and fix it. At frontend/lib/api.ts, line 1:

<comment>Backend base URL env var name is incorrect; production config using `NEXT_PUBLIC_API_BASE_URL` will be ignored.</comment>

<file context>
@@ -0,0 +1,51 @@
+const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
+
+export interface HealthData {
</file context>
@codeW-Krish	Reply...
backend/app/routes/health.py
router = APIRouter(prefix="/api/health", tags=["health"])


@router.post("/seed/{clerk_user_id}", response_model=SeedHealthResponse)
@cubic-dev-ai
cubic-dev-ai Bot
2 minutes ago
Contributor
P1: Missing authorization check on user-scoped health endpoints. This enables IDOR access/update via another user's clerk_user_id.

Prompt for AI agents
Check if this issue is valid — if so, understand the root cause and fix it. At backend/app/routes/health.py, line 16:

<comment>Missing authorization check on user-scoped health endpoints. This enables IDOR access/update via another user's `clerk_user_id`.</comment>

<file context>
@@ -0,0 +1,111 @@
+router = APIRouter(prefix="/api/health", tags=["health"])
+
+
+@router.post("/seed/{clerk_user_id}", response_model=SeedHealthResponse)
+def seed_health_data(clerk_user_id: str, body: SeedHealthRequest):
+    db = SessionLocal()
</file context>
@codeW-Krish	Reply...
frontend/components/dashboard/academic-health-panel.tsx
      await seedHealthForUser(clerkUserId);
      setSeeded(true);
      refetch();
    } catch {
@cubic-dev-ai
cubic-dev-ai Bot
2 minutes ago
Contributor
P2: Seed failures are silently ignored because the catch block does nothing. This leaves users without feedback and skips the intended refresh/error surfacing path.

Prompt for AI agents
Check if this issue is valid — if so, understand the root cause and fix it. At frontend/components/dashboard/academic-health-panel.tsx, line 89:

<comment>Seed failures are silently ignored because the catch block does nothing. This leaves users without feedback and skips the intended refresh/error surfacing path.</comment>

<file context>
@@ -0,0 +1,205 @@
+      await seedHealthForUser(clerkUserId);
+      setSeeded(true);
+      refetch();
+    } catch {
+      // error handled silently — refetch will surface it
+    } finally {
</file context>
@codeW-Krish	Reply...
frontend/lib/api.ts
  const res = await fetch(`${API_BASE}/api/health/${encodeURIComponent(clerkUserId)}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to fetch health data" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
@cubic-dev-ai
cubic-dev-ai Bot
2 minutes ago
Contributor
P2: Error handling does not return the required structured error shape, making status-aware UI handling inconsistent.

Prompt for AI agents
Check if this issue is valid — if so, understand the root cause and fix it. At frontend/lib/api.ts, line 32:

<comment>Error handling does not return the required structured error shape, making status-aware UI handling inconsistent.</comment>

<file context>
@@ -0,0 +1,51 @@
+  const res = await fetch(`${API_BASE}/api/health/${encodeURIComponent(clerkUserId)}`);
+  if (!res.ok) {
+    const error = await res.json().catch(() => ({ detail: "Failed to fetch health data" }));
+    throw new Error(error.detail || `HTTP ${res.status}`);
+  }
+  return res.json();
</file context>
@codeW-Krish	Reply...
frontend/lib/api.ts
}

export async function fetchHealthData(clerkUserId: string): Promise<HealthData> {
  const res = await fetch(`${API_BASE}/api/health/${encodeURIComponent(clerkUserId)}`);
@cubic-dev-ai
cubic-dev-ai Bot
2 minutes ago
Contributor
P2: API calls omit timeout/abort support, so stalled requests can hang indefinitely.

Prompt for AI agents
Check if this issue is valid — if so, understand the root cause and fix it. At frontend/lib/api.ts, line 29:

<comment>API calls omit timeout/abort support, so stalled requests can hang indefinitely.</comment>

<file context>
@@ -0,0 +1,51 @@
+}
+
+export async function fetchHealthData(clerkUserId: string): Promise<HealthData> {
+  const res = await fetch(`${API_BASE}/api/health/${encodeURIComponent(clerkUserId)}`);
+  if (!res.ok) {
+    const error = await res.json().catch(() => ({ detail: "Failed to fetch health data" }));
</file context>
@codeW-Krish	Reply...
frontend/hooks/use-academic-health.ts
    setError(null);
    try {
      const result = await fetchHealthData(clerkUserId);
      setData(result);
@cubic-dev-ai
cubic-dev-ai Bot
2 minutes ago
Contributor
P2: Hook has a request-race bug: older in-flight fetches can overwrite newer state. Add abort/version guarding so only the latest request updates state.

Prompt for AI agents
Check if this issue is valid — if so, understand the root cause and fix it. At frontend/hooks/use-academic-health.ts, line 17:

<comment>Hook has a request-race bug: older in-flight fetches can overwrite newer state. Add abort/version guarding so only the latest request updates state.</comment>

<file context>
@@ -0,0 +1,38 @@
+    setError(null);
+    try {
+      const result = await fetchHealthData(clerkUserId);
+      setData(result);
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Failed to load health data");
</file context>
@codeW-Krish	Reply...
frontend/hooks/use-academic-health.ts
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!clerkUserId) return;
@cubic-dev-ai
cubic-dev-ai Bot
2 minutes ago
Contributor
P2: Missing user-id branch keeps stale health state instead of resetting it. Clear local state when clerkUserId is absent to avoid showing previous session data.

Prompt for AI agents
Check if this issue is valid — if so, understand the root cause and fix it. At frontend/hooks/use-academic-health.ts, line 12:

<comment>Missing user-id branch keeps stale health state instead of resetting it. Clear local state when `clerkUserId` is absent to avoid showing previous session data.</comment>

<file context>
@@ -0,0 +1,38 @@
+  const [error, setError] = useState<string | null>(null);
+
+  const fetchData = useCallback(async () => {
+    if (!clerkUserId) return;
+    setLoading(true);
+    setError(null);
</file context>
@codeW-Krish	Reply...
backend/app/routes/health.py
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch health data: {str(e)}",
@cubic-dev-ai
cubic-dev-ai Bot
2 minutes ago
Contributor
P2: Raw exception details are exposed to clients in 500 responses. Return a generic error string and log internal exceptions server-side.

Prompt for AI agents
Check if this issue is valid — if so, understand the root cause and fix it. At backend/app/routes/health.py, line 108:

<comment>Raw exception details are exposed to clients in 500 responses. Return a generic error string and log internal exceptions server-side.</comment>

<file context>
@@ -0,0 +1,111 @@
+        db.rollback()
+        raise HTTPException(
+            status_code=500,
+            detail=f"Failed to fetch health data: {str(e)}",
+        )
+    finally:
</file context>
@codeW-Krish	Reply...
backend/app/routes/health.py
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to seed health data: {str(e)}",
@cubic-dev-ai
cubic-dev-ai Bot
2 minutes ago
Contributor
P2: Raw exception details are exposed to clients in 500 responses. This leaks internal error information and should be replaced with a generic message.

Prompt for AI agents
Check if this issue is valid — if so, understand the root cause and fix it. At backend/app/routes/health.py, line 61:

<comment>Raw exception details are exposed to clients in 500 responses. This leaks internal error information and should be replaced with a generic message.</comment>

<file context>
@@ -0,0 +1,111 @@
+        db.rollback()
+        raise HTTPException(
+            status_code=500,
+            detail=f"Failed to seed health data: {str(e)}",
+        )
+    finally:
</file context>
@codeW-Krish	Reply...
frontend/components/dashboard/mock-exam-dashboard.tsx
Comment on lines +892 to 920
            {[
              {
                label: "Academic Health",
                value: healthLoading ? "..." : healthData ? String(Math.round(healthData.health_score)) : "—",
                detail: healthLoading ? "Loading" : healthData ? healthData.trend.charAt(0).toUpperCase() + healthData.trend.slice(1) : "No data",
                icon: HeartPulseIcon,
              },
              {
                label: "Exam Readiness",
                value: "74%",
                detail: "Physics focus",
                icon: GaugeIcon,
              },
              {
                label: "Weak Concepts",
                value: "3",
                detail: "Needs revision",
                icon: BrainCircuitIcon,
              },
              {
                label: "Today's Plan",
                value: "5",
                detail: "Tasks queued",
                icon: CalendarClockIcon,
              },
            ].map((stat) => (
              <Metric
                key={stat.label}
                icon={stat.icon}
@cubic-dev-ai
cubic-dev-ai Bot
2 minutes ago
Contributor
P3: Inline stats array duplicates existing dashboardStats and introduces dead config. Keep one source to prevent metric drift during future edits.

Prompt for AI agents
Check if this issue is valid — if so, understand the root cause and fix it. At frontend/components/dashboard/mock-exam-dashboard.tsx, line 892:

<comment>Inline stats array duplicates existing `dashboardStats` and introduces dead config. Keep one source to prevent metric drift during future edits.</comment>

<file context>
@@ -885,7 +889,32 @@ export function MockExamDashboard() {
 
           <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
-            {dashboardStats.map((stat) => (
+            {[
+              {
+                label: "Academic Health",
</file context>