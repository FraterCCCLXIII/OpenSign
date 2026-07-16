import DocTransitMark from "../assets/images/doctransit-logo.svg?react";

/**
 * DocTransit wordmark. Uses currentColor so it follows light/dark text.
 */
const DocTransitLogo = ({ className = "h-4 w-auto", title = "DocTransit" }) => (
  <DocTransitMark
    role="img"
    aria-label={title}
    className={`text-base-content ${className}`}
  />
);

export default DocTransitLogo;
