import { useState, useEffect } from "react";
import FullScreenButton from "./FullScreenButton";
import ThemeToggle from "./ThemeToggle";
import { useNavigate } from "react-router";
import Parse from "parse";
import { useWindowSize } from "../hook/useWindowSize";
import {
  openInNewTab,
  saveLanguageInLocal
} from "../constant/Utils";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { toggleSidebar } from "../redux/reducers/sidebarReducer";
import { sessionStatus } from "../redux/reducers/userReducer";
import DocTransitLogo from "./DocTransitLogo";

const Header = ({ isConsole, setIsLoggingOut }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const dispatch = useDispatch();
  const username = localStorage.getItem("username") || "";
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    closeSidebar();
  };
  const closeSidebar = () => {
    if (width && width <= 768) {
      dispatch(toggleSidebar(false));
    }
  };

  useEffect(() => {
    closeSidebar();
  }, [width]);

  const showSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleLogout = async () => {
    setIsOpen(false);
    setIsLoggingOut(true);
    try {
      await Parse.User.logOut();
    } catch (err) {
      console.log("Err while logging out", err);
    } finally {
      dispatch(sessionStatus(true));
    }
    let appdata = localStorage.getItem("userSettings");
    let applogo = localStorage.getItem("appLogo");
    let defaultmenuid = localStorage.getItem("defaultmenuid");
    let PageLanding = localStorage.getItem("PageLanding");
    let baseUrl = localStorage.getItem("baseUrl");
    let appid = localStorage.getItem("parseAppId");
    let favicon = localStorage.getItem("favicon");

    localStorage.clear();
    saveLanguageInLocal(i18n);
    localStorage.setItem("appLogo", applogo);
    localStorage.setItem("defaultmenuid", defaultmenuid);
    localStorage.setItem("PageLanding", PageLanding);
    localStorage.setItem("userSettings", appdata);
    localStorage.setItem("baseUrl", baseUrl);
    localStorage.setItem("parseAppId", appid);
    localStorage.setItem("favicon", favicon);
    setIsLoggingOut(false);
    navigate("/");
  };

  //handle to close profile drop down menu onclick screen
  useEffect(() => {
    const closeMenuOnOutsideClick = (e) => {
      if (isOpen && !e.target.closest("#profile-menu")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", closeMenuOnOutsideClick);

    return () => {
      // Cleanup the event listener when the component unmounts
      document.removeEventListener("click", closeMenuOnOutsideClick);
    };
  }, [isOpen]);

  const menuItemClass =
    "flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-md text-base-content hover:bg-base-200 focus:bg-base-200 focus:outline-none cursor-pointer";

  return (
    <>
      <div className="op-navbar min-h-14 bg-base-100 border-b-0 touch-none px-1">
        <div className="flex-none">
          <button
            className="op-btn op-btn-square op-btn-ghost focus:outline-none op-btn-sm"
            onClick={showSidebar}
          >
            <i className="fa-light fa-bars text-lg text-base-content/80"></i>
          </button>
        </div>
        <div className="flex-1 ml-2">
          <button
            type="button"
            onClick={() => navigate("/dashboard/35KBoSgoAK")}
            className="flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-sm"
            aria-label="DocTransit home"
          >
            <DocTransitLogo className="h-3.5 md:h-4 w-auto" />
          </button>
        </div>
        <div id="profile-menu" className="relative flex-none">
          <button
            type="button"
            onClick={toggleDropdown}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-base-content/80 hover:bg-base-200 hover:text-base-content focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            {width >= 768 && username ? (
              <span className="max-w-[10rem] truncate">{username}</span>
            ) : (
              <i className="fa-light fa-user text-base-content/70" aria-hidden="true"></i>
            )}
            <i
              className={`fa-light fa-angle-down text-xs text-base-content/50 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            ></i>
          </button>

          {isOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 z-[600] w-56 overflow-hidden rounded-md border border-base-300 bg-base-100 p-1 shadow-md"
            >
              {!isConsole && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className={menuItemClass}
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <i
                      className="fa-light fa-user w-4 text-center text-base-content/70"
                      aria-hidden="true"
                    ></i>
                    <span>{t("profile")}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={menuItemClass}
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/changepassword");
                    }}
                  >
                    <i
                      className="fa-light fa-lock w-4 text-center text-base-content/70"
                      aria-hidden="true"
                    ></i>
                    <span>{t("change-password")}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={menuItemClass}
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/verify-document");
                    }}
                  >
                    <i
                      className="fa-light fa-check-square w-4 text-center text-base-content/70"
                      aria-hidden="true"
                    ></i>
                    <span>{t("verify-document")}</span>
                  </button>

                  <div className="my-1 h-px bg-base-300" />

                  <FullScreenButton asMenuItem />

                  <button
                    type="button"
                    role="menuitem"
                    className={menuItemClass}
                    onClick={() =>
                      openInNewTab("https://docs.opensignlabs.com")
                    }
                  >
                    <i
                      className="fa-light fa-book w-4 text-center text-base-content/70"
                      aria-hidden="true"
                    ></i>
                    <span>{t("docs")}</span>
                  </button>

                  <div
                    role="menuitem"
                    className={`${menuItemClass} justify-between cursor-default hover:bg-transparent`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="inline-flex items-center gap-2">
                      <i
                        className="fa-light fa-moon w-4 text-center text-base-content/70"
                        aria-hidden="true"
                      ></i>
                      <span>{t("dark-mode")}</span>
                      <span className="text-[10px] font-medium bg-base-200 text-base-content/60 px-1.5 py-0.5 rounded">
                        BETA
                      </span>
                    </span>
                    <ThemeToggle />
                  </div>

                  <div className="my-1 h-px bg-base-300" />
                </>
              )}
              <button
                type="button"
                role="menuitem"
                className={`${menuItemClass} text-error hover:bg-error/10 focus:bg-error/10`}
                onClick={handleLogout}
              >
                <i
                  className="fa-light fa-arrow-right-from-bracket w-4 text-center"
                  aria-hidden="true"
                ></i>
                <span>{t("log-out")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
