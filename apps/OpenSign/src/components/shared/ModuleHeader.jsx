/**
 * Consistent page header for dashboard modules (reports, lists, settings).
 */
const ModuleHeader = ({
  title,
  help,
  actions,
  className = ""
}) => (
  <div
    className={`flex flex-row flex-wrap items-center justify-between gap-3 px-3 py-3 border-b border-base-300 ${className}`}
  >
    <div className="flex min-w-0 items-center gap-2">
      <h1 className="text-lg font-semibold tracking-tight text-base-content truncate">
        {title}
      </h1>
      {help}
    </div>
    {actions ? (
      <div className="flex flex-row flex-wrap items-center justify-end gap-2">
        {actions}
      </div>
    ) : null}
  </div>
);

export default ModuleHeader;
