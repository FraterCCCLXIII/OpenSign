import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Parse from "parse";
import { useTranslation } from "react-i18next";
import { appInfo } from "../constant/appinfo";
import { emailRegex } from "../constant/const";
import { saveLanguageInLocal } from "../constant/Utils";
import Loader from "../primitives/Loader";
import DocTransitLogo from "../components/DocTransitLogo";
import SelectLanguage from "../components/pdf/SelectLanguage";

const PublicSign = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateid") || searchParams.get("templateId");

  const [template, setTemplate] = useState(null);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const roles = useMemo(
    () => (Array.isArray(template?.PublicRole) ? template.PublicRole : []),
    [template]
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        localStorage.setItem("baseUrl", `${appInfo.baseUrl}/`);
        localStorage.setItem("parseAppId", appInfo.appId);
        localStorage.setItem("isGuestSigner", "true");
        saveLanguageInLocal(i18n);

        if (!templateId) {
          setError(t("public-sign.missing-template"));
          setLoading(false);
          return;
        }

        const res = await Parse.Cloud.run("getpublictemplate", { templateId });
        setTemplate(res);
        if (res?.PublicRole?.length === 1) {
          setRole(res.PublicRole[0]);
        } else if (res?.PublicRole?.length > 1) {
          setRole(res.PublicRole[0]);
        }
      } catch (err) {
        console.error("getpublictemplate", err);
        setError(err?.message || t("public-sign.load-error"));
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "email" ? value.toLowerCase().replace(/\s/g, "") : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name?.trim() || !form.email?.trim()) {
      setError(t("public-sign.name-email-required"));
      return;
    }
    if (!emailRegex.test(form.email)) {
      setError(t("valid-email-alert"));
      return;
    }
    if (roles.length > 1 && !role) {
      setError(t("template-public-alert-3"));
      return;
    }

    try {
      setSubmitting(true);
      const res = await Parse.Cloud.run("startpublicsign", {
        templateId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || "",
        role: role || undefined
      });
      if (res?.signPath) {
        navigate(res.signPath);
        return;
      }
      setError(t("public-sign.start-error"));
    } catch (err) {
      console.error("startpublicsign", err);
      setError(err?.message || t("public-sign.start-error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-base-200 text-base-content flex flex-col items-center justify-center p-4 md:p-10">
      <div className="absolute top-4 right-4">
        <SelectLanguage />
      </div>
      <div className="w-full max-w-md flex flex-col items-center gap-5">
        <DocTransitLogo className="h-6 w-auto" />
        <div className="w-full op-card p-6 md:p-8 space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {template?.Name || t("public-sign.title")}
            </h1>
            <p className="mt-2 text-sm text-base-content/60 leading-relaxed">
              {template?.Description ||
                template?.Note ||
                t("public-sign.subtitle")}
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}

          {template && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="name">
                  {t("public-sign.full-name")}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  className="op-input op-input-bordered w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="email">
                  {t("email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  className="op-input op-input-bordered w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="phone">
                  {t("public-sign.phone-optional")}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className="op-input op-input-bordered w-full"
                />
              </div>
              {roles.length > 1 && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="role">
                    {t("public-role")}
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="op-select op-select-bordered w-full"
                    required
                  >
                    {roles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="op-btn w-full bg-base-content !text-base-100 hover:bg-base-content hover:!text-base-100 border-0"
              >
                {submitting ? t("loading-mssg") : t("public-sign.continue")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicSign;
