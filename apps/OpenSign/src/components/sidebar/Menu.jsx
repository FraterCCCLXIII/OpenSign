import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { NavLink } from "react-router";

const Menu = ({ item, isOpen, closeSidebar }) => {
  const { t } = useTranslation();
  const { selectedMenu } = useSelector((state) => state.sidebar);

  return (
    <li key={item.title} role="none" className="my-0.5">
      <NavLink
        to={
          item.pageType
            ? `/${item.pageType}/${item.objectId}`
            : `/${item.objectId}`
        }
        className={({ isActive }) =>
          `${
            isActive && selectedMenu
              ? "bg-base-200 text-base-content font-medium"
              : "text-base-content/80"
          } flex gap-x-3 items-center justify-start text-left px-3 py-2 rounded-md hover:text-base-content focus:bg-base-200 hover:bg-base-200 hover:no-underline focus:outline-none`
        }
        onClick={() => closeSidebar(item.title)}
        tabIndex={isOpen ? 0 : -1}
        role="menuitem"
      >
        <span className="w-4 h-4 flex justify-center items-center shrink-0">
          <i className={`${item.icon} text-sm`} aria-hidden="true"></i>
        </span>
        <span className="flex items-center mb-0.5">
          {t(`sidebar.${item.title}`)}
        </span>
      </NavLink>
    </li>
  );
};

export default Menu;
