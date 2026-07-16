// FullScreenButton.js
import React, { useState, useEffect } from "react";

const FullScreenButton = ({ asMenuItem = false, label, exitLabel }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullScreenChange
      );
    };
  }, []);

  const handleFullScreenChange = () => {
    setIsFullScreen(!!document.fullscreenElement);
  };

  const toggleFullScreen = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (isFullScreen) {
      exitFullScreen();
    } else {
      requestFullScreen();
    }
  };

  const requestFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  };

  const exitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  if (asMenuItem) {
    return (
      <button
        type="button"
        role="menuitem"
        onClick={toggleFullScreen}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-base-content hover:bg-base-200 focus:bg-base-200 focus:outline-none"
      >
        <i
          className={`${
            isFullScreen ? "fa-light fa-compress" : "fa-light fa-maximize"
          } w-4 text-center text-base-content/70`}
          aria-hidden="true"
        ></i>
        <span>
          {isFullScreen
            ? exitLabel || "Exit full screen"
            : label || "Full screen"}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center">
      <button
        onClick={toggleFullScreen}
        className="text-base-content p-2 text-sm focus:outline-none"
        type="button"
        aria-label={isFullScreen ? "Exit full screen" : "Full screen"}
      >
        {isFullScreen ? (
          <i className="fa-light fa-compress"></i>
        ) : (
          <i className="fa-light fa-maximize"></i>
        )}
      </button>
    </div>
  );
};

export default FullScreenButton;
