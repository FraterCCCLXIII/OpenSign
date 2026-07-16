import { useEffect, useState } from "react";
import Parse from "parse";
import { appInfo } from "../constant/appinfo";
import { NavLink, useNavigate } from "react-router";
import {
  getAppLogo,
  openInNewTab,
  saveLanguageInLocal,
  usertimezone
} from "../constant/Utils";
import { useDispatch } from "react-redux";
import { showTenant } from "../redux/reducers/ShowTenant";
import Loader from "../primitives/Loader";
import { useTranslation } from "react-i18next";
import { emailRegex } from "../constant/const";

const AddAdmin = () => {
  const appName =
    "OpenSign™";
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [lengthValid, setLengthValid] = useState(false);
  const [caseDigitValid, setCaseDigitValid] = useState(false);
  const [specialCharValid, setSpecialCharValid] = useState(false);
  const [isAuthorize, setIsAuthorize] = useState(false);
  const [isSubscribeNews, setIsSubscribeNews] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [state, setState] = useState({
    loading: false,
    alertType: "success",
    alertMsg: ""
  });
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  useEffect(() => {
    checkUserExist();
    // eslint-disable-next-line
  }, []);
  const checkUserExist = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const app = await getAppLogo();
      if (app?.error === "invalid_json") {
        setErrMsg(t("server-down", { appName: appName }));
      } else if (app?.user === "exist") {
        setErrMsg(t("admin-exists"));
      }
    } catch (err) {
      setErrMsg(t("something-went-wrong-mssg"));
      console.log("err in check user exist", err);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };
  const clearStorage = async () => {
    try {
      await Parse.User.logOut();
    } catch (err) {
      console.log("Err while logging out", err);
    }
    const baseUrl = localStorage.getItem("baseUrl");
    const appid = localStorage.getItem("parseAppId");
    const applogo = localStorage.getItem("appLogo");
    const defaultmenuid = localStorage.getItem("defaultmenuid");
    const PageLanding = localStorage.getItem("PageLanding");
    const userSettings = localStorage.getItem("userSettings");
    const favicon = localStorage.getItem("favicon");

    localStorage.clear();
    saveLanguageInLocal(i18n);
    localStorage.setItem("baseUrl", baseUrl);
    localStorage.setItem("parseAppId", appid);
    localStorage.setItem("appLogo", applogo);
    localStorage.setItem("defaultmenuid", defaultmenuid);
    localStorage.setItem("PageLanding", PageLanding);
    localStorage.setItem("userSettings", userSettings);
    localStorage.setItem("baseUrl", baseUrl);
    localStorage.setItem("parseAppId", appid);
    localStorage.setItem("favicon", favicon);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!emailRegex.test(email)) {
      alert(t("valid-email-alert"));
    } else {
      if (lengthValid && caseDigitValid && specialCharValid) {
        clearStorage();
        setState({ loading: true });
        const userDetails = {
          name: name,
          email: email?.toLowerCase()?.replace(/\s/g, ""),
          phone: phone,
          company: company,
          jobTitle: jobTitle
        };
        localStorage.setItem("userDetails", JSON.stringify(userDetails));
        try {
          event.preventDefault();
          const user = new Parse.User();
          user.set("name", name);
          user.set("email", email?.toLowerCase()?.replace(/\s/g, ""));
          user.set("password", password);
          user.set("phone", phone);
          user.set("username", email?.toLowerCase()?.replace(/\s/g, ""));
          const userRes = await user.save();
          if (userRes) {
            const params = {
              userDetails: {
                jobTitle: jobTitle,
                company: company,
                name: name,
                email: email?.toLowerCase()?.replace(/\s/g, ""),
                phone: phone,
                role: "contracts_Admin",
                timezone: usertimezone
              }
            };
            try {
              const usersignup = await Parse.Cloud.run("addadmin", params);
              if (usersignup) {
                if (isSubscribeNews) {
                  subscribeNewsletter();
                }
                handleNavigation(userRes.getSessionToken());
              }
            } catch (err) {
              alert(err.message);
              setState({ loading: false });
            }
          }
        } catch (error) {
          console.log("err ", error);
          if (error.code === 202) {
            const params = { email: email };
            const res = await Parse.Cloud.run("getUserDetails", params);
            // console.log("Res ", res);
            if (res) {
              alert(t("already-exists-this-username"));
              setState({ loading: false });
            } else {
              // console.log("state.email ", email);
              try {
                await Parse.User.requestPasswordReset(email).then(
                  async function (res) {
                    if (res.data === undefined) {
                      alert(t("verification-code-sent"));
                    }
                  }
                );
              } catch (err) {
                console.log(err);
              }
              setState({ loading: false });
            }
          } else {
            alert(error.message);
            setState({ loading: false });
          }
        }
      }
    }
  };
  const handleNavigation = async (sessionToken) => {
    const res = await Parse.User.become(sessionToken);
    if (res) {
      const _user = JSON.parse(JSON.stringify(res));
      // console.log("_user ", _user);
      localStorage.setItem("accesstoken", sessionToken);
      localStorage.setItem("UserInformation", JSON.stringify(_user));
      localStorage.setItem("accesstoken", _user.sessionToken);
      if (_user.ProfilePic) {
        localStorage.setItem("profileImg", _user.ProfilePic);
      } else {
        localStorage.setItem("profileImg", "");
      }
      // Check extended class user role and tenentId
      try {
        const userSettings = appInfo.settings;
        const extUser = await Parse.Cloud.run("getUserDetails");
        if (extUser) {
          const IsDisabled = extUser?.get("IsDisabled") || false;
          if (!IsDisabled) {
            const userRole = extUser?.get("UserRole");
            const menu =
              userRole && userSettings.find((menu) => menu.role === userRole);
            if (menu) {
              const _currentRole = userRole;
              const _role = _currentRole.replace("contracts_", "");
              localStorage.setItem("_user_role", _role);
              const extInfo_stringify = JSON.stringify([extUser]);
              localStorage.setItem("Extand_Class", extInfo_stringify);
              const extInfo = JSON.parse(JSON.stringify(extUser));
              localStorage.setItem("userEmail", extInfo?.Email);
              localStorage.setItem("username", extInfo?.Name);
              if (extInfo?.TenantId) {
                const tenant = {
                  Id: extInfo?.TenantId?.objectId || "",
                  Name: extInfo?.TenantId?.TenantName || ""
                };
                localStorage.setItem("TenantId", tenant?.Id);
                dispatch(showTenant(tenant?.Name));
                localStorage.setItem("TenantName", tenant?.Name);
              }
              localStorage.setItem("PageLanding", menu.pageId);
              localStorage.setItem("defaultmenuid", menu.menuId);
              localStorage.setItem("pageType", menu.pageType);
              setState({
                loading: false,
                alertType: "success",
                alertMsg: t("registered-user-successfully")
              });
              navigate(`/${menu.pageType}/${menu.pageId}`);
            } else {
              setState({
                loading: false,
                alertType: "danger",
                alertMsg: t("role-not-found")
              });
            }
          } else {
            setState({
              loading: false,
              alertType: "danger",
              alertMsg: t("do-not-access")
            });
          }
        }
      } catch (error) {
        console.log("error in fetch extuser", error);
        const msg = error.message || t("something-went-wrong-mssg");
        setState({ loading: false, alertType: "danger", alertMsg: msg });
      } finally {
        setTimeout(() => setState({ loading: false, alertMsg: "" }), 2000);
      }
    }
  };
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    // Check conditions separately
    setLengthValid(newPassword.length >= 8);
    setCaseDigitValid(
      /[a-z]/.test(newPassword) &&
        /[A-Z]/.test(newPassword) &&
        /\d/.test(newPassword)
    );
    setSpecialCharValid(/[!@#$%^&*()\-_=+{};:,<.>]/.test(newPassword));
  };
  const subscribeNewsletter = async () => {
    try {
      const params = { name: name, email: email, domain: window.location.host };
      await Parse.Cloud.run("newsletter", params);
      // console.log("newsletter ", newsletter);
    } catch (err) {
      console.log("err in subscribeNewsletter", err);
    }
  };
  return (
    <div className="min-h-screen bg-base-200 flex justify-center items-center p-4">
      {state.loading ? (
        <div className="text-base-content/60 flex justify-center items-center text-lg md:text-2xl">
          <Loader />
        </div>
      ) : (
        <>
          {errMsg ? (
            <div className="text-base-content/60 flex justify-center items-center text-lg md:text-2xl text-center px-4">
              {errMsg}
            </div>
          ) : (
            <div className="w-full max-w-lg">
              <form onSubmit={handleSubmit}>
                <div className="w-full op-card">
                  <div className="pt-6 px-6 text-center">
                    <h2 className="text-3xl font-semibold tracking-tight">
                      {t("opensign-setup", { appName })}
                    </h2>
                    <NavLink
                      to="https://discord.com/invite/xe9TDuyAyj"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm mt-2 text-base-content/70 hover:text-base-content underline-offset-4 hover:underline"
                    >
                      {t("join-discord")}
                      <i
                        aria-hidden="true"
                        className="fa-brands fa-discord ml-1"
                      ></i>
                    </NavLink>
                  </div>
                  <div className="px-6 py-5 space-y-3 text-sm">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        {t("name")}{" "}
                        <span className="text-error text-sm">*</span>
                      </label>
                      <input
                        type="text"
                        className="op-input op-input-bordered w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onInvalid={(e) =>
                          e.target.setCustomValidity(t("input-required"))
                        }
                        onInput={(e) => e.target.setCustomValidity("")}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        {"email"}{" "}
                        <span className="text-error text-sm">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="op-input op-input-bordered w-full"
                        value={email}
                        onChange={(e) =>
                          setEmail(
                            e.target.value?.toLowerCase()?.replace(/\s/g, "")
                          )
                        }
                        onInvalid={(e) =>
                          e.target.setCustomValidity(t("input-required"))
                        }
                        onInput={(e) => e.target.setCustomValidity("")}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        {t("phone")}{" "}
                        <span className="text-error text-sm">*</span>
                      </label>
                      <input
                        type="tel"
                        className="op-input op-input-bordered w-full"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onInvalid={(e) =>
                          e.target.setCustomValidity(t("input-required"))
                        }
                        onInput={(e) => e.target.setCustomValidity("")}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        {t("company")}{" "}
                        <span className="text-error text-sm">*</span>
                      </label>
                      <input
                        type="text"
                        className="op-input op-input-bordered w-full"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        onInvalid={(e) =>
                          e.target.setCustomValidity(t("input-required"))
                        }
                        onInput={(e) => e.target.setCustomValidity("")}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        {t("job-title")}{" "}
                        <span className="text-error text-sm">*</span>
                      </label>
                      <input
                        type="text"
                        className="op-input op-input-bordered w-full"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        onInvalid={(e) =>
                          e.target.setCustomValidity(t("input-required"))
                        }
                        onInput={(e) => e.target.setCustomValidity("")}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        {t("password")}
                        <span className="text-error text-sm">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="op-input op-input-bordered w-full pr-10"
                          name="password"
                          value={password}
                          onChange={(e) => handlePasswordChange(e)}
                          onInvalid={(e) =>
                            e.target.setCustomValidity(t("input-required"))
                          }
                          onInput={(e) => e.target.setCustomValidity("")}
                          required
                        />
                        <span
                          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-base-content/60 hover:text-base-content"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <i className="fa fa-eye-slash" />
                          ) : (
                            <i className="fa fa-eye" />
                          )}
                        </span>
                      </div>
                      {password.length > 0 && (
                        <div className="mt-2 text-xs space-y-0.5">
                          <p
                            className={
                              lengthValid ? "text-success" : "text-error"
                            }
                          >
                            {lengthValid ? "✓" : "✗"} {t("password-length")}
                          </p>
                          <p
                            className={
                              caseDigitValid ? "text-success" : "text-error"
                            }
                          >
                            {caseDigitValid ? "✓" : "✗"} {t("password-case")}
                          </p>
                          <p
                            className={
                              specialCharValid ? "text-success" : "text-error"
                            }
                          >
                            {specialCharValid ? "✓" : "✗"}{" "}
                            {t("password-special-char")}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="pt-1 flex flex-row items-center">
                      <input
                        type="checkbox"
                        className="op-checkbox op-checkbox-sm"
                        id="termsandcondition"
                        checked={isAuthorize}
                        onChange={(e) => setIsAuthorize(e.target.checked)}
                        onInvalid={(e) =>
                          e.target.setCustomValidity(t("input-required"))
                        }
                        onInput={(e) => e.target.setCustomValidity("")}
                        required
                      />
                      <label
                        className="text-sm cursor-pointer ml-2 mb-0"
                        htmlFor="termsandcondition"
                      >
                        {t("agree")}
                      </label>
                      <span
                        className="underline cursor-pointer ml-1 text-sm text-base-content/70"
                        onClick={() =>
                          openInNewTab(
                            "https://www.opensignlabs.com/terms-and-conditions"
                          )
                        }
                      >
                        {t("term")}
                      </span>
                      <span>.</span>
                    </div>
                    <div className="flex flex-row items-center">
                      <input
                        type="checkbox"
                        className="op-checkbox op-checkbox-sm"
                        id="subscribetoopensign"
                        checked={isSubscribeNews}
                        onChange={(e) => setIsSubscribeNews(e.target.checked)}
                      />
                      <label
                        className="text-sm cursor-pointer ml-2 mb-0"
                        htmlFor="subscribetoopensign"
                      >
                        {t("subscribe-to-opensign")}
                      </label>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <button
                      type="submit"
                      className="op-btn op-btn-primary w-full"
                      disabled={state.loading}
                    >
                      {state.loading ? t("loading") : t("next")}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddAdmin;
