/**
 * DocTransit system email catalog for local design review.
 *
 * Shared shell: grey page background, DocTransit wordmark above a white
 * rounded card, normalized typography, and www-style blue CTAs (#2563eb).
 * Content mirrors each production email type with mock data filled in.
 */

const APP_NAME = "DocTransit";
const WWW_URL = "https://www.doctransit.com";
const SUPPORT_URL = `${WWW_URL}/support`;
const COPYRIGHT_YEAR = 2026;

/** Transparent PNG wordmark (RGBA); fall back to www SVG. */
const LOGO =
  (typeof window !== "undefined" && window.location?.origin
    ? `${window.location.origin}/doctransit_logo.png?v=transparent`
    : null) || "https://www.doctransit.com/doctransit_logo.svg";

const COLORS = {
  pageBg: "#f4f4f4",
  cardBg: "#ffffff",
  cardBorder: "#e0e0e0",
  ink: "#333333",
  inkStrong: "#111827",
  muted: "#777777",
  mutedSoft: "#999999",
  accent: "#2563eb",
  danger: "#d9534f",
  codeBg: "#f8fafc",
  codeBorder: "#e9ecf1"
};

const FONT =
  "'Sora', 'Segoe UI', Helvetica, Arial, sans-serif";

const MOCK = {
  senderName: "Alex Morgan",
  senderMail: "alex.morgan@acme.com",
  senderPhone: "+1 (555) 010-2000",
  receiverName: "Jordan Lee",
  receiverEmail: "jordan.lee@example.com",
  organization: "Acme Corp",
  documentTitle: "Master Services Agreement",
  note: "Please review sections 3–5 before signing.",
  expiryDate: "August 15, 2026",
  signingUrl: "https://app.doctransit.com/login/preview-signing-url",
  viewDocUrl: "https://app.doctransit.com/recipientSignPdf/abc123",
  otp4: "4821",
  otp6: "739104",
  deleteUrl: "https://api.doctransit.com/delete-account/user123",
  username: "jordan.lee@example.com",
  resetLink: "https://app.doctransit.com/reset-password?token=preview",
  verifyLink: "https://app.doctransit.com/verify-email?token=preview",
  declineReason: "Terms in section 4 need revision before I can sign."
};

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

/**
 * Primary CTA matching www `.btn.btn-primary` (8px radius, #2563eb).
 */
function btn(href, label, { background = COLORS.accent } = {}) {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:${background};color:#ffffff;border-radius:8px;padding:11px 18px;font-family:${FONT};font-size:16px;font-weight:600;text-decoration:none;line-height:1.2;">${label}</a>`;
}

function p(html, extra = "") {
  return `<p style="margin:0 0 16px 0;font-family:${FONT};font-size:16px;line-height:1.5;color:${COLORS.ink};${extra}">${html}</p>`;
}

function h2(text, color = COLORS.inkStrong) {
  return `<h2 style="margin:0 0 16px 0;font-family:${FONT};font-size:20px;font-weight:600;line-height:1.3;color:${color};">${text}</h2>`;
}

function muted(html) {
  return `<p style="margin:0 0 12px 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${COLORS.muted};">${html}</p>`;
}

function metaRow(label, value) {
  return `<tr>
    <td style="padding:6px 16px 6px 0;font-family:${FONT};font-size:15px;font-weight:600;color:${COLORS.inkStrong};vertical-align:top;white-space:nowrap;">${label}</td>
    <td style="padding:6px 0;font-family:${FONT};font-size:15px;font-weight:500;color:${COLORS.muted};vertical-align:top;">${value}</td>
  </tr>`;
}

/**
 * Shared footer for every email — support link + copyright, below the card.
 */
function standardFooter() {
  return `<div style="margin:16px 0 0 0;text-align:center;">
<p style="margin:0 0 8px 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${COLORS.mutedSoft};">
  Need help? <a href="${SUPPORT_URL}" target="_blank" rel="noopener noreferrer" style="color:${COLORS.accent};text-decoration:none;">Visit Support</a>
</p>
<p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.5;color:${COLORS.mutedSoft};">
  &copy; ${COPYRIGHT_YEAR} ${APP_NAME}. All rights reserved.
</p>
</div>`;
}

