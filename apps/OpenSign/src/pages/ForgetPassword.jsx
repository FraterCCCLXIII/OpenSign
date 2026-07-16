import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Parse from "parse";
import Alert from "../primitives/Alert";
import { appInfo } from "../constant/appinfo";
import { useDispatch } from "react-redux";
import { fetchAppInfo } from "../redux/reducers/infoReducer";
import {
  emailRegex,
} from "../constant/const";
import { useTranslation } from "react-i18next";
import Loader from "../primitives/Loader";

function ForgotPassword() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [state, setState] = useState({ email: "", password: "" });
  const [toast, setToast] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    let { name, value } = event.target;
    if (name === "email") {
      value = value?.toLowerCase()?.replace(/\s/g, "");
    }
    setState({ ...state, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!emailRegex.test(state.email)) {
      alert(t("valid-email-alert"));
    } else {
      setIsLoading(true);
      localStorage.setItem("appLogo", appInfo.applogo);
      localStorage.setItem("userSettings", JSON.stringify(appInfo.settings));
      if (state.email) {
        const username = state.email;
        try {
            await Parse.User.requestPasswordReset(username);
          setToast({ type: "success", message: t("reset-password-alert-1") });
        } catch (err) {
          console.log("err ", err.code);
          setToast({
            type: "danger",
            message: err.message || t("reset-password-alert-2")
          });
        } finally {
          setIsLoading(false);
          setTimeout(() => setToast({ type: "", message: "" }), 1000);
        }
      }
    }
  };

  useEffect(() => {
    dispatch(fetchAppInfo());
    saveLogo();
    // eslint-disable-next-line
  }, []);
  const saveLogo = async () => {
    try {
      await Parse.User.logOut();
    } catch (err) {
      console.log("err while logging out ", err);
    }
  };
  return (
    <div className="min-h-screen w-full bg-base-100 text-base-content">
      {isLoading && (
        <div className="fixed w-full h-full flex justify-center items-center bg-black bg-opacity-30 z-50">
          <Loader />
        </div>
      )}
      {toast?.message && <Alert type={toast.type}>{toast.message}</Alert>}
      <div className="min-h-screen w-full p-4 md:p-10 lg:p-16">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <h2 className="text-[30px] mt-2 md:mt-6">{t("welcome")}</h2>
            <span className="text-[12px] text-[#878787]">
              {t("reset-password-alert-3")}
            </span>
            <div className="w-full my-4 op-card bg-base-100 shadow-md outline outline-1 outline-slate-300/50">
              <div className="px-6 py-4">
                <label className="block text-xs">{t("email")}</label>
                <input
                  type="email"
                  name="email"
                  className="op-input op-input-bordered op-input-sm w-full"
                  value={state.email}
                  onChange={handleChange}
                  onInvalid={(e) =>
                    e.target.setCustomValidity(t("input-required"))
                  }
                  onInput={(e) => e.target.setCustomValidity("")}
                  required
                />
                <hr className="my-2 border-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-center text-xs font-bold">
              <button type="submit" className="op-btn op-btn-primary">
                {t("submit")}
              </button>
              <button
                onClick={() => navigate("/", { replace: true })}
                className="op-btn op-btn-secondary"
              >
                {t("login")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
