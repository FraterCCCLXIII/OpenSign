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
    <div className="min-h-screen w-full bg-base-200 text-base-content flex flex-col items-center justify-center p-4 md:p-10">
      {isLoading && (
        <div className="fixed w-full h-full flex justify-center items-center bg-black/30 z-50">
          <Loader />
        </div>
      )}
      {toast?.message && <Alert type={toast.type}>{toast.message}</Alert>}
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("welcome")}
            </h2>
            <p className="mt-2 text-sm text-base-content/60">
              {t("reset-password-alert-3")}
            </p>
          </div>
          <div className="w-full op-card px-6 py-5">
            <label className="block text-sm font-medium mb-1.5">
              {t("email")}
            </label>
            <input
              type="email"
              name="email"
              className="op-input op-input-bordered w-full"
              value={state.email}
              onChange={handleChange}
              onInvalid={(e) =>
                e.target.setCustomValidity(t("input-required"))
              }
              onInput={(e) => e.target.setCustomValidity("")}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button type="submit" className="op-btn op-btn-primary">
              {t("submit")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="op-btn op-btn-outline"
            >
              {t("login")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