/**
 * Shared DocTransit email chrome: logo above a rounded white card on grey.
 * Every message ends with the same support + copyright footer below the card.
 */
function emailDocument({ title, innerHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.pageBg};font-family:${FONT};color:${COLORS.ink};">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin:0 0 20px 0;">
      <a href="${WWW_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;border:0;">
        <img src="${LOGO}" alt="${APP_NAME}" width="180" height="26" style="display:inline-block;height:26px;width:auto;border:0;outline:none;" />
      </a>
    </div>
    <div style="background-color:${COLORS.cardBg};border:1px solid ${COLORS.cardBorder};border-radius:8px;padding:30px;">
      ${innerHtml}
    </div>
    ${standardFooter()}
  </div>
</body>
</html>`;
}

function makeEmail(subject, innerHtml, extras = {}) {
  const { note, ...rest } = extras;
  return {
    subject,
    body: emailDocument({ title: subject, innerHtml }),
    ...(note ? { note } : {}),
    ...rest
  };
}

// ---------------------------------------------------------------------------
// Signature request — branded default
// ---------------------------------------------------------------------------

const signatureRequestBranded = makeEmail(
  `${MOCK.senderName} has requested you to sign "${MOCK.documentTitle}"`,
  [
    h2("Digital signature request"),
    p(
      `${MOCK.senderName} has requested you to review and sign <strong>${MOCK.documentTitle}</strong>.`
    ),
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;border-collapse:collapse;">
      ${metaRow("Sender", MOCK.senderMail)}
      ${metaRow("Organization", MOCK.organization)}
      ${metaRow("Expires on", MOCK.expiryDate)}
      ${metaRow("Note", MOCK.note)}
    </table>`,
    `<p style="margin:0;text-align:center;">${btn(MOCK.signingUrl, "Sign here")}</p>`
  ].join("")
);

// ---------------------------------------------------------------------------
// Signature request — customizable default
// ---------------------------------------------------------------------------

const signatureRequestCustomizable = makeEmail(
  `${MOCK.senderName} has requested you to sign ${MOCK.documentTitle}`,
  [
    h2("Signature requested"),
    p(`Hi ${MOCK.receiverName},`),
    p(
      `${MOCK.senderName} has requested you to review and sign <strong>${MOCK.documentTitle}</strong>.`
    ),
    p(
      "Your signature confirms your agreement and is needed to continue."
    ),
    `<p style="margin:0;text-align:center;">${btn(MOCK.signingUrl, "Sign here")}</p>`
  ].join("")
);

// ---------------------------------------------------------------------------
// Completion — branded
// ---------------------------------------------------------------------------

const completionBranded = makeEmail(
  `Document "${MOCK.documentTitle}" has been signed by all parties`,
  [
    h2("Document signed successfully"),
    p(
      `All parties have signed <strong>${MOCK.documentTitle}</strong>. Download the signed document from the attachment.`
    )
  ].join(""),
  { note: "Sends with signed PDF + certificate attachments." }
);

// ---------------------------------------------------------------------------
// Completion — customizable default
// ---------------------------------------------------------------------------

const completionCustomizable = makeEmail(
  `Document ${MOCK.documentTitle} has been signed by all parties`,
  [
    h2("Document complete"),
    p(`Hi ${MOCK.senderName},`),
    p(
      `All parties have signed <strong>${MOCK.documentTitle}</strong>. Download the signed document from the attachment.`
    )
  ].join(""),
  { note: "Sends with signed PDF + certificate attachments." }
);

// ---------------------------------------------------------------------------
// Partial sign notification
// ---------------------------------------------------------------------------

const partialSign = makeEmail(
  `Document "${MOCK.documentTitle}" has been signed by ${MOCK.receiverName}`,
  [
    h2(`Document signed by ${MOCK.receiverName}`),
    p(`Hi ${MOCK.senderName},`),
    p(
      `<strong>${MOCK.documentTitle}</strong> was signed by ${MOCK.receiverName} (${MOCK.receiverEmail}).`
    ),
    `<p style="margin:0;text-align:center;">${btn(MOCK.viewDocUrl, "View document")}</p>`
  ].join(""),
  { note: "Sent to document owner when NotifyOnSignatures is enabled." }
);

