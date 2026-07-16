import { useState, useRef, useEffect } from "react";
import ModalUi from "../../primitives/ModalUi";
import RecipientList from "./RecipientList";
import WidgetList from "./WidgetList";
import {
  isMobile,
  radioButtonWidget,
  textInputWidget,
  cellsWidget,
  textWidget,
  widgets,
  drawWidget
} from "../../constant/Utils";
import { useTranslation } from "react-i18next";
import { useWidgetDrag } from "../../hook/useWidgetDrag";
import Tooltip from "../../primitives/Tooltip";

function WidgetComponent(props) {
  const { t } = useTranslation();
  const signRef = useRef(null);
  const userInformation = localStorage.getItem("UserInformation");
  const [isSignersModal, setIsSignersModal] = useState(false);
  // Define all draggable widget configurations
  const draggableItems = [
    { id: 1, text: "signature" },
    { id: 2, text: "stamp" },
    { id: 3, text: "initials" },
    { id: 4, text: textInputWidget },
    { id: 6, text: "name" },
    { id: 7, text: "job title" },
    { id: 8, text: "company" },
    { id: 9, text: "email" },
    { id: 10, text: "date" },
    { id: 11, text: textWidget },
    { id: 12, text: cellsWidget },
    { id: 13, text: "checkbox" },
    { id: 14, text: "dropdown" },
    { id: 15, text: radioButtonWidget },
    { id: 16, text: "image" },
    { id: 17, text: drawWidget },
  ];

  // Create all drag refs in one go
  const widgetRefs = draggableItems.map((item) =>
    useWidgetDrag({ type: "BOX", ...item })
  );

  // Map your widgets with the generated dragRefs
  const [widgetList, setWidgetList] = useState([]);
  const handleModal = () => {
    setIsSignersModal(!isSignersModal);
  };
  useEffect(() => {
    const updated = widgets.map((obj, index) => ({
      ...obj,
      ref: widgetRefs[index]?.dragRef || null
    }));
    setWidgetList(updated);
    // eslint-disable-next-line
  }, []);

  // allow only (signature, stamp, initials, text, name, job title, company, email, cells) widget when isAllowModification true and user have session token
  const modifiedWidgets = widgetList.filter(
    (data) =>
      ![
        "dropdown",
        radioButtonWidget,
        textInputWidget,
        "date",
        "image",
        "checkbox",
        drawWidget
      ].includes(data.type)
  );
  // allow only (signature, stamp, initials, text, cells) widget when isAllowModification true and user does not have session token
  const unlogedInUserWidgets = widgetList.filter(
    (data) =>
      ![
        "dropdown",
        radioButtonWidget,
        textInputWidget,
        "date",
        "image",
        "checkbox",
        "name",
        "email",
        "job title",
        "company",
        drawWidget
      ].includes(data.type)
  );
  const selfSignWidgets = widgetList.filter(
    (data) =>
      ![
        "dropdown",
        radioButtonWidget,
        textInputWidget,
        drawWidget,
      ].includes(data.type)
  );
  //if user select prefill role then allow only date,image,text,checkbox,radio,dropdownAdd commentMore actions
  //dropdown widget should only be show in template flow
  const prefillAllowWidgets = widgetList.filter((data) =>
    (props.isPrefillDropdown ? ["dropdown"] : [])
      .concat([
        radioButtonWidget,
        textWidget,
        "date",
        "image",
        "checkbox",
        drawWidget
      ])
      .includes(data.type)
  );
  //function to show widget on the base of conditionAdd commentMore actions
  const handleWidgetType = () => {
    if (props.isSignYourself) {
      return selfSignWidgets;
    } else if (props?.roleName === "prefill") {
      return prefillAllowWidgets;
    } else if (props.isAlllowModify) {
      if (userInformation) {
        return modifiedWidgets;
      } else {
        return unlogedInUserWidgets;
      }
    } else if (props?.roleName !== "prefill") {
      return widgetList.filter(
        (data) => ![textWidget, drawWidget].includes(data.type)
      );
    }
  };
  const handleSelectRecipient = () => {
    if (props?.roleName === "prefill") {
      return "Prefill by owner";
    } else if (
      props.signersdata[props.isSelectListId]?.Email ||
      props.signersdata[props.isSelectListId]?.Role
    ) {
      const userData =
        props.signersdata[props.isSelectListId]?.Name ||
        props.signersdata[props.isSelectListId]?.Role;
      const name =
        userData?.length > 20 ? `${userData.slice(0, 20)}...` : userData;
      return name;
    }
  };
  const handleBlockColor = () => {
    const widgetBoxColor = props?.signerPos?.find(
      (x) => x?.Id === props?.uniqueId
    )?.blockColor;
    return widgetBoxColor;
  };
  return (
    <>
      {isMobile ? (
        !props.isMailSend && (
          <div id="navbar" className="fixed z-[99] bottom-0 right-0 w-full">
            {props.isSigners && (
              <div className="w-full mb-[5px] flex justify-center items-center gap-1">
                <div className="w-full ml-[5px]" onClick={() => handleModal()}>
                  <select
                    data-tut="recipientArea"
                    className="w-full op-select op-select-bordered  pointer-events-none"
                    value={handleSelectRecipient()}
                    style={{
                      backgroundColor:
                        props.roleName === "prefill"
                          ? "#edf6fc"
                          : handleBlockColor() || "#edf6fc"
                    }}
                  >
                    <option value={handleSelectRecipient()}>
                      {handleSelectRecipient()}
                    </option>
                  </select>
                </div>

                <div className="w-[18%]">
                  {props.handleAddSigner ? (
                    <button
                      data-tut="reactourAddbtn"
                      onClick={() => props.handleAddSigner()}
                      className="op-btn op-btn-accent"
                    >
                      <i className="fa-light fa-plus "></i>
                    </button>
                  ) : (
                    props.setIsAddSigner && (
                      <button
                        data-tut="addRecipient"
                        onClick={() => props.setIsAddSigner(true)}
                        className="op-btn op-btn-accent"
                      >
                        <i className="fa-light fa-plus"></i>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            <div
              data-tut="addWidgets"
              className="bg-base-100 border-t border-base-300"
            >
              <div className="flex whitespace-nowrap overflow-x-auto gap-1 px-2 py-2">
                <WidgetList
                  updateWidgets={handleWidgetType}
                  handleDivClick={props.handleDivClick}
                  handleMouseLeave={props.handleMouseLeave}
                  signRef={signRef}
                  addPositionOfSignature={props.addPositionOfSignature}
                />
              </div>
            </div>
          </div>
        )
      ) : (
        <div
          data-tut={props.dataTut}
          className={`${
            props.isMailSend ? "bg-opacity-50 pointer-events-none" : ""
          } hidden md:flex md:flex-col md:h-full md:min-h-0 bg-base-100`}
        >
          <div className="px-3 py-2.5 text-sm text-base-content font-semibold shrink-0 tracking-tight flex items-center gap-1">
            <span>{t("widgets")}</span>
            {props?.isSignYourself && (
              <Tooltip
                handleOnlickHelp={() =>
                  props.setIsTour && props.setIsTour(true)
                }
              />
            )}
          </div>
          <div
            className="px-3 pb-3 min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-1.5 content-start overflow-y-auto"
            data-tut="addWidgets"
            role="list"
            aria-label="Add widgets"
          >
            <WidgetList
              updateWidgets={handleWidgetType}
              handleDivClick={props.handleDivClick}
              handleMouseLeave={props.handleMouseLeave}
              signRef={signRef}
              addPositionOfSignature={props.addPositionOfSignature}
            />
          </div>
        </div>
      )}
      {isSignersModal && (
        <ModalUi
          title={props.title ? props.title : t("recipients")}
          isOpen={isSignersModal}
          handleClose={handleModal}
        >
          {props.signersdata.length > 0 || props.prefillSigner.length > 0 ? (
            <div className="max-h-[600px] overflow-auto pb-1">
              <RecipientList
                signerPos={props.signerPos}
                signersdata={props.signersdata}
                isSelectListId={props.isSelectListId}
                setIsSelectId={props.setIsSelectId}
                setUniqueId={props.setUniqueId}
                setRoleName={props.setRoleName}
                handleDeleteUser={props.handleDeleteUser}
                handleRoleChange={props.handleRoleChange}
                handleOnBlur={props.handleOnBlur}
                handleModal={handleModal}
                sendInOrder={props.sendInOrder}
                setSignersData={props.setSignersData}
                setBlockColor={props.setBlockColor}
                uniqueId={props.uniqueId}
                setSignerPos={props.setSignerPos}
                prefillSigner={props.prefillSigner}
              />
            </div>
          ) : (
            <div className=" p-[20px] text-[15px] font-medium text-center">
              {t("please-add")} {props.title ? props.title : t("recipients")}
            </div>
          )}
        </ModalUi>
      )}
    </>
  );
}

export default WidgetComponent;
