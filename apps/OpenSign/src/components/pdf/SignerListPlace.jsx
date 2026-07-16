import RecipientList from "./RecipientList";
import { useTranslation } from "react-i18next";
import Tooltip from "../../primitives/Tooltip";

function SignerListPlace(props) {
  const { t } = useTranslation();

  const handleAddRecipient = () => {
    props?.setIsAddSigner(true);
    props.setIsTour && props.setIsTour(false);
  };
  return (
    <div>
      <div className="px-3 py-2.5 text-sm text-base-content font-semibold shrink-0 tracking-tight flex items-center gap-1">
        <span>{props.title ? props.title : "Recipients"}</span>
        <Tooltip handleOnlickHelp={() => props.setIsTour && props.setIsTour(true)} />
      </div>
      <div className="overflow-auto hide-scrollbar max-h-[180px]">
        <RecipientList {...props} />
      </div>
      <div className="px-3 pb-3">
        {props.handleAddSigner ? (
          <button
            type="button"
            data-tut="reactourAddbtn"
            disabled={props?.isMailSend}
            className="op-btn op-btn-outline op-btn-sm w-full gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => props.handleAddSigner()}
          >
            <i className="fa-light fa-plus text-xs" aria-hidden="true"></i>
            {t("add-role")}
          </button>
        ) : (
          <button
            type="button"
            data-tut="addRecipient"
            disabled={props?.isMailSend}
            className="op-btn op-btn-outline op-btn-sm w-full gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleAddRecipient}
          >
            <i className="fa-light fa-plus text-xs" aria-hidden="true"></i>
            {t("add-recipients")}
          </button>
        )}
      </div>
    </div>
  );
}

export default SignerListPlace;