// ---------------------------------------------------------------------------
// Document declined
// ---------------------------------------------------------------------------

const declined = makeEmail(
  `Document "${MOCK.documentTitle}" has been declined by ${MOCK.receiverName}`,
  [
    h2(`Document declined by ${MOCK.receiverName}`),
    p(`Hi ${MOCK.senderName},`),
    p(
      `<strong>${MOCK.documentTitle}</strong> was declined by ${MOCK.receiverName} (${MOCK.receiverEmail}) on ${new Date("2026-07-16").toLocaleDateString()}.`
    ),
    p(`<strong>Decline reason:</strong> ${MOCK.declineReason}`),
    `<p style="margin:0;text-align:center;">${btn(MOCK.viewDocUrl, "View document")}</p>`
  ].join("")
);

// ---------------------------------------------------------------------------
// Forward document copy
// ---------------------------------------------------------------------------

const forwardCopy = makeEmail(
  `${MOCK.senderName} has signed the doc - ${MOCK.documentTitle}`,
  [
    h2("Document copy"),
    p(
      `A copy of <strong>${MOCK.documentTitle}</strong> is attached. Download it from the attachment.`
    )
  ].join(""),
  { note: "Sends with signed PDF attachment." }
);

// ---------------------------------------------------------------------------
// OTP for signing / guest login
// ---------------------------------------------------------------------------

const signingOtp = makeEmail(
  `Your ${APP_NAME} OTP`,
  [
    h2("OTP verification"),
    p(`Your ${APP_NAME} verification code is:`),
    `<p style="margin:8px 0 16px 0;text-align:center;font-family:Consolas,'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:${COLORS.accent};">${MOCK.otp4}</p>`,
    muted("Enter this code to continue. It expires shortly.")
  ].join(""),
  { note: "Uses Parse.Cloud.sendEmail." }
);

// ---------------------------------------------------------------------------
// Account deletion request
// ---------------------------------------------------------------------------

const accountDeletionRequest = makeEmail(
  `Account Deletion Request for ${MOCK.username} – ${APP_NAME}`,
  [
    h2("Request to delete your account", COLORS.danger),
    p(`Hi ${MOCK.receiverName},`),
    p(
      `We received a request to permanently delete your ${APP_NAME} account associated with <strong>${MOCK.username}</strong>.`
    ),
    p(
      "If you did not make this request, you can ignore this email. Otherwise, confirm below to continue."
    ),
    `<p style="margin:8px 0 24px 0;text-align:center;">${btn(MOCK.deleteUrl, "Confirm account deletion")}</p>`,
    muted(
      `If the button doesn’t work, open this link: <a href="${MOCK.deleteUrl}" style="color:${COLORS.accent};word-break:break-all;">${MOCK.deleteUrl}</a>`
    ),
    muted(
      "This action is irreversible. All of your data will be permanently removed."
    )
  ].join(""),
  { note: "Uses Parse.Cloud.sendEmail." }
);

// ---------------------------------------------------------------------------
// Account deletion OTP
// ---------------------------------------------------------------------------

const accountDeletionOtp = makeEmail(
  "OTP for Deletion account request",
  [
    h2("Your verification code"),
    p("Use this code to confirm your account deletion request."),
    `<div style="display:inline-block;border:1px solid ${COLORS.codeBorder};border-radius:8px;background:${COLORS.codeBg};padding:12px 16px;margin:0 0 16px 0;">
      <span style="font-family:Consolas,'Courier New',monospace;font-size:28px;font-weight:700;letter-spacing:6px;color:${COLORS.inkStrong};">${MOCK.otp6}</span>
    </div>`,
    muted("This code expires in <strong>10</strong> minutes."),
    muted("If you didn’t request this code, you can ignore this email.")
  ].join("")
);

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

