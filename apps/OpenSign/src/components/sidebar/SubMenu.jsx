import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { NavLink } from "react-router";

const Submenu = ({ item, closeSidebar, toggleSubmenu, submenuOpen }) => {
  const { t } = useTranslation();
  const { title, icon, children } = item;
  const { selectedMenu } = useSelector((state) => state.sidebar);

  return (
    <li role="none" className="my-0.5">
      <button
        onClick={() => toggleSubmenu(item.title)}
        className="flex gap-x-3 items-center justify-start text-left px-3 py-2 rounded-md text-base-content/80 hover:text-base-content focus:bg-base-200 hover:bg-base-200 hover:no-underline focus:outline-none w-full"
        aria-expanded={submenuOpen}
        aria-haspopup="true"
        aria-controls={`submenu-${title}`}
      >
        <span className="w-4 h-4 flex justify-center items-center shrink-0">
          <i className={`${icon} text-sm`}></i>
        </span>
        <div className="flex justify-between items-center w-full">
          <span className="flex items-center mb-0.5">
            {t(`sidebar.${item.title}`)}
          </span>
          <i
            className={`${
              submenuOpen[item.title]
                ? "fa-light fa-angle-down"
                : "fa-light fa-angle-right"
            }`}
            aria-hidden="true"
          ></i>
        </div>
      </button>
      {submenuOpen[item.title] && (
        <ul id={`submenu-${title}`} role="menu" aria-label={`${title} submenu`}>
          {children.map((childItem) => (
            <li key={childItem.title} role="none" className="my-0.5">
              <NavLink
                to={
                  childItem.pageType
                    ? `/${childItem.pageType}/${childItem.objectId}`
                    : `/${childItem.objectId}`
                }
                className={({ isActive }) =>
                  `${
                    isActive && selectedMenu
                      ? "bg-base-200 text-base-content font-medium"
                      : "text-base-content/80"
                  } pl-4 flex items-center gap-x-3 py-2 px-3 rounded-md text-sm cursor-pointer hover:text-base-content focus:bg-base-200 hover:bg-base-200 hover:no-underline focus:outline-none`
                }
                onClick={() => closeSidebar(childItem.title)}
                role="menuitem"
                tabIndex={submenuOpen ? 0 : -1}
              >
                <span className="w-3.5 h-3.5 flex justify-center items-center shrink-0">
                  <i
                    className={`${childItem.icon} text-xs`}
                    aria-hidden="true"
                  ></i>
                </span>
                <span className="mb-0.5">
                  {t(`sidebar.${item.title}-Children.${childItem.title}`)}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default Submenu;
