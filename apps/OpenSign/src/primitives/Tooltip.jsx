import React from "react";
import { CircleHelp } from "lucide-react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { openInNewTab } from "../constant/Utils";

const HelpIcon = ({ iconColor }) => {
  const color = iconColor || "currentColor";
  return (
    <CircleHelp
      className="inline-block size-3.5 shrink-0 opacity-70"
      style={{ color }}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
};

const Tooltip = ({
  id,
  message,
  url,
  iconColor,
  maxWidth,
  handleOnlickHelp
}) =>
  url || handleOnlickHelp ? (
    <button
      type="button"
      onClick={() =>
        handleOnlickHelp ? handleOnlickHelp() : openInNewTab(url)
      }
      className="inline-flex items-center text-center cursor-pointer focus:outline-none text-base-content/60 hover:text-base-content"
    >
      <HelpIcon iconColor={iconColor} />
    </button>
  ) : (
    <>
      <a
        data-tooltip-id={id ? id : "my-tooltip"}
        data-tooltip-content={message}
        className="z-50 inline-flex items-center text-base-content/60 hover:text-base-content cursor-help"
      >
        <HelpIcon iconColor={iconColor} />
      </a>
      <ReactTooltip
        id={id ? id : "my-tooltip"}
        className={`${maxWidth ? maxWidth : "max-w-[200px]"} z-[200]`}
      />
    </>
  );

export default Tooltip;
