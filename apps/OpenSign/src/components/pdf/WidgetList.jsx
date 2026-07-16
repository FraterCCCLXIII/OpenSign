import { isMobile } from "../../constant/Utils";
import { useTranslation } from "react-i18next";
import getWidgetType from "./getWidgetType";

function WidgetList(props) {
  const { t } = useTranslation();
  const getWidgetList = props.updateWidgets();
  return getWidgetList?.map((item, ind) => {
    return (
      <div
        key={ind}
        className={isMobile ? "shrink-0" : "min-w-0"}
        role="listitem"
      >
        <div
          data-tut="isSignatureWidget"
          className={`select-none cursor-grab active:cursor-grabbing ${
            isMobile ? "mx-1" : ""
          }`}
          style={
            isMobile && props.marginLeft
              ? { marginLeft: props.marginLeft }
              : undefined
          }
          onClick={() => {
            props.addPositionOfSignature &&
              props.addPositionOfSignature("onclick", item);
          }}
          ref={(element) => !isMobile && item.ref(element)}
          onMouseMove={(e) => !isMobile && props?.handleDivClick(e)}
          onMouseDown={() => !isMobile && props?.handleMouseLeave()}
          onTouchStart={(e) => !isMobile && props?.handleDivClick(e)}
        >
          {item.ref && getWidgetType(item, t(`widgets-name.${item.type}`))}
        </div>
      </div>
    );
  });
}

export default WidgetList;
