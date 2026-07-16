import { useCallback, useEffect, useRef, useState } from "react";
import { useWindowSize } from "./useWindowSize";
import { pdfNewWidthFun } from "../constant/Utils";

/** Wait for shell sidebar / main column width transitions to finish */
const LAYOUT_SETTLE_MS = 320;

/**
 * Measure the PDF column width after layout settles (sidebar toggle, resize).
 * Uses a callback ref so measurement starts when the container mounts (e.g. after loading).
 * ResizeObserver updates are debounced to avoid redrawing react-pdf mid-animation.
 */
export default function usePdfContainerMeasure(divRef) {
  const windowSize = useWindowSize();
  const [containerEl, setContainerEl] = useState(null);
  const [containerWH, setContainerWH] = useState({ width: 0, height: 0 });
  const [pdfNewWidth, setPdfNewWidth] = useState(0);
  const lastWidthRef = useRef(0);

  const containerRef = useCallback(
    (node) => {
      if (divRef) {
        divRef.current = node;
      }
      setContainerEl(node);
    },
    [divRef]
  );

  useEffect(() => {
    if (!containerEl) return;

    let timer;

    const applySize = () => {
      if (!containerEl.isConnected) return;
      const pdfWidth = pdfNewWidthFun({ current: containerEl });
      if (pdfWidth <= 0) return;
      if (
        lastWidthRef.current > 0 &&
        Math.abs(pdfWidth - lastWidthRef.current) < 1
      ) {
        return;
      }
      lastWidthRef.current = pdfWidth;
      setPdfNewWidth(pdfWidth);
      setContainerWH({
        width: pdfWidth,
        height: containerEl.offsetHeight
      });
    };

    const scheduleDebounced = () => {
      clearTimeout(timer);
      timer = window.setTimeout(applySize, LAYOUT_SETTLE_MS);
    };

    // Measure as soon as the container mounts; debounce later resize events.
    requestAnimationFrame(() => {
      applySize();
      if (lastWidthRef.current <= 0) {
        requestAnimationFrame(applySize);
      }
    });

    const ro = new ResizeObserver(scheduleDebounced);
    ro.observe(containerEl);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [containerEl, windowSize?.width]);

  return { containerRef, containerWH, pdfNewWidth };
}
