// ──────────────────────────────────────────────
// AISettings — Epic 14 (refactored)
// Full settings panel for managing AI endpoints,
// API keys, and connection testing.
// Renders as a modal overlay with endpoints
// grouped by category in collapsible sections.
// ──────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from "react";
import { useAISettings } from "../hooks/useAISettings";
import { CAPABILITY_REGISTRY } from "../ai/capabilities";
import {
  CATEGORY_INFO,
  getProviderColor,
  type UserEndpoint,
  type ProviderCategory,
  type ModelProvider,
} from "../ai/provider-config";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Which tab to show initially (default: "endpoints") */
  initialTab?: "endpoints" | "api-keys";
  /** If set, focus this endpoint's API key input in the API Keys tab */
  focusEndpointId?: string;
}

export default function AISettings({ isOpen, onClose, initialTab, focusEndpointId }: Props) {
  const settings = useAISettings();
  const [activeTab, setActiveTab] = useState<"endpoints" | "api-keys">(initialTab ?? "endpoints");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<ProviderCategory>>(new Set());

  const toggleCategory = useCallback((cat: ProviderCategory) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  if (!isOpen) return null;

  // Group endpoints by category
  const grouped = groupByCategory(settings.endpoints);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">AI Settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage AI endpoints, API keys, and connections
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-gray-800">
          <TabButton
            active={activeTab === "endpoints"}
            onClick={() => setActiveTab("endpoints")}
            label="Endpoints"
            count={settings.endpoints.length}
          />
          <TabButton
            active={activeTab === "api-keys"}
            onClick={() => setActiveTab("api-keys")}
            label="API Keys"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "endpoints" ? (
            <div className="space-y-4">
              {/* Grouped endpoint categories */}
              {(Object.keys(grouped) as ProviderCategory[]).map((category) => {
                const eps = grouped[category];
                if (!eps || eps.length === 0) return null;
                const info = CATEGORY_INFO[category];
                const isCollapsed = collapsedCategories.has(category);

                return (
                  <CategorySection
                    key={category}
                    label={info.label}
                    icon={info.icon}
                    count={eps.length}
                    isCollapsed={isCollapsed}
                    onToggle={() => toggleCategory(category)}
                  >
                    {eps.map((ep) => (
                      <EndpointCard
                        key={ep.id}
                        endpoint={ep}
                        isActive={ep.id === settings.activeEndpointId}
                        isEditing={editingId === ep.id}
                        isTesting={settings.testingId === ep.id}
                        testResult={settings.testResults[ep.id]}
                        hasApiKey={!!(settings.getEndpointApiKey(ep.providerId) ?? settings.getEndpointApiKey(ep.id))}
                        onSetActive={() => settings.setActiveEndpoint(ep.id)}
                        onToggle={() => settings.toggleEndpoint(ep.id)}
                        onEdit={() => setEditingId(editingId === ep.id ? null : ep.id)}
                        onUpdate={(updates) => settings.updateEndpoint(ep.id, updates)}
                        onRemove={() => settings.removeEndpoint(ep.id)}
                        onTest={() => settings.testConnection(ep.id)}
                        onOpenApiKeys={() => setActiveTab("api-keys")}
                      />
                    ))}
                  </CategorySection>
                );
              })}

              {/* Add endpoint button */}
              {showAddForm ? (
                <AddEndpointForm
                  onAdd={(ep) => {
                    settings.addEndpoint(ep);
                    setShowAddForm(false);
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-indigo-600/50 rounded-xl text-sm text-gray-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Custom Endpoint
                </button>
              )}
            </div>
          ) : (
            <ApiKeysTab settings={settings} focusEndpointId={focusEndpointId} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-950/50 rounded-b-2xl">
          <button
            onClick={settings.resetToDefaults}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Button ────────────────────────────────

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
        active
          ? "text-indigo-400 border-indigo-500 bg-indigo-950/20"
          : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/50"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-2 text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}

// ── Category Section (collapsible accordion) ──

function CategorySection({
  label,
  icon,
  count,
  isCollapsed,
  onToggle,
  children,
}: {
  label: string;
  icon: string;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      {/* Category header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/80 hover:bg-gray-800/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-gray-200">{label}</span>
          <span className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Category content */}
      {!isCollapsed && <div className="divide-y divide-gray-800/50">{children}</div>}
    </div>
  );
}

// ── Endpoint Card ─────────────────────────────

function EndpointCard({
  endpoint,
  isActive,
  isEditing,
  isTesting,
  testResult,
  hasApiKey,
  onSetActive,
  onToggle,
  onEdit,
  onUpdate,
  onRemove,
  onTest,
  onOpenApiKeys,
}: {
  endpoint: UserEndpoint;
  isActive: boolean;
  isEditing: boolean;
  isTesting: boolean;
  testResult?: { success: boolean; message: string; latencyMs?: number };
  hasApiKey: boolean;
  onSetActive: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onUpdate: (updates: Partial<UserEndpoint>) => void;
  onRemove: () => void;
  onTest: () => void;
  onOpenApiKeys: () => void;
}) {
  return (
    <div
      className={`p-4 transition-colors ${
        isActive
          ? "bg-indigo-950/15"
          : endpoint.enabled
            ? "bg-gray-900/30"
            : "bg-gray-900/10 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Active indicator */}
          <button
            onClick={onSetActive}
            className={`mt-1 shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${
              isActive
                ? "border-indigo-500 bg-indigo-500"
                : "border-gray-600 hover:border-indigo-500"
            }`}
            title={isActive ? "Active endpoint" : "Set as active"}
          />

          <div className="min-w-0 flex-1">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-medium text-gray-200">
                {endpoint.userLabel || endpoint.label}
              </h3>

              {/* Provider badge */}
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getProviderColor(endpoint.providerId as ModelProvider)}`}>
                {endpoint.providerId}
              </span>

              {/* Pricing badge */}
              {endpoint.pricing && (
                <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                  {endpoint.pricing}
                </span>
              )}

              {/* Local badge */}
              {endpoint.isLocal && (
                <span className="text-[10px] font-medium text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded">
                  LOCAL
                </span>
              )}

              {/* Active badge */}
              {isActive && (
                <span className="text-[10px] font-medium text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded">
                  ACTIVE
                </span>
              )}
            </div>

            {/* Model path */}
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              {endpoint.providerId} / {endpoint.model}
            </p>

            {/* Context window info */}
            {endpoint.contextWindow && (
              <p className="text-[11px] text-gray-600 mt-0.5">
                {(endpoint.contextWindow / 1000).toFixed(0)}K context
                {endpoint.maxOutputTokens && ` · ${(endpoint.maxOutputTokens / 1000).toFixed(0)}K output`}
              </p>
            )}

            {/* Base URL override */}
            {endpoint.baseUrlOverride && (
              <p className="text-[11px] text-gray-600 mt-0.5 font-mono truncate">
                {endpoint.baseUrlOverride}
              </p>
            )}

            {/* Capabilities chips */}
            <div className="flex flex-wrap gap-1 mt-2">
              {endpoint.capabilities.slice(0, 6).map((cap) => (
                <span
                  key={cap}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700"
                  title={CAPABILITY_REGISTRY[cap]?.description ?? cap}
                >
                  {CAPABILITY_REGISTRY[cap]?.label ?? cap}
                </span>
              ))}
              {endpoint.capabilities.length > 6 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
                  +{endpoint.capabilities.length - 6}
                </span>
              )}
            </div>

            {/* API key status + inline action */}
            {endpoint.requiresApiKey && !hasApiKey && (
              <div className="mt-2">
                <button
                  onClick={onOpenApiKeys}
                  className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-900/20 hover:bg-amber-900/30 px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Enter API key
                </button>
              </div>
            )}
            {endpoint.requiresApiKey && hasApiKey && (
              <div className="mt-2">
                <span className="text-[11px] text-green-500 bg-green-900/20 px-2 py-1 rounded-lg inline-flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  API key saved
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Enable/disable toggle */}
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg transition-colors ${
              endpoint.enabled
                ? "text-gray-500 hover:text-green-400 hover:bg-green-900/20"
                : "text-gray-600 hover:text-gray-400 hover:bg-gray-800"
            }`}
            title={endpoint.enabled ? "Disable" : "Enable"}
          >
            {endpoint.enabled ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>

          {/* Edit button */}
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Remove button (only for non-built-in) */}
          {!BUILTIN_IDS.has(endpoint.id) && (
            <button
              onClick={onRemove}
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={`mt-3 text-xs px-3 py-2 rounded-lg ${
            testResult.success
              ? "bg-green-900/20 text-green-400 border border-green-800/30"
              : "bg-red-900/20 text-red-400 border border-red-800/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{testResult.message}</span>
            {testResult.latencyMs !== undefined && (
              <span className="text-gray-500 ml-auto">{testResult.latencyMs}ms</span>
            )}
          </div>
        </div>
      )}

      {/* Test connection button */}
      <button
        onClick={onTest}
        disabled={isTesting}
        className="mt-3 px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5"
      >
        {isTesting ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Testing...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Test Connection
          </>
        )}
      </button>

      {/* Expanded edit section */}
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Label</label>
            <input
              type="text"
              defaultValue={endpoint.userLabel || endpoint.label}
              onChange={(e) => onUpdate({ userLabel: e.target.value || undefined })}
              className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Base URL Override</label>
            <input
              type="text"
              defaultValue={endpoint.baseUrlOverride || endpoint.baseUrl}
              onChange={(e) => onUpdate({ baseUrlOverride: e.target.value || undefined })}
              className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked={endpoint.enabled}
              onChange={(e) => onUpdate({ enabled: e.target.checked })}
              className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-400">Enabled</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Built-in endpoint IDs (cannot be removed)
const BUILTIN_IDS = new Set([
  "openai-gpt-4o",
  "anthropic-claude-sonnet-4",
  "google-gemini-pro",
  "deepseek-v3",
  "deepseek-r1",
  "qwen-coder",
  "llama-4",
  "mistral-large",
  "openrouter-auto",
  "openrouter-best",
  "openrouter-cheapest",
  "openrouter-fastest",
  "ollama-local",
  "lm-studio-local",
  "mock-local",
]);

// ── Add Endpoint Form ─────────────────────────

function AddEndpointForm({
  onAdd,
  onCancel,
}: {
  onAdd: (endpoint: UserEndpoint) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [providerId, setProviderId] = useState<string>("openai");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [isLocal, setIsLocal] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!label.trim() || !model.trim()) return;

      const id = `custom-${Date.now()}`;
      const endpoint: UserEndpoint = {
        id,
        label: label.trim(),
        endpointType: isLocal ? "local" : "official",
        providerId,
        model: model.trim(),
        baseUrl,
        capabilities: ["streaming"],
        requiresApiKey: !isLocal,
        isLocal,
        category: "custom" as ProviderCategory,
        enabled: true,
      };
      onAdd(endpoint);
    },
    [label, providerId, model, baseUrl, isLocal, onAdd],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-indigo-600/30 bg-indigo-950/10 rounded-xl p-4 space-y-3"
    >
      <h3 className="text-sm font-medium text-indigo-300">Add Custom Endpoint</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My Custom Endpoint"
            className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Provider</label>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
            <option value="deepseek">DeepSeek</option>
            <option value="openrouter">OpenRouter</option>
            <option value="mock">Mock</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o-mini"
            className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isLocal}
          onChange={(e) => setIsLocal(e.target.checked)}
          className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-xs text-gray-400">Local endpoint (no API key required)</span>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          Add Endpoint
        </button>
      </div>
    </form>
  );
}

// ── API Keys Tab ──────────────────────────────

/**
 * Provider display info for section headers.
 */
const PROVIDER_LABELS: Record<string, { label: string; icon: string }> = {
  openai: { label: "OpenAI", icon: "🤖" },
  anthropic: { label: "Anthropic", icon: "🧠" },
  google: { label: "Google", icon: "🔍" },
  deepseek: { label: "DeepSeek", icon: "⚡" },
  openrouter: { label: "OpenRouter", icon: "🌍" },
  qwen: { label: "Qwen", icon: "🐉" },
  meta: { label: "Meta", icon: "📘" },
  mistral: { label: "Mistral", icon: "🌬️" },
};

function ApiKeysTab({
  settings,
  focusEndpointId,
}: {
  settings: ReturnType<typeof useAISettings>;
  focusEndpointId?: string;
}) {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editKeys, setEditKeys] = useState<Record<string, string>>({});
  const editKeysRef = useRef(editKeys);
  editKeysRef.current = editKeys;
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const toggleShowKey = useCallback((id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSaveKey = useCallback(
    (providerId: string) => {
      const key = editKeysRef.current[providerId];
      console.log(`[AISettings] handleSaveKey: providerId="${providerId}", key=${key ? `len=${key.length}` : "empty (removing)"}`);
      if (key) {
        // Save under providerId (new strategy) — all endpoints sharing this provider use the same key
        settings.setEndpointApiKey(providerId, key);
      } else {
        settings.removeEndpointApiKey(providerId);
      }
      setEditKeys((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
    },
    [settings],
  );

  // Auto-focus the specified endpoint's input
  useEffect(() => {
    if (focusEndpointId && inputRefs.current[focusEndpointId]) {
      inputRefs.current[focusEndpointId]?.focus();
      inputRefs.current[focusEndpointId]?.select();
    }
  }, [focusEndpointId]);

  const endpointsWithKeys = settings.endpoints.filter(
    (ep) => ep.requiresApiKey,
  );

  if (endpointsWithKeys.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No endpoints require API keys.
      </div>
    );
  }

  // Group endpoints by providerId
  const groupedByProvider: Record<string, UserEndpoint[]> = {};
  for (const ep of endpointsWithKeys) {
    const provider = ep.providerId;
    if (!groupedByProvider[provider]) {
      groupedByProvider[provider] = [];
    }
    groupedByProvider[provider].push(ep);
  }

  // Sort providers: known providers first (in display order), then custom
  const providerOrder = ["openai", "anthropic", "google", "deepseek", "openrouter", "qwen", "meta", "mistral"];
  const sortedProviders = Object.keys(groupedByProvider).sort((a, b) => {
    const aIdx = providerOrder.indexOf(a);
    const bIdx = providerOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return (
    <div className="space-y-6">
      {sortedProviders.map((provider) => {
        const eps = groupedByProvider[provider];
        const providerInfo = PROVIDER_LABELS[provider] ?? { label: provider, icon: "🔌" };

        return (
          <div key={provider}>
            {/* Provider section header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{providerInfo.icon}</span>
              <h3 className="text-sm font-semibold text-gray-200">{providerInfo.label}</h3>
              <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full">
                {eps.length} {eps.length === 1 ? "endpoint" : "endpoints"}
              </span>
            </div>

            <div className="space-y-2">
              {eps.map((ep) => {
                // Use providerId for key storage (new strategy), fall back to endpoint ID (legacy)
                const keyId = ep.providerId;
                const storedKey = settings.getEndpointApiKey(keyId) ?? settings.getEndpointApiKey(ep.id);
                const isEditing = editKeys[keyId] !== undefined;
                const displayKey = isEditing ? editKeys[keyId] : storedKey ?? "";
                const isFocused = ep.id === focusEndpointId;

                return (
                  <div
                    key={ep.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isFocused
                        ? "border-indigo-600/50 bg-indigo-950/15"
                        : "border-gray-800 bg-gray-900/50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-200">
                          {ep.userLabel || ep.label}
                        </span>
                        {storedKey && !isEditing && (
                          <span className="text-[10px] text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded">
                            SAVED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">{ep.id}</p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <div className="relative">
                        <input
                          ref={(el) => { inputRefs.current[keyId] = el; }}
                          type={showKeys[keyId] ? "text" : "password"}
                          value={displayKey}
                          onChange={(e) =>
                            setEditKeys((prev) => ({ ...prev, [keyId]: e.target.value }))
                          }
                          placeholder={ep.apiKeyPlaceholder ?? "Enter API key..."}
                          className="w-56 px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowKey(keyId)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showKeys[keyId] ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {isEditing || displayKey !== (storedKey ?? "") ? (
                        <button
                          onClick={() => handleSaveKey(keyId)}
                          className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                        >
                          Save
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────

function groupByCategory(endpoints: UserEndpoint[]): Record<string, UserEndpoint[]> {
  const order: ProviderCategory[] = ["frontier", "coding", "openrouter", "local"];
  const grouped: Record<string, UserEndpoint[]> = {};

  for (const cat of order) {
    const eps = endpoints.filter((e) => e.category === cat);
    if (eps.length > 0) grouped[cat] = eps;
  }

  // Custom endpoints (no matching category) go at the bottom
  const custom = endpoints.filter(
    (e) => !order.includes(e.category as ProviderCategory),
  );
  if (custom.length > 0) grouped["custom"] = custom;

  return grouped;
}
