import React, { memo, useState, useEffect, useRef } from "react";
import "../../styles/opensigndrive.css";
import axios from "axios";
import { ContextMenu } from "radix-ui";
import { useNavigate } from "react-router";
import { HoverCard } from "radix-ui";
import ModalUi from "../../primitives/ModalUi";
import FolderModal from "../shared/fields/FolderModal";
import FolderIcon from "../shared/FolderIcon";
import FileIcon from "../shared/FileIcon";
import { useTranslation } from "react-i18next";
import { handleDownloadPdf, isMobile } from "../../constant/Utils";
import Parse from "parse";
import { withSessionValidation } from "../../utils";

function DriveBody(props) {
  const { t } = useTranslation();
  const [rename, setRename] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef(null);
  const [isOpenMoveModal, setIsOpenMoveModal] = useState(false);
  const [selectDoc, setSelectDoc] = useState();
  const [isDeleteDoc, setIsDeleteDoc] = useState({});
  const contextMenu = [
    { type: "Download", icon: "fa-light fa-arrow-down" },
    { type: "Rename", icon: "fa-light fa-font" },
    { type: "Move", icon: "fa-light fa-file-export" },
    { type: "Delete", icon: "fa-light fa-trash" }
  ];
  const navigate = useNavigate();

  //to focus input box on press rename to change doc name
  useEffect(() => {
    if (rename && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 10);
    }
  }, [rename]);

  //function to handle folder component
  const handleOnclikFolder = (data) => {
    const folderData = {
      name: data.Name,
      objectId: data.objectId
    };
    props.setFolderName((prev) => [...prev, folderData]);
    props.setIsLoading({
      isLoad: true,
      message: t("loading-mssg")
    });
    props.setDocId(data.objectId);
    props.setPdfData([]);
    props.setSkip(0);
  };
  //function for change doc name and update doc name in  _document class
  const handledRenameDoc = withSessionValidation(async (data) => {
    setRename("");
    const trimmedValue = renameValue.trim();
    if (trimmedValue.length > 0) {
      const updateName = { Name: renameValue };
      const docId = data.objectId;
      const docData = props.pdfData;
      const updatedData = docData.map((item) => {
        if (item.objectId === docId) {
          // If the item's ID matches the target ID, update the name
          return { ...item, Name: renameValue };
        }
        // If the item's ID doesn't match, keep it unchanged
        return item;
      });
      props.setPdfData(updatedData);
      props.sortingData(null, null, updatedData);
      try {
        await axios.put(
          `${localStorage.getItem("baseUrl")}classes/contracts_Document/${docId}`,
          updateName,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Parse-Application-Id": localStorage.getItem("parseAppId"),
              "X-Parse-Session-Token": localStorage.getItem("accesstoken")
            }
          }
        );
      } catch (err) {
        console.error("Error in rename doc", err);
        props.setIsAlert({
          isShow: true,
          alertMessage: t("something-went-wrong-mssg")
        });
      }
    }
  });

  //function for navigate user to microapp-signature component
  const checkPdfStatus = async (data) => {
    const signerExist = data?.Signers;
    const isDecline = data?.IsDeclined;
    const isPlaceholder = data?.Placeholders;
    const signedUrl = data?.SignedUrl;
    const isSignYourself = data?.IsSignyourself;
    //checking if document has completed and request signature flow
    if (data?.IsCompleted && signerExist?.length > 0) {
      navigate(`/recipientSignPdf/${data.objectId}`);
    }
    //checking if document has completed and signyour-self flow
    else if ((!signerExist && !isPlaceholder) || isSignYourself) {
      navigate(`/signaturePdf/${data.objectId}`);
    }
    //checking if document has declined by someone
    else if (isDecline) {
      navigate(`/recipientSignPdf/${data.objectId}`);
      //checking draft type document
    } else if (
      signerExist?.length > 0 &&
      isPlaceholder?.length > 0 &&
      !signedUrl
    ) {
      navigate(`/placeHolderSign/${data.objectId}`);
    }
    //Inprogress document
    else if (isPlaceholder?.length > 0 && signedUrl) {
      navigate(`/recipientSignPdf/${data.objectId}`);
    } //placeholder draft document
    else if (
      (signerExist?.length > 0 &&
        (!isPlaceholder || isPlaceholder?.length === 0)) ||
      ((!signerExist || signerExist?.length === 0) && isPlaceholder?.length > 0)
    ) {
      navigate(`/placeHolderSign/${data.objectId}`);
    }
  };

  const handleMenuItemClick = async (selectType, data, deleteType) => {
    switch (selectType) {
      case "Download": {
        await handleDownloadPdf([data]);
        break;
      }
      case "Rename": {
        setRenameValue(data.Name);
        setRename(data.objectId);
        break;
      }
      case "Delete": {
        setIsDeleteDoc({ status: true, deleteType });
        setSelectDoc(data);
        break;
      }
      case "Move": {
        handleMoveDocument(data);
        break;
      }
      default:
        null;
    }
  };
  //function for delete document
  const handleDeleteDocument = withSessionValidation(async (docData) => {
    setIsDeleteDoc({});
    const docId = docData.objectId;
    const data = { IsArchive: true };

    await axios
      .put(
        `${localStorage.getItem("baseUrl")}classes/contracts_Document/${docId}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Parse-Application-Id": localStorage.getItem("parseAppId"),
            "X-Parse-Session-Token": localStorage.getItem("accesstoken")
          }
        }
      )
      .then((result) => {
        const res = result.data;
        if (res) {
          const updatedData = props.pdfData.filter((x) => x.objectId !== docId);
          props.setPdfData(updatedData);
        }
      })
      .catch((err) => {
        console.error("Err in delete doc", err);
        props.setIsAlert({
          isShow: true,
          alertMessage: t("something-went-wrong-mssg")
        });
      });
  });
  const handleMoveDocument = async (docData) => {
    setIsOpenMoveModal(true);
    setSelectDoc(docData);
  };
  //function for move document from one folder to another folder
  const handleMoveFolder = withSessionValidation(async (selectFolderData) => {
    const selecFolderId = selectDoc?.Folder?.objectId;
    const moveFolderId = selectFolderData?.ObjectId;
    let updateDocId = selectDoc?.objectId;
    let updateData;
    const checkExist = moveFolderId
      ? selecFolderId === moveFolderId
        ? true
        : false
      : selecFolderId
        ? false
        : true;
    if (!checkExist) {
      if (moveFolderId) {
        updateData = {
          Folder: {
            __type: "Pointer",
            className: "contracts_Document",
            objectId: moveFolderId
          }
        };
      } else {
        updateData = { Folder: { __op: "Delete" } };
      }

      await axios
        .put(
          `${localStorage.getItem("baseUrl")}classes/contracts_Document/${updateDocId}`,
          updateData,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Parse-Application-Id": localStorage.getItem("parseAppId"),
              "X-Parse-Session-Token": localStorage.getItem("accesstoken")
            }
          }
        )
        .then((Listdata) => {
          const res = Listdata.data;
          if (res) {
            const updatedData = props.pdfData.filter(
              (x) => x.objectId !== updateDocId
            );
            props.setPdfData(updatedData);
          }
        })
        .catch((err) => {
          console.error("err in move folder", err);
        });

      setIsOpenMoveModal(false);
    } else {
      alert(t("folder-already-exist!"));
      setIsOpenMoveModal(false);
    }
  });
  const handleEnterPress = (e, data) => {
    if (e.key === "Enter") {
      handledRenameDoc(data);
    }
  };

  const checkFolderEmpty = async (docData) => {
    let isEmptyFolder = true;
    const query = new Parse.Query("contracts_Document");
    query.equalTo("Folder", {
      __type: "Pointer",
      className: "contracts_Document",
      objectId: docData.objectId
    });
    query.notEqualTo("IsArchive", true);
    const res = await query.find();
    const jsonRes = JSON.parse(JSON.stringify(res));
    if (jsonRes && jsonRes.length > 0) {
      isEmptyFolder = false;
      return isEmptyFolder;
    } else {
      return isEmptyFolder;
    }
  };
  const handleDeleteFolder = async (docData) => {
    setIsDeleteDoc({});
    const isEmptyFolder = await checkFolderEmpty(docData);
    if (isEmptyFolder) {
      const docId = docData?.objectId;
      try {
        const updateQuery = new Parse.Query("contracts_Document");
        const updateObj = await updateQuery.get(docId);
        updateObj.set("IsArchive", true);
        const res = await updateObj.save();
        if (res) {
          const updatedData = props.pdfData.filter((x) => x.objectId !== docId);
          props.setPdfData(updatedData);
        }
      } catch (err) {
        console.error("Err in delete folder", err);
        props.setIsAlert({
          isShow: true,
          alertMessage: t("something-went-wrong-mssg")
        });
      }
    } else {
      alert(t("delete-folder-alert-1"));
    }
  };

  //component to handle type of document and render according to type
  const handleFolderData = (data, ind, listType) => {
    let createddate, status, isDecline, signerExist, isComplete;
    if (data.Type !== "Folder") {
      const expireDate = data.ExpiryDate && data.ExpiryDate.iso;
      const createdDate = data.createdAt && data.createdAt;
      createddate = new Date(createdDate).toLocaleDateString();
      isComplete = data.IsCompleted && data.IsCompleted ? true : false;
      isDecline = data.IsDeclined && data.IsDeclined;
      signerExist = data.Signers && data.Signers;
      const signedUrl = data.SignedUrl;

      const expireUpdateDate = new Date(expireDate).getTime();
      const currDate = new Date().getTime();
      let isExpire = false;
      if (currDate > expireUpdateDate) {
        isExpire = true;
      }

      if (isComplete) {
        status = "Completed";
      } else if (isDecline) {
        status = "Declined";
      } else if (!signedUrl) {
        status = "Draft";
      } else if (isExpire) {
        status = "Expired";
      } else {
        status = "In Progress";
      }
    }

    const signersName = () => {
      const getSignersName =
        signerExist?.length > 0 && signerExist?.map((data) => data?.Name || "");
      const signerName =
        getSignersName?.length > 0 ? getSignersName?.join(", ") : "";

      return (
        <span className="text-[12px] font-medium w-[90%] break-words">
          {signerName && signerName}
        </span>
      );
    };

    return listType === "table" ? (
      data.Type === "Folder" ? (
        <tr onClick={() => handleOnclikFolder(data)}>
          <td className="cursor-pointer flex items-center gap-2">
            <FolderIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{data.Name}</span>
          </td>
          <td>_</td>
          <td>{t("folder")}</td>
          <td>_</td>
          <td>_</td>
        </tr>
      ) : (
        <tr onClick={() => checkPdfStatus(data)}>
          <td className="cursor-pointer flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{data.Name}</span>
          </td>
          <td>{createddate}</td>
          <td>{t("pdf")}</td>
          <td>{t(`drive-document-status.${status}`)}</td>
          <td>
            <i
              onClick={(e) => {
                e.stopPropagation();
                handleMenuItemClick("Download", data);
              }}
              className="fa-light fa-download mr-[8px] op-text-primary cursor-pointer"
              aria-hidden="true"
            ></i>
          </td>
        </tr>
      )
    ) : listType === "list" && data.Type === "Folder" ? (
      <div className="relative w-[100px] h-[100px] mx-2 my-3">
        <ContextMenu.Root>
          <ContextMenu.Trigger className="flex flex-col justify-center items-center select-none-cls">
            {/* folder */}
            <div
              data-tut={props.dataTutSeventh}
              onClick={() => {
                if (!rename) {
                  handleOnclikFolder(data);
                }
              }}
              className="cursor-pointer"
            >
              <FolderIcon className="h-14 w-14" />
              {rename === data.objectId ? (
                <input
                  onFocus={() => {
                    const input = inputRef.current;
                    if (input) {
                      input.select();
                    }
                  }}
                  autoFocus={true}
                  type="text"
                  onBlur={() => handledRenameDoc(data)}
                  onKeyDown={(e) => handleEnterPress(e, data)}
                  ref={inputRef}
                  defaultValue={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="op-input op-input-bordered op-input-xs w-[100px] focus:outline-none hover:border-base-content text-[10px]"
                />
              ) : (
                <span className="fileName select-none-cls">{data.Name}</span>
              )}
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content
              className="ContextMenuContent"
              sideOffset={5}
              align="end"
            >
              <ContextMenu.Item
                onClick={() => handleMenuItemClick("Rename", data)}
                className="ContextMenuItem"
              >
                <i className="fa-light fa-font mr-[8px]"></i>
                <span>{t(`context-menu.Rename`)}</span>
              </ContextMenu.Item>
              <ContextMenu.Item
                onClick={() => handleMenuItemClick("Delete", data, data.Type)}
                className="ContextMenuItem"
              >
                <i className="fa-light fa-trash mr-[8px]"></i>
                <span>{t(`context-menu.Delete`)}</span>
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      </div>
    ) : (
      <HoverCard.Root
        open={rename || isMobile ? false : undefined}
        openDelay={0}
        closeDelay={100}
      >
        <HoverCard.Trigger asChild>
          <div>
            <ContextMenu.Root>
              <div className="relative w-[100px] h-[100px] mx-2 my-3">
                <ContextMenu.Trigger
                  asChild
                  className="flex flex-col justify-center items-center select-none-cls"
                >
                  {/* pdf */}
                  <div
                    data-tut={props.dataTutSixth}
                    onClick={() => {
                      if (!rename) {
                        checkPdfStatus(data);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <FileIcon className="h-14 w-14" />
                    {rename === data.objectId ? (
                      <input
                        autoFocus={true}
                        type="text"
                        onFocus={() => {
                          const input = inputRef.current;
                          if (input) {
                            input.select();
                          }
                        }}
                        onBlur={() => handledRenameDoc(data)}
                        onKeyDown={(e) => handleEnterPress(e, data, data.Type)}
                        ref={inputRef}
                        defaultValue={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="op-input op-input-bordered op-input-xs w-[100px] focus:outline-none hover:border-base-content text-[10px]"
                      />
                    ) : (
                      <span className="fileName select-none-cls">
                        {data.Name}
                      </span>
                    )}
                  </div>
                </ContextMenu.Trigger>
                {status === "Completed" ? (
                  <div className="status-badge completed">
                    <i className="fa-light fa-check-circle"></i>
                  </div>
                ) : status === "Declined" ? (
                  <div className="status-badge declined">
                    <i className="fa-light fa-thumbs-down"></i>
                  </div>
                ) : status === "Expired" ? (
                  <div className="status-badge expired">
                    <i className="fa-light fa-hourglass-end"></i>
                  </div>
                ) : status === "Draft" ? (
                  <div className="status-badge draft">
                    <i className="fa-light fa-file"></i>
                  </div>
                ) : (
                  status === "In Progress" && (
                    <div className="status-badge in-progress">
                      <i className="fa-light fa-paper-plane"></i>
                    </div>
                  )
                )}
              </div>
              <ContextMenu.Portal>
                <ContextMenu.Content
                  className="ContextMenuContent"
                  sideOffset={5}
                  align="end"
                >
                  {contextMenu.map((menu, ind) => {
                    return (
                      <ContextMenu.Item
                        key={ind}
                        onClick={() => handleMenuItemClick(menu.type, data)}
                        className="ContextMenuItem"
                      >
                        <i className={menu.icon}></i>
                        <span className="ml-[8px]">
                          {t(`context-menu.${menu.type}`)}
                        </span>
                      </ContextMenu.Item>
                    );
                  })}
                </ContextMenu.Content>
              </ContextMenu.Portal>
            </ContextMenu.Root>
          </div>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content className="HoverCardContent" sideOffset={5}>
            <strong className="text-[13px]">
              {t("report-heading.Title")}:{" "}
            </strong>
            <span className="text-[12px] font-medium mb-0"> {data.Name}</span>
            <br />
            <strong className="text-[13px]">
              {t("report-heading.Status")}:{" "}
            </strong>
            <span className="text-[12px] font-medium">
              {t(`drive-document-status.${status}`)}
            </span>
            <br />
            <strong className="text-[13px]">
              {t("report-heading.created-date")}:{" "}
            </strong>
            <span className="text-[12px] font-medium">{createddate}</span>
            <br />
            {signerExist && (
              <>
                <strong className="text-[13px]">
                  {t("report-heading.Signers")}:{" "}
                </strong>
                {signersName()}
              </>
            )}
            <HoverCard.Arrow className="HoverCardArrow" />
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>
    );
  };

  //component to handle type of document and render according to type
  return (
    <>
      {props.isList ? (
        <div className="w-full overflow-x-auto px-2">
          <table className="op-table mb-4">
            <thead>
              <tr>
                <th>{t("report-heading.Name")}</th>
                <th>{t("report-heading.created-date")}</th>
                <th>{t("report-heading.Type")}</th>
                <th>{t("report-heading.Status")}</th>
                <th>{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {props?.pdfData?.map((data, ind) => (
                <React.Fragment key={ind}>
                  {handleFolderData(data, ind, "table")}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-row flex-wrap items-center mt-1 pb-[20px] mx-[5px]">
          {props?.pdfData?.map((data, ind) => (
            <React.Fragment key={ind}>
              {handleFolderData(data, ind, "list")}
            </React.Fragment>
          ))}
        </div>
      )}

      {isOpenMoveModal && (
        <FolderModal
          onSuccess={handleMoveFolder}
          isOpenModal={isOpenMoveModal}
          folderCls={"contracts_Document"}
          setIsOpenMoveModal={setIsOpenMoveModal}
          setPdfData={props.setPdfData}
        />
      )}
      <ModalUi
        isOpen={isDeleteDoc.status}
        title={t("delete-document")}
        handleClose={() => setIsDeleteDoc({})}
      >
        <div className="h-full p-[20px] text-base-content">
          {isDeleteDoc.deleteType ? (
            <p>{t("delete-folder-alert")}</p>
          ) : (
            <p>{t("delete-document-alert")}</p>
          )}

          <div className="h-[1px] w-full bg-[#9f9f9f] my-[15px]"></div>
          <button
            onClick={() => {
              if (isDeleteDoc.deleteType) {
                handleDeleteFolder(selectDoc);
              } else {
                handleDeleteDocument(selectDoc);
              }
            }}
            type="button"
            className="op-btn op-btn-primary mr-2"
          >
            {t("yes")}
          </button>
          <button
            onClick={() => setIsDeleteDoc({})}
            type="button"
            className="op-btn op-btn-neutral"
          >
            {t("no")}
          </button>
        </div>
      </ModalUi>
    </>
  );
}

export default memo(DriveBody);
