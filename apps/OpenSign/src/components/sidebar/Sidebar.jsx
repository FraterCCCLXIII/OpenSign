import { useState, useEffect } from "react";
import Menu from "./Menu";
import Submenu from "./SubMenu";
import sidebarList, { subSetting } from "../../json/menuJson";
import { NavLink } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useWindowSize } from "../../hook/useWindowSize";
import {
  setSelectedMenu,
  toggleSidebar
} from "../../redux/reducers/sidebarReducer";

const Sidebar = () => {
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.sidebar.isOpen);
  const [menuList, setmenuList] = useState([]);
  const [submenuOpen, setSubmenuOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("accesstoken")) {
      menuItem();
    }
  }, []);

  const closeSidebar = () => {
    dispatch(setSelectedMenu(true));
    if (width <= 1023) {
      dispatch(toggleSidebar(false));
    }
  };

  const menuItem = async () => {
    try {
      if (localStorage.getItem("defaultmenuid")) {
        const Extand_Class = localStorage.getItem("Extand_Class");
        const extClass = Extand_Class && JSON.parse(Extand_Class);
        const userRole = extClass?.[0]?.UserRole || "contracts_User";
        const isAdmin =
          userRole === "contracts_Admin" || userRole === "contracts_OrgAdmin";
        const newSidebarList = sidebarList.map((item) => {
          if (item.title !== "Settings") return item;
          const newItem = { ...item };
          const baseChildren = isAdmin ? subSetting : subSetting?.slice(0, 1);
            const mysignature = newItem.children.slice(0, 1);
            newItem.children = [...mysignature, ...baseChildren];
          return newItem;
        });
        setmenuList(newSidebarList);
      }
    } catch (e) {
      console.error("Problem", e);
    }
  };

  const toggleSubmenu = (title) => {
    dispatch(setSelectedMenu(false));
    setSubmenuOpen({ [title]: !submenuOpen[title] });
  };

  const handleMenuItem = () => {
    dispatch(setSelectedMenu(true));
    closeSidebar();
    setSubmenuOpen({});
  };
  return (
    <aside
      className={`absolute max-lg:min-h-screen lg:relative bg-base-100 overflow-y-auto transition-all z-[500] border-r border-base-300 hide-scrollbar
     ${isOpen ? "w-full md:w-64" : "w-0"}`}
    >
      <nav
        className="op-menu op-menu-sm !flex-nowrap p-2"
        aria-label="Sidebar Navigation"
      >
        <NavLink
          to="/create"
          onClick={handleMenuItem}
          className={({ isActive }) =>
            `!flex w-full basis-full min-w-0 self-stretch box-border items-center justify-start gap-x-3 rounded-md px-3 py-2 mb-1 text-sm font-medium whitespace-nowrap no-underline shadow-none
             bg-base-content !text-base-100
             hover:bg-base-content hover:!text-base-100 hover:no-underline hover:opacity-90
             visited:!text-base-100
             focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
             ${isActive ? "opacity-90" : ""}`
          }
        >
          <span className="w-4 h-4 flex justify-center items-center shrink-0">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="flex items-center mb-0.5">{t("create-new.button")}</span>
        </NavLink>
        <ul
          className="w-full text-sm"
          role="menubar"
          aria-label="Sidebar Navigation"
        >
          {menuList.map((item) =>
            !item.children ? (
              <Menu
                key={item.title}
                item={item}
                isOpen={isOpen}
                closeSidebar={handleMenuItem}
              />
            ) : (
              <Submenu
                key={item.title}
                item={item}
                closeSidebar={closeSidebar}
                toggleSubmenu={toggleSubmenu}
                submenuOpen={submenuOpen}
              />
            )
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
