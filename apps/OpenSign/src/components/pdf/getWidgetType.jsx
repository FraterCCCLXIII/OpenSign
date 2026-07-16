import { isMobile } from "../../constant/Utils";

// `getWidgetType` is used to load ui of widget in side list
const getWidgetType = (item, widgetName) => {
  if (isMobile) {
    return (
      <div
        title={widgetName}
        className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1.5 text-base-content hover:bg-base-200 hover:border-base-content/30 transition-colors"
      >
        <i className={`${item.icon} text-xs text-base-content/70`}></i>
        <span className="text-[11px] font-medium capitalize truncate max-w-[7rem]">
          {widgetName}
        </span>
      </div>
    );
  }

  return (
    <div
      title={widgetName}
      className="group w-full flex items-center gap-2 rounded-md border border-base-300 bg-base-100 px-2 py-2 text-base-content hover:bg-base-200 hover:border-base-content/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
    >
      <i
        className={`${item.icon} text-sm text-base-content/70 group-hover:text-base-content shrink-0`}
        aria-hidden="true"
      ></i>
      <span className="min-w-0 flex-1 text-left text-xs font-medium capitalize truncate">
        {widgetName}
      </span>
      <i
        className="fa-solid fa-grip-dots-vertical text-[11px] text-base-content/35 group-hover:text-base-content/55 shrink-0"
        aria-hidden="true"
      ></i>
    </div>
  );
};
export default getWidgetType;
