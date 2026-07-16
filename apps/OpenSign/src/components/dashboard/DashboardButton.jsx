import { useNavigate } from "react-router";
import { openInNewTab } from "../../constant/Utils";
import { useTranslation } from "react-i18next";
import { FilePenLine, Send, ChevronRight } from "lucide-react";

const LABEL_META = {
  "Sign yourself": {
    descriptionKey: "signyour-self-button",
    Icon: FilePenLine
  },
  "Request signatures": {
    descriptionKey: "requestsign-button",
    Icon: Send
  }
};

const DashboardButton = (props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const meta = LABEL_META[props.Label];
  const Icon = meta?.Icon;
  const canNavigate = Boolean(props.Data?.Redirect_type);

  function openReport() {
    if (!props.Data?.Redirect_type) return;
    const Redirect_type = props.Data.Redirect_type;
    const id = props.Data.Redirect_id;
    if (Redirect_type === "Form") {
      navigate(`/form/${id}`);
    } else if (Redirect_type === "Report") {
      navigate(`/report/${id}`);
    } else if (Redirect_type === "Url") {
      openInNewTab(id);
    }
  }

  return (
    <button
      type="button"
      onClick={openReport}
      disabled={!canNavigate}
      className={`group flex w-full items-start gap-4 rounded-lg border border-base-300 bg-base-100 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-content/20 ${
        canNavigate
          ? "hover:border-base-content/20 hover:bg-base-200/60 cursor-pointer"
          : "cursor-default opacity-70"
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-base-200 text-base-content">
        {Icon ? (
          <Icon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <i
            className={`${props.Icon ? props.Icon : "fa-light fa-info"} text-lg`}
            aria-hidden="true"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-base-content whitespace-nowrap">
            {t(`sidebar.${props.Label}`)}
          </span>
          {canNavigate && (
            <ChevronRight
              className="h-4 w-4 shrink-0 text-base-content/30 transition-transform group-hover:translate-x-0.5 group-hover:text-base-content/60"
              aria-hidden="true"
            />
          )}
        </span>
        {meta?.descriptionKey && (
          <span className="mt-1 block text-xs leading-relaxed text-base-content/60">
            {t(meta.descriptionKey)}
          </span>
        )}
      </span>
    </button>
  );
};

export default DashboardButton;
