/**
 * Local email design review gallery.
 *
 * Standalone (no auth shell) page that renders every OpenSign system email
 * with mock data in an iframe, so design can be reviewed without sending mail.
 */

import { useMemo, useState } from "react";
import {
  EMAIL_CATEGORIES,
  EMAIL_TEMPLATES
} from "./emailPreview/emailTemplates";

const VIEWPORTS = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "tablet", label: "Tablet", width: "768px" },
  { id: "mobile", label: "Mobile", width: "375px" }
];

/**
 * EmailPreview — sidebar picker + subject chrome + iframe HTML preview.
 */
const EmailPreview = () => {
  const [selectedId, setSelectedId] = useState(EMAIL_TEMPLATES[0].id);
  const [viewport, setViewport] = useState("desktop");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filtered = useMemo(() => {
    if (categoryFilter === "All") return EMAIL_TEMPLATES;
    return EMAIL_TEMPLATES.filter((t) => t.category === categoryFilter);
  }, [categoryFilter]);

  const selected =
    EMAIL_TEMPLATES.find((t) => t.id === selectedId) || EMAIL_TEMPLATES[0];

  const viewportWidth =
    VIEWPORTS.find((v) => v.id === viewport)?.width || "100%";

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      <header className="bg-base-100 border-b border-base-300 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Email design review</h1>
          <p className="text-sm opacity-70">
            Local preview of DocTransit system emails (mock data, not sent)
          </p>
        </div>
        <div className="op-join">
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`op-btn op-btn-sm op-join-item ${
                viewport === v.id ? "op-btn-primary" : "op-btn-ghost"
              }`}
              onClick={() => setViewport(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <aside className="w-full md:w-80 shrink-0 bg-base-100 border-b md:border-b-0 md:border-r border-base-300 overflow-y-auto max-h-[40vh] md:max-h-none">
          <div className="p-3 flex flex-wrap gap-1">
            <button
              type="button"
              className={`op-btn op-btn-xs ${
                categoryFilter === "All" ? "op-btn-primary" : "op-btn-ghost"
              }`}
              onClick={() => setCategoryFilter("All")}
            >
              All
            </button>
            {EMAIL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`op-btn op-btn-xs ${
                  categoryFilter === cat ? "op-btn-primary" : "op-btn-ghost"
                }`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <ul className="op-menu op-menu-sm p-2 pb-6">
            {filtered.map((email) => (
              <li key={email.id}>
                <button
                  type="button"
                  className={selectedId === email.id ? "active" : ""}
                  onClick={() => setSelectedId(email.id)}
                >
                  <span className="flex flex-col items-start gap-0.5 text-left">
                    <span>{email.name}</span>
                    <span className="text-[11px] opacity-60 font-normal">
                      {email.category}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 p-4 gap-3">
          <div className="bg-base-100 rounded-box border border-base-300 p-4 space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold">{selected.name}</h2>
              <span className="op-badge op-badge-ghost op-badge-sm">
                {selected.category}
              </span>
            </div>
            <p className="text-xs opacity-60 font-mono break-all">
              {selected.source}
            </p>
            {selected.note && (
              <p className="text-sm opacity-80">{selected.note}</p>
            )}
            <div className="pt-1">
              <span className="text-xs uppercase tracking-wide opacity-50">
                Subject
              </span>
              <p className="text-sm font-medium mt-0.5">{selected.subject}</p>
            </div>
          </div>

          <div className="flex-1 flex justify-center min-h-[480px]">
            <div
              className="bg-white shadow-md border border-base-300 rounded-box overflow-hidden w-full transition-all"
              style={{ maxWidth: viewportWidth }}
            >
              <iframe
                title={`Preview: ${selected.name}`}
                srcDoc={selected.body}
                className="w-full h-[70vh] min-h-[480px] border-0 bg-white"
                sandbox=""
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmailPreview;
