import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FilePenLine, Send, LayoutTemplate, BookUser, ChevronRight } from "lucide-react";

const CREATE_OPTIONS = [
  {
    id: "sign-yourself",
    titleKey: "sidebar.Sign yourself",
    descriptionKey: "signyour-self-button",
    icon: FilePenLine,
    to: "/form/sHAnZphf69"
  },
  {
    id: "request-signatures",
    titleKey: "sidebar.Request signatures",
    descriptionKey: "requestsign-button",
    icon: Send,
    to: "/form/8mZzFxbG1z"
  },
  {
    id: "create-template",
    titleKey: "sidebar.Templates-Children.Create template",
    descriptionKey: "create-new.create-template-description",
    icon: LayoutTemplate,
    to: "/form/template"
  },
  {
    id: "add-contact",
    titleKey: "add-contact",
    descriptionKey: "create-new.add-contact-description",
    icon: BookUser,
    to: "/report/contacts"
  }
];

const CreateNew = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-base-content">
          {t("create-new.title")}
        </h1>
        <p className="mt-2 text-sm text-base-content/60">
          {t("create-new.subtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" role="list">
        {CREATE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              role="listitem"
              onClick={() => navigate(option.to)}
              className="group flex w-full items-start gap-4 rounded-lg border border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-base-content/20 hover:bg-base-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-content/20"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-base-200 text-base-content">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-base-content">
                    {t(option.titleKey)}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-base-content/30 transition-transform group-hover:translate-x-0.5 group-hover:text-base-content/60"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-base-content/60">
                  {t(option.descriptionKey)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CreateNew;
