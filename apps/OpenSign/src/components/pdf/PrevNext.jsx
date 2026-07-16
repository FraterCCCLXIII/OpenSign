import React from "react";
import { useTranslation } from "react-i18next";

function PrevNext({ pageNumber, allPages, changePage }) {
  const { t } = useTranslation();
  //for go to previous page
  function previousPage() {
    changePage(-1);
  }
  //for go to next page
  function nextPage() {
    changePage(1);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="op-btn op-btn-ghost op-btn-xs border border-base-300"
        disabled={pageNumber <= 1}
        onClick={previousPage}
        aria-label={t("previous")}
      >
        <i className="fa-light fa-chevron-up text-xs" aria-hidden="true"></i>
      </button>
      <span className="text-xs text-base-content/80 font-medium tabular-nums min-w-[4.5rem] text-center">
        {pageNumber || (allPages ? 1 : "--")} {t("of")} {allPages || "--"}
      </span>
      <button
        type="button"
        className="op-btn op-btn-ghost op-btn-xs border border-base-300"
        disabled={pageNumber >= allPages}
        onClick={nextPage}
        aria-label={t("next")}
      >
        <i className="fa-light fa-chevron-down text-xs" aria-hidden="true"></i>
      </button>
    </div>
  );
}

export default PrevNext;