const passwordReset = makeEmail(
  "Password Reset",
  [
    h2("Reset your password"),
    p(`Hi ${MOCK.receiverName},`),
    p("We received a request to reset the password for your account:"),
    p(`<strong>${MOCK.username}</strong>`),
    `<p style="margin:8px 0 0 0;text-align:center;">${btn(MOCK.resetLink, "Reset password")}</p>`
  ].join(""),
  { note: "Parse Server auth email." }
);

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

const emailVerification = makeEmail(
  `${APP_NAME} Email Address Verification`,
  [
    h2("Verify your email"),
    p("Welcome! Click the button below to verify your email address."),
    `<p style="margin:8px 0 0 0;text-align:center;">${btn(MOCK.verifyLink, "Verify email")}</p>`
  ].join(""),
  { note: "Parse Server auth email." }
);

// ---------------------------------------------------------------------------
// Bulk send summary
// ---------------------------------------------------------------------------

const bulkSendSummary = makeEmail(
  "Bulk send finished: 2 of 10 failed to create",
  [
    h2("Bulk send complete"),
    p(`Hi ${MOCK.senderName},`),
    p("Your bulk send processing is complete."),
    p(
      `<strong>Total requested:</strong> 10<br /><strong>Created:</strong> 8<br /><strong>Failed to create:</strong> 2`
    ),
    h2("Failure details"),
    `<ul style="margin:0;padding-left:20px;font-family:${FONT};font-size:16px;line-height:1.5;color:${COLORS.ink};">
      <li style="margin-bottom:6px;">#3: Invalid recipient email</li>
      <li style="margin-bottom:6px;">#7: Document creation failed</li>
    </ul>`
  ].join("")
);

/**
 * Ordered catalog shown in the email preview gallery.
 */
export const EMAIL_TEMPLATES = [
  {
    id: "signature-request-branded",
    name: "Signature request (branded)",
    category: "Signing",
    source: "Utils.js → mailTemplate()",
    ...signatureRequestBranded
  },
  {
    id: "signature-request-customizable",
    name: "Signature request (customizable default)",
    category: "Signing",
    source: "MailTemplateEditor defaultRequestBody",
    ...signatureRequestCustomizable
  },
  {
    id: "completion-branded",
    name: "Completion (branded)",
    category: "Signing",
    source: "PDF.js → sendCompletedMail()",
    ...completionBranded
  },
  {
    id: "completion-customizable",
    name: "Completion (customizable default)",
    category: "Signing",
    source: "MailTemplateEditor defaultCompletionBody",
    ...completionCustomizable
  },
  {
    id: "partial-sign",
    name: "Partial sign notification",
    category: "Signing",
    source: "PDF.js → sendNotifyMail()",
    ...partialSign
  },
  {
    id: "declined",
    name: "Document declined",
    category: "Signing",
    source: "declinedocument.js",
    ...declined
  },
  {
    id: "forward-copy",
    name: "Forward document copy",
    category: "Signing",
    source: "ForwardDoc.js",
    ...forwardCopy
  },
  {
    id: "signing-otp",
    name: "Signing / guest OTP",
    category: "Auth",
    source: "SendMailOTPv1.js",
    ...signingOtp
  },
  {
    id: "password-reset",
    name: "Password reset",
    category: "Auth",
    source: "files/password_reset_email.html",
    ...passwordReset
  },
  {
    id: "email-verification",
    name: "Email verification",
    category: "Auth",
    source: "files/verification_email.html",
    ...emailVerification
  },
  {
    id: "account-deletion-request",
    name: "Account deletion request",
    category: "Account",
    source: "sendDeleteUserMail.js",
    ...accountDeletionRequest
  },
  {
    id: "account-deletion-otp",
    name: "Account deletion OTP",
    category: "Account",
    source: "deleteUtils.js → sendDeleteOtpEmail()",
    ...accountDeletionOtp
  },
  {
    id: "bulk-send-summary",
    name: "Bulk send summary",
    category: "System",
    source: "createBatchDocs.js",
    ...bulkSendSummary
  }
];

export const EMAIL_CATEGORIES = [
  ...new Set(EMAIL_TEMPLATES.map((t) => t.category))
];
