import React, {
  useState,
  useEffect,
} from "react";
import { Navigate, useNavigate } from "react-router";
import Parse from "parse";
import { SaveFileSize } from "../constant/saveFileSize";
import dp from "../assets/images/dp.png";
import {
  compressImage,
  sanitizeFileName,
  withSessionValidation
} from "../utils";
import axios from "axios";
import Tooltip from "../primitives/Tooltip";
import {
  getSecureUrl,
  handleSendOTP
} from "../constant/Utils";
import ModalUi from "../primitives/ModalUi";
import Loader from "../primitives/Loader";
import { useTranslation } from "react-i18next";
import SelectLanguage from "../components/pdf/SelectLanguage";

function UserProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  let UserProfile =
    localStorage.getItem("UserInformation") &&
    JSON.parse(localStorage.getItem("UserInformation"));
  let extendUser =
    localStorage.getItem("Extand_Class") &&
    JSON.parse(localStorage.getItem("Extand_Class"));
  const [parseBaseUrl] = useState(localStorage.getItem("baseUrl"));
  const [parseAppId] = useState(localStorage.getItem("parseAppId"));
  const [editmode, setEditMode] = useState(false);
  const [name, SetName] = useState(localStorage.getItem("username"));
  const [Phone, SetPhone] = useState(UserProfile && UserProfile.phone);
  const [Image, setImage] = useState(localStorage.getItem("profileImg"));
  const [isLoader, setIsLoader] = useState(false);
  const [percentage, setpercentage] = useState(0);
  const [company, setCompany] = useState(
    extendUser && extendUser?.[0]?.Company
  );
  const [jobTitle, setJobTitle] = useState(
    extendUser && extendUser?.[0]?.JobTitle
  );
  const [isVerifyModal, setIsVerifyModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoader, setOtpLoader] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isdeleteModal, setIsdeleteModal] = useState(false);
  const [deleteUserRes, setDeleteUserRes] = useState("");
  const [isDelLoader, setIsDelLoader] = useState(false);
  useEffect(() => {
    getUserDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const getUserDetail = async () => {
    setIsLoader(true);
    const currentUser = JSON.parse(JSON.stringify(Parse.User.current()));
    let isEmailVerified = currentUser?.emailVerified || false;
    if (isEmailVerified) {
      setIsEmailVerified(isEmailVerified);
      setIsLoader(false);
    } else {
      try {
        const userQuery = new Parse.Query(Parse.User);
        const user = await userQuery.get(currentUser.objectId, {
          sessionToken: localStorage.getItem("accesstoken")
        });
        if (user) {
          isEmailVerified = user?.get("emailVerified");
          setIsEmailVerified(isEmailVerified);
          setIsLoader(false);
        }
      } catch (e) {
        alert(t("something-went-wrong-mssg"));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let phn = Phone,
      res = "";
    if (!res) {
      setIsLoader(true);
      try {
        const userQuery = Parse.Object.extend("_User");
        const query = new Parse.Query(userQuery);
        await query.get(UserProfile.objectId).then((object) => {
          object.set("name", name);
          object.set("ProfilePic", Image);
          object.set("phone", phn || "");
          object.save().then(
            async (response) => {
              if (response) {
                let res = response.toJSON();
                let rr = JSON.stringify(res);
                localStorage.setItem("UserInformation", rr);
                SetName(res.name);
                SetPhone(res?.phone || "");
                setImage(res.ProfilePic);
                localStorage.setItem("username", res.name);
                localStorage.setItem("profileImg", res.ProfilePic);
                await updateExtUser({
                  Name: res.name,
                  Phone: res?.phone || ""
                });
                alert(t("profile-update-alert"));
                setEditMode(false);
                setIsLoader(false);
                //navigate("/dashboard/35KBoSgoAK");
              }
            },
            (error) => {
              alert(t("something-went-wrong-mssg"));
              console.error("Error while updating tour", error);
              setIsLoader(false);
            }
          );
        });
      } catch (error) {
        console.log("err", error);
      }
    }
  };

  //  `updateExtUser` is used to update user details in extended class
  const updateExtUser = withSessionValidation(async (obj) => {
    try {
      const extData = JSON.parse(localStorage.getItem("Extand_Class"));
      const ExtUserId = extData?.[0]?.objectId;
      const body = {
        Phone: obj?.Phone || "",
        Name: obj.Name,
        JobTitle: jobTitle,
        Company: company,
        Language: obj?.language || "",
      };

      await axios.put(
        parseBaseUrl + "classes/contracts_Users/" + ExtUserId,
        body,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Parse-Application-Id": parseAppId,
            "X-Parse-Session-Token": localStorage.getItem("accesstoken")
          }
        }
      );
      const res = await Parse.Cloud.run("getUserDetails");

      const json = JSON.parse(JSON.stringify([res]));
      const extRes = JSON.stringify(json);
      localStorage.setItem("Extand_Class", extRes);
    } catch (err) {
      console.log("error in save data in contracts_Users class", err);
    }
  });
  // file upload function
  const fileUpload = async (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const compressedfile = await compressImage(
        file,
        { width: 200, height: 200 },
        "file"
      );
      await handleFileUpload(compressedfile);
    }
  };

  const handleFileUpload = async (file) => {
    const size = file.size;
    const pdfFile = file;
    const fileName = file.name;
    const name = sanitizeFileName(fileName);
    const parseFile = new Parse.File(name, pdfFile);

    try {
      const response = await parseFile.save({
        progress: (progressValue, loaded, total) => {
          if (progressValue !== null) {
            const percentCompleted = Math.round((loaded * 100) / total);
            // console.log("percentCompleted ", percentCompleted);
            setpercentage(percentCompleted);
          }
        }
      });
      // // The response object will contain information about the uploaded file
      // console.log("File uploaded:", response);

      if (response?.url()) {
        const fileRes = await getSecureUrl(response?.url());
        if (fileRes?.url) {
          setImage(fileRes?.url);
          setpercentage(0);
          const tenantId = localStorage.getItem("TenantId");
          const userId = extendUser?.[0]?.UserId?.objectId;
          SaveFileSize(size, fileRes?.url, tenantId, userId);
          return fileRes?.url;
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  if (
    localStorage.getItem("accesstoken") === null &&
    localStorage.getItem("pageType") === null
  ) {
    let _redirect = `/`;
    return <Navigate to={_redirect} />;
  }

  //`handleVerifyBtn` function is used to send otp on user mail
  const handleVerifyBtn = async () => {
    setIsVerifyModal(true);
    await handleSendOTP(Parse.User.current().getEmail());
  };
  const handleCloseVerifyModal = async () => {
    setIsVerifyModal(false);
  };
  //`handleVerifyEmail` function is used to verify email with otp
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setOtpLoader(true);
    try {
      const resEmail = await Parse.Cloud.run("verifyemail", {
        otp: otp,
        email: Parse.User.current().getEmail()
      });
      if (resEmail?.message === "Email is verified.") {
        setIsEmailVerified(true);
        alert(t("Email-verified-alert-1"));
      } else if (resEmail?.message === "Email is already verified.") {
        setIsEmailVerified(true);
        alert(t("Email-verified-alert-2"));
      }
      setOtp("");
      setIsVerifyModal(false);
    } catch (error) {
      alert(error.message);
    } finally {
      setOtpLoader(false);
    }
  };
  //function to use resend otp for email verification
  const handleResend = async (e) => {
    e.preventDefault();
    setOtpLoader(true);
    await handleSendOTP(Parse.User.current().getEmail());
    setOtpLoader(false);
    alert(t("otp-sent-alert"));
  };

  const handleCancel = () => {
    setEditMode(false);
    SetName(localStorage.getItem("username"));
    SetPhone(UserProfile && UserProfile.phone);
    setImage(localStorage.getItem("profileImg"));
    setCompany(extendUser && extendUser?.[0]?.Company);
    setJobTitle(extendUser?.[0]?.JobTitle);
  };

  const handleDeleteAccountBtn = () => {
    const isAdmin = extendUser?.[0]?.UserRole === "contracts_Admin";
    if (!isAdmin) {
      setDeleteUserRes(t("delete-action-prohibited"));
    }
    setIsdeleteModal(true);
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setIsDelLoader(true);
    try {
      await Parse.Cloud.run("senddeleterequest", {
        userId: Parse.User.current().id
      });
      setDeleteUserRes(t("account-deletion-request-sent-via-mail"));
    } catch (err) {
      setDeleteUserRes(err.message);
      console.log("Err in deleteuser acc", err);
    } finally {
      setIsDelLoader(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsdeleteModal(false);
    setDeleteUserRes("");
  };

  return (
    <React.Fragment>
      {isLoader ? (
        <div className="h-[100vh] flex justify-center items-center">
          <Loader />
        </div>
      ) : (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-lg op-card bg-base-100 text-base-content">
            <div className="flex flex-col items-center px-6 pt-8 pb-6 border-b border-base-300">
              {editmode && (
                <input
                  type="file"
                  className="op-file-input op-file-input-bordered op-file-input-sm max-w-[270px] text-sm"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={fileUpload}
                />
              )}
              {percentage !== 0 && (
                <div className="flex items-center gap-x-2 mt-3 w-full max-w-[270px]">
                  <div className="h-1.5 rounded-full flex-1 bg-base-300">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-base-content/60 text-sm shrink-0">
                    {percentage}%
                  </span>
                </div>
              )}
              <div className={`text-center ${editmode || percentage !== 0 ? "mt-4" : ""}`}>
                <div className="text-lg font-semibold tracking-tight">
                  {localStorage.getItem("username")}
                </div>
                <div className="text-sm text-base-content/60 mt-0.5">
                  {localStorage.getItem("_user_role")}
                </div>
              </div>
            </div>

            <div className="px-6 py-2 divide-y divide-base-300">
              <div
                className={`flex justify-between items-center gap-4 break-all ${
                  editmode ? "py-3" : "py-3.5"
                }`}
              >
                <span className="text-sm font-medium text-base-content/70 shrink-0">
                  {t("name")}
                </span>
                {editmode ? (
                  <input
                    type="text"
                    value={name}
                    className="op-input op-input-bordered w-full max-w-[220px]"
                    onChange={(e) => SetName(e.target.value)}
                  />
                ) : (
                  <span className="text-sm text-right">
                    {localStorage.getItem("username")}
                  </span>
                )}
              </div>

              <div
                className={`flex justify-between items-center gap-4 break-all ${
                  editmode ? "py-3" : "py-3.5"
                }`}
              >
                <span className="text-sm font-medium text-base-content/70 shrink-0">
                  {t("phone")}
                </span>
                {editmode ? (
                  <input
                    type="text"
                    className="op-input op-input-bordered w-full max-w-[220px]"
                    onChange={(e) => SetPhone(e.target.value)}
                    value={Phone}
                  />
                ) : (
                  <span className="text-sm text-right">
                    {UserProfile && UserProfile.phone}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center gap-4 py-3.5 break-all">
                <span
                  data-tooltip-id="email-tooltip"
                  className="text-sm font-medium text-base-content/70 flex gap-1 items-center shrink-0"
                >
                  {t("email")}
                  {editmode && (
                    <Tooltip
                      message={t("email-help")}
                      maxWidth="max-w-[250px]"
                    />
                  )}
                </span>
                <span className="text-sm text-right">
                  {UserProfile && UserProfile.email}
                </span>
              </div>

              <div
                className={`flex justify-between items-center gap-4 break-all ${
                  editmode ? "py-3" : "py-3.5"
                }`}
              >
                <span className="text-sm font-medium text-base-content/70 shrink-0">
                  {t("company")}
                </span>
                {editmode ? (
                  <input
                    type="text"
                    value={company}
                    className="op-input op-input-bordered w-full max-w-[220px]"
                    onChange={(e) => setCompany(e.target.value)}
                  />
                ) : (
                  <span className="text-sm text-right">
                    {extendUser?.[0].Company}
                  </span>
                )}
              </div>

              <div
                className={`flex justify-between items-center gap-4 break-all ${
                  editmode ? "py-3" : "py-3.5"
                }`}
              >
                <span className="text-sm font-medium text-base-content/70 shrink-0">
                  {t("job-title")}
                </span>
                {editmode ? (
                  <input
                    type="text"
                    value={jobTitle}
                    className="op-input op-input-bordered w-full max-w-[220px]"
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                ) : (
                  <span className="text-sm text-right">
                    {extendUser?.[0]?.JobTitle}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center gap-4 py-3.5 break-all">
                <span className="text-sm font-medium text-base-content/70 shrink-0">
                  {t("is-email-verified")}
                </span>
                <span className="text-sm text-right">
                  {isEmailVerified ? (
                    <span className="inline-flex items-center rounded-md bg-success/10 text-success px-2 py-0.5 text-xs font-medium">
                      {t("verified")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-flex items-center rounded-md bg-warning/10 text-warning px-2 py-0.5 text-xs font-medium">
                        {t("not-verified")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleVerifyBtn()}
                        className="text-sm text-base-content/70 hover:text-base-content underline-offset-4 hover:underline"
                      >
                        {t("verify")}
                      </button>
                    </span>
                  )}
                </span>
              </div>

              <div
                className={`flex justify-between items-center gap-4 break-all ${
                  editmode ? "py-3" : "py-3.5"
                }`}
              >
                <span className="text-sm font-medium text-base-content/70 shrink-0">
                  {t("language")}
                </span>
                <SelectLanguage
                  isProfile={true}
                  updateExtUser={updateExtUser}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-center gap-2 px-6 py-5 border-t border-base-300">
              <button
                type="button"
                onClick={(e) => {
                  editmode ? handleSubmit(e) : setEditMode(true);
                }}
                className="op-btn op-btn-primary w-full sm:w-auto min-w-[120px]"
              >
                {editmode ? t("save") : t("edit")}
              </button>
              <button
                type="button"
                onClick={() =>
                  editmode ? handleCancel() : navigate("/changepassword")
                }
                className={`op-btn w-full sm:w-auto min-w-[120px] ${
                  editmode ? "op-btn-ghost" : "op-btn-outline"
                }`}
              >
                {editmode ? t("cancel") : t("change-password")}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAccountBtn()}
                className="text-sm text-error/80 hover:text-error underline-offset-4 hover:underline mt-1 sm:mt-0 sm:ml-2"
              >
                {t("delete-account")}
              </button>
            </div>
          </div>

          {isdeleteModal && (
            <ModalUi
              isOpen
              title={t("delete-account")}
              handleClose={handleCloseDeleteModal}
            >
              {isDelLoader ? (
                <div className="h-[100px] flex justify-center items-center">
                  <Loader />
                </div>
              ) : (
                <>
                  {deleteUserRes ? (
                    <div className="h-[100px] p-5 flex justify-center items-center text-base-content text-sm md:text-base">
                      {deleteUserRes}
                    </div>
                  ) : (
                    <form onSubmit={(e) => handleDeleteAccount(e)}>
                      <div className="px-6 py-4 text-base-content text-sm md:text-base">
                        {t("delete-account-que")}
                      </div>
                      <div className="px-6 mb-4 flex gap-2">
                        <button
                          type="submit"
                          className="op-btn op-btn-primary min-w-[100px]"
                        >
                          {t("yes")}
                        </button>
                        <button
                          type="button"
                          className="op-btn op-btn-outline min-w-[100px]"
                          onClick={handleCloseDeleteModal}
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </ModalUi>
          )}
          {isVerifyModal && (
            <ModalUi
              isOpen
              title={t("otp-verification")}
              handleClose={handleCloseVerifyModal}
            >
              {otpLoader ? (
                <div className="h-[150px] flex justify-center items-center">
                  <Loader />
                </div>
              ) : (
                <form onSubmit={(e) => handleVerifyEmail(e)}>
                  <div className="px-6 py-4 text-base-content space-y-2">
                    <label className="block text-sm font-medium">
                      {t("enter-otp")}
                    </label>
                    <input
                      onInvalid={(e) =>
                        e.target.setCustomValidity(t("input-required"))
                      }
                      onInput={(e) => e.target.setCustomValidity("")}
                      required
                      type="tel"
                      pattern="[0-9]{4}"
                      className="w-full op-input op-input-bordered"
                      placeholder={t("otp-placeholder")}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <div className="px-6 mb-4 flex gap-2">
                    <button type="submit" className="op-btn op-btn-primary">
                      {t("verify")}
                    </button>
                    <button
                      type="button"
                      className="op-btn op-btn-outline"
                      onClick={(e) => handleResend(e)}
                    >
                      {t("resend")}
                    </button>
                  </div>
                </form>
              )}
            </ModalUi>
          )}
        </div>
      )}
    </React.Fragment>
  );
}

export default UserProfile;
