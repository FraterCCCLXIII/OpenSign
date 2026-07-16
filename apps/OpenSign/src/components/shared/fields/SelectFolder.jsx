import React, { useEffect, useState } from "react";
import Parse from "parse";
import CreateFolder from "./CreateFolder";
import ModalUi from "../../../primitives/ModalUi";
import Tooltip from "../../../primitives/Tooltip";
import FolderIcon from "../FolderIcon";
import FileIcon from "../FileIcon";
import { useTranslation } from "react-i18next";

const SelectFolder = ({ required, onSuccess, folderCls, isReset }) => {
  const { t } = useTranslation();
  const driveLabel = t("Drive");
  const [isOpen, SetIsOpen] = useState(false);
  const [clickFolder, setClickFolder] = useState("");
  const [selectFolder, setSelectedFolder] = useState({});
  const [folderList, setFolderList] = useState([]);
  const [tabList, setTabList] = useState([]);
  const [isLoader, setIsLoader] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const [isAdd, setIsAdd] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setIsAdd(false);
      setClickFolder({});
      setFolderList([]);
      setTabList([]);
      fetchFolder();
    }
    // eslint-disable-next-line
  }, [isOpen]);
  // below useEffect is used to reset folder selection if user pass isReset = true from parent component
  useEffect(() => {
    if (isReset == true) {
      handleReset();
    }
  }, [isReset]);
  const handleReset = () => {
    setFolderPath({});
    setSelectedFolder("");
    setClickFolder("");
    setIsAdd(false);
    setFolderList([]);
    setTabList([]);
  };
  // `fetchFolder` is used to fetch of folder list created by user on basis of folderPtr or without folderPtr
  const fetchFolder = async (folderPtr) => {
    setIsLoader(true);
    try {
      const FolderQuery = new Parse.Query(folderCls);
      if (folderPtr) {
        FolderQuery.equalTo("Folder", folderPtr);
        FolderQuery.notEqualTo("IsArchive", true);
        FolderQuery.descending("Type");
        FolderQuery.equalTo("CreatedBy", Parse.User.current());
      } else {
        FolderQuery.doesNotExist("Folder");
        FolderQuery.notEqualTo("IsArchive", true);
        FolderQuery.descending("Type");
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
          className: folderCls,
          objectId: item.objectId
        };
        fetchFolder(folderPtr);
      }
    } else {
      setTabList((tabs) => [...tabs, item]);
      const folderPtr = {
        __type: "Pointer",
        className: folderCls,
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
    setFolderPath(url);
    setSelectedFolder(clickFolder);
    if (onSuccess) {
      onSuccess(clickFolder);
    }
    SetIsOpen(false);
  };

  // `handleCancel` is used to clear list of folder, close popup and folderUrl
  const handleCancel = () => {
    SetIsOpen(false);
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
        className: folderCls,
        objectId: list[index].objectId
      };
      fetchFolder(folderPtr);
      setTabList(list);
    } else {
      setClickFolder({});
      setSelectedFolder({});
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
    setFolderList([]);
    if (clickFolder && clickFolder.ObjectId) {
      fetchFolder({
        __type: "Pointer",
        className: folderCls,
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
    <div className="text-xs mt-2 ">
      <div>
        <label className="block">
          {t("select-folder")}
          {required && <span className="text-red-500 text-[13px]">*</span>}
        </label>
      </div>
      <div className="relative max-w-sm">
        <div
          onClick={() => SetIsOpen(true)}
          className="cursor-pointer rounded px-[20px] py-[20px] bg-base-100 border-[1px] border-base-200 shadow flex max-w-sm gap-8 items-center"
        >
          <div>
            <FolderIcon className="h-10 w-10" />
          </div>
          <div className="font-semibold ">
            <div className="flex items-center gap-2">
              <p>
                {selectFolder && selectFolder.Name
                  ? selectFolder.Name
                  : driveLabel}
              </p>
              <div className="text-sm">
                <i
                  className="fa-light fa-pencil cursor-pointer"
                  title={t("select-folder")}
                  aria-hidden="true"
                ></i>
              </div>
            </div>
            <p className="text-[10px] text-gray-400">
              {selectFolder && selectFolder.Name ? `(${folderPath})` : ""}
            </p>
          </div>
        </div>
        <div className="absolute top-2 right-1 cursor-pointer">
          <Tooltip message={t("select-folder-help", { appName: driveLabel })} />
        </div>
      </div>
      <ModalUi
        title={t("select-folder")}
        isOpen={isOpen}
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
          <div className="mb-2">
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
                folderCls={folderCls}
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

export default SelectFolder;
