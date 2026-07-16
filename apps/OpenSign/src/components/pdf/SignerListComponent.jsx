import React from "react";
import { darkenColor, getFirstLetter } from "../../constant/Utils";

function SignerListComponent(props) {
  const checkSignerBackColor = (obj) => {
    if (obj) {
      let data = "";
      if (obj?.Id) {
        data = props.signerPos.filter((data) => data.Id === obj.Id);
      } else {
        data = props.signerPos.filter(
          (data) => data.signerObjId === obj.objectId
        );
      }
      return data && data.length > 0 && data[0].blockColor;
    }
  };
  const checkUserNameColor = (obj) => {
    const getBackColor = checkSignerBackColor(obj);
    if (getBackColor) {
      const color = darkenColor(getBackColor, 0.4);
      return color;
    } else {
      return "#a1a1aa";
    }
  };

  const backColor = checkSignerBackColor(props.obj) || "hsl(var(--b2) / 1)";

  return (
    <div
      className="rounded-md mx-2 flex flex-row items-center gap-2 py-2 px-2 mt-1.5 border border-base-300/80"
      style={{ background: backColor }}
    >
      <div
        style={{ background: checkUserNameColor(props.obj) }}
        className="flex shrink-0 size-7 rounded-full justify-center items-center text-white"
      >
        <span className="text-[11px] text-center font-semibold uppercase">
          {getFirstLetter(
            props.obj?.Name || props.obj?.email || props.obj?.Role
          )}
        </span>
      </div>
      <div className="flex min-w-0 flex-col overflow-hidden">
        <span className="text-xs font-semibold truncate text-base-content">
          {props.obj?.Name || props?.obj?.Role}
        </span>
        <span className="text-[10px] font-medium truncate text-base-content/70">
          {props.obj?.Email || props.obj?.email}
        </span>
      </div>
    </div>
  );
}

export default SignerListComponent;
