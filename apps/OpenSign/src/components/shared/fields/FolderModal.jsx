import React, { useEffect, useState } from "react";
import Parse from "parse";
import CreateFolder from "./CreateFolder";
import ModalUi from "../../../primitives/ModalUi";
import FolderIcon from "../FolderIcon";
import FileIcon from "../FileIcon";
import { useTranslation } from "react-i18next";

const FolderModal = (props) => {
  const { t } = useTranslation();
  const driveLabel = t("Drive");
  const [clickFolder, setClickFolder] = useState("");
  const [folderList, setFolderList] = useState([]);
  const [tabList, setTabList] = useState([]);
  const [isLoader, setIsLoader] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  //   below useEffect is called when user open popup
  useEffect(() => {
    if (props.isOpenModal) {
      fetchFolder();
    }
    // eslint-disable-next-line
  }, [props.isOpenModal]);

  // `fetchFolder` is used to fetch of folder list created by user on basis of folderPtr or without folderPtr
  const fetchFolder = async (folderPtr) => {
    setIsLoader(true);
    try {
      const FolderQuery = new Parse.Query(props.folderCls);
      if (folderPtr) {
        FolderQuery.equalTo("Folder", folderPtr);
        FolderQuery.descending("Type");
        FolderQuery.notEqualTo("IsArchive", true);
        FolderQuery.equalTo("CreatedBy", Parse.User.current());
      } else {
        FolderQuery.doesNotExist("Folder");
        FolderQuery.descending("Type");
        FolderQuery.notEqualTo("IsArchive", true);
        FolderQuery.equalTo("CreatedBy", Parse.User.current());
      }

      const res = await FolderQuery.find();
      if (res) {
        const result = JSON.parse(JSON.stringify(res));
        if (result) {
          setFolderList(result);
          setIsLoader(false);
        }
        setIsLoader(false);
      }
    } catch (error) {
      setIsLoader(false);
    }
  };

  // `handleSelect` is used to save pointer of folder selected by user and it's path in state
  const handleSelect = (item) => {
    setFolderList([]);
    setClickFolder({ ObjectId: item.objectId, Name: item.Name });
    if (tabList.length > 0) {
      const tab = tabList.some((x) => x.objectId === item.objectId);
      if (!tab) {
        setTabList((tabs) => [...tabs, item]);
        const folderPtr = {
          __type: "Pointer",
          className: props.folderCls,
          objectId: item.objectId
        };
        fetchFolder(folderPtr);
      }
    } else {
      setTabList((tabs) => [...tabs, item]);
      const folderPtr = {
        __type: "Pointer",
        className: props.folderCls,
        objectId: item.objectId
      };

      fetchFolder(folderPtr);
    }
  };

  // `handleSubmit` is used to pass folderPtr to parent component
  const handleSubmit = () => {
    let url = driveLabel;
    tabList.forEach((t) => {
      url = url + " / " + t.Name;
    });
    if (props.onSuccess) {
      props.onSuccess(clickFolder);
    }
    // SetIsOpen(false);
    props.setIsOpenMoveModal(false);
  };

  // `handleCancel` is used to clear list of folder, close popup and folderUrl
  const handleCancel = () => {
    // SetIsOpen(false);
    props.setIsOpenMoveModal(false);
    setClickFolder({});
    setFolderList([]);
    setTabList([]);
  };

  // `handleCancel` is call when user click on folder name from path/tab in popup
  const removeTabListItem = async (e, i) => {
    e.preventDefault();

    setIsLoader(true);
    setIsAdd(false);
    if (i !== undefined) {
      setFolderList([]);
      const list = tabList.filter((folder, j) => j <= i && folder);
      const index = list.length - 1;
      const folderPtr = {
        __type: "Pointer",
        className: props.folderCls,
        objectId: list[index].objectId
      };
      setTabList(list);
      fetchFolder(folderPtr);
    } else {
      setClickFolder({});
      setFolderList([]);
      setTabList([]);
      fetchFolder();
    }
  };
  // `handleCreate` is used to open folder creation form in popup
  const handleCreate = () => setIsAdd(true);
  const handleBack = () => setIsAdd(false);
  // `handleAddFolder` is call when user folder created successfully and it fetch folder list on the basis of folderPtr or without folderPtr
  const handleAddFolder = (newFolder) => {
    props.setPdfData((prev) => [...prev, newFolder]);
    if (clickFolder && clickFolder.ObjectId) {
      fetchFolder({
        __type: "Pointer",
        className: props.folderCls,
        objectId: newFolder.objectId // clickFolder.ObjectId
      });
    } else {
      fetchFolder();
    }
    setClickFolder({ ObjectId: newFolder.objectId, Name: newFolder.Name });
    setTabList((prev) => [...prev, newFolder]);
    handleBack();
  };
  return (
    <div className="text-xs mt-2">
      <ModalUi
        title={t("select-folder")}
        isOpen={props.isOpenModal}
        handleClose={handleCancel}
      >
        <div className="w-full min-w-[300px] md:min-w-[500px] max-w-[500px] px-3">
          <div className="pt-1 text-base-content/70 text-sm font-medium">
            <span
              className="cursor-pointer"
              title={driveLabel}
              onClick={(e) => removeTabListItem(e)}
            >
              {driveLabel} /{" "}
            </span>
            {tabList &&
              tabList.map((tab, i) => (
                <React.Fragment key={`${tab.objectId}-${i}`}>
                  <span
                    className="cursor-pointer"
                    title={tab.Name}
                    onClick={(e) => removeTabListItem(e, i)}
                  >
                    {tab.Name}
                  </span>
                  {" / "}
                </React.Fragment>
              ))}
            <hr className="bg-[#8a8a8a] mt-[0.750rem]" />
          </div>
          <div className={`${!isAdd ? "mb-3" : ""} mt-2`}>
            {!isAdd && (
              <div className="max-h-[210px] overflow-auto">
                {folderList.length > 0
                  ? folderList.map((folder) => (
                      <div
                        key={folder.objectId}
                        className={`${
                          folder.Type === "Folder"
                            ? "cursor-pointer"
                            : "cursor-default"
                        } border-b-[1px] border-[#8a8a8a] py-2 mb-0.5"`}
                        onClick={() =>
                          folder.Type === "Folder" && handleSelect(folder)
                        }
                      >
                        <div className="flex items-center gap-2">
                          {folder.Type === "Folder" ? (
                            <FolderIcon className="h-5 w-5" />
                          ) : (
                            <FileIcon className="h-5 w-5" />
                          )}
                          <span className="font-semibold">{folder.Name}</span>
                        </div>
                      </div>
                    ))
                  : !isLoader && (
                      <div className="text-base-content text-center my-2">
                        {t("no-data")}
                      </div>
                    )}
              </div>
            )}
            {isAdd && (
              <CreateFolder
                parentFolderId={clickFolder && clickFolder.ObjectId}
                folderCls={props.folderCls}
                onSuccess={handleAddFolder}
                onBack={handleBack}
              />
            )}
            {isLoader && (
              <div className="flex justify-center my-4">
                <i className="fa-light fa-spinner fa-spin-pulse text-[30px]"></i>
              </div>
            )}
          </div>
        </div>
        <hr />
        {!isAdd && (
          <div className="flex justify-between items-center py-[.75rem] px-[1.25rem]">
            <div
              className="op-btn op-btn-primary op-btn-sm"
              title={t("save-here")}
              onClick={handleSubmit}
            >
              <i className="fa-light fa-save" aria-hidden="true"></i>
              {t("save-here")}
            </div>
            <div
              className="op-btn op-btn-seconday op-btn-sm"
              title={t("add-folder")}
              onClick={handleCreate}
            >
              <i className="fa-light fa-square-plus" aria-hidden="true"></i>
              <span className="">{t("add-folder")}</span>
            </div>
          </div>
        )}
      </ModalUi>
    </div>
  );
};

export default FolderModal;
