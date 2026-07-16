import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PARSE_APP_ID = process.env.PARSE_APP_ID || "opensign";
const PARSE_SERVER_URL = process.env.PARSE_SERVER_URL || "http://server:8080/app";
const PUBLIC_URL = process.env.PUBLIC_URL || "https://docs.moleculepeptides.com";
const MASTER_KEY = process.env.MASTER_KEY;
const DEFAULT_TEMPLATE_ID = process.env.PUBLIC_TEMPLATE_ID || "GLZFhKgcY8";
const PUBLIC_ROLE = process.env.PUBLIC_SIGN_ROLE || "Affiliate";
const PORT = Number(process.env.PORT || 3001);

if (!MASTER_KEY) {
  console.error("MASTER_KEY is required");
  process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const parseHeaders = {
  "Content-Type": "application/json",
  "X-Parse-Application-Id": PARSE_APP_ID,
  "X-Parse-Master-Key": MASTER_KEY
};

async function parseRequest(method, endpoint, body) {
  const res = await fetch(`${PARSE_SERVER_URL}${endpoint}`, {
    method,
    headers: parseHeaders,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || data.message || res.statusText;
    throw new Error(message);
  }
  return data;
}

function normalizeEmail(email) {
  return email?.toLowerCase()?.trim()?.replace(/\s/g, "");
}

async function getTemplate(templateId) {
  const data = await parseRequest("GET", `/classes/contracts_Template/${templateId}`);
  if (data.IsArchive) {
    throw new Error("Template is archived.");
  }
  if (!data.IsPublic) {
    throw new Error("Template is not public.");
  }
  return data;
}

async function findUserByEmail(email) {
  const where = encodeURIComponent(JSON.stringify({ email }));
  const data = await parseRequest(
    "GET",
    `/users?where=${where}&limit=1`
  );
  return data.results?.[0] || null;
}

async function createGuestUser({ name, email, phone }) {
  return parseRequest("POST", "/users", {
    username: email,
    email,
    password: email,
    name,
    phone: phone || undefined
  });
}

async function createContact({ name, email, phone, createdBy, tenantId, userId }) {
  const acl = {
    [createdBy.objectId]: { read: true, write: true },
    [userId]: { read: true, write: true }
  };
  return parseRequest("POST", "/classes/contracts_Contactbook", {
    Name: name,
    Email: email,
    Phone: phone || "",
    CreatedBy: createdBy,
    UserId: { __type: "Pointer", className: "_User", objectId: userId },
    UserRole: "contracts_Guest",
    TenantId: tenantId
      ? { __type: "Pointer", className: "partners_Tenant", objectId: tenantId }
      : undefined,
    IsDeleted: false,
    ACL: acl
  });
}

function pointerId(value) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.objectId;
}

function buildDocumentFromTemplate(template, contact, roleIndex) {
  const placeholders = JSON.parse(JSON.stringify(template.Placeholders || []));
  const signers = JSON.parse(JSON.stringify(template.Signers || []));

  placeholders[roleIndex] = {
    ...placeholders[roleIndex],
    email: contact.Email,
    signerObjId: contact.objectId,
    signerPtr: {
      __type: "Pointer",
      className: "contracts_Contactbook",
      objectId: contact.objectId
    }
  };

  const contactPointer = {
    __type: "Pointer",
    className: "contracts_Contactbook",
    objectId: contact.objectId
  };
  signers.splice(roleIndex, 0, contactPointer);

  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + (template.TimeToCompleteDays || 15));

  const createdById = pointerId(template.CreatedBy);
  const contactUserId = pointerId(contact.UserId);
  const acl = {
    [createdById]: { read: true, write: true }
  };
  if (contactUserId) {
    acl[contactUserId] = { read: true, write: true };
  }

  return {
    Name: template.Name,
    Description: template.Description,
    Note: template.Note,
    URL: template.URL,
    SignedUrl: template.URL,
    TimeToCompleteDays: template.TimeToCompleteDays || 15,
    SendinOrder: template.SendinOrder ?? true,
    SendInOrderStrict: template.SendInOrderStrict || false,
    AutomaticReminders: template.AutomaticReminders || false,
    RemindOnceInEvery: template.RemindOnceInEvery || 5,
    IsEnableOTP: template.IsEnableOTP || false,
    IsTourEnabled: template.IsTourEnabled || false,
    NotifyOnSignatures: template.NotifyOnSignatures ?? true,
    SignatureType: template.SignatureType,
    Placeholders: placeholders,
    Signers: signers,
    SentToOthers: true,
    CreatedBy: template.CreatedBy,
    ExtUserPtr: template.ExtUserPtr,
    OriginIp: template.OriginIp || "",
    TemplateId: {
      __type: "Pointer",
      className: "contracts_Template",
      objectId: template.objectId
    },
    DocSentAt: { __type: "Date", iso: now.toISOString() },
    ExpiryDate: { __type: "Date", iso: expiry.toISOString() },
    ACL: acl
  };
}

async function ensureContact({ name, email, phone, template }) {
  const createdBy = template.CreatedBy;
  const tenantId = template.ExtUserPtr?.TenantId?.objectId;

  const where = encodeURIComponent(
    JSON.stringify({
      Email: email,
      CreatedBy: createdBy,
      IsDeleted: { $ne: true }
    })
  );
  const existing = await parseRequest(
    "GET",
    `/classes/contracts_Contactbook?where=${where}&limit=1`
  );
  if (existing.results?.[0]) {
    return existing.results[0];
  }

  let user = await findUserByEmail(email);
  if (!user) {
    user = await createGuestUser({ name, email, phone });
  }

  return createContact({
    name,
    email,
    phone,
    createdBy,
    tenantId,
    userId: user.objectId
  });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/template/:templateId", async (req, res) => {
  try {
    const template = await getTemplate(req.params.templateId);
    res.json({
      objectId: template.objectId,
      Name: template.Name,
      Description: template.Description,
      Note: template.Note,
      PublicRole: template.PublicRole || [PUBLIC_ROLE]
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/start", async (req, res) => {
  try {
    const templateId = req.body.templateId || DEFAULT_TEMPLATE_ID;
    const name = req.body.name?.trim();
    const email = normalizeEmail(req.body.email);
    const phone = req.body.phone?.trim() || "";
    const role = req.body.role || PUBLIC_ROLE;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required." });
    }

    const template = await getTemplate(templateId);
    const placeholders = template.Placeholders || [];
    const roleIndex = placeholders.findIndex((item) => item.Role === role);
    if (roleIndex === -1) {
      return res.status(400).json({ error: `Role "${role}" was not found on template.` });
    }

    const contact = await ensureContact({ name, email, phone, template });
    const documentPayload = buildDocumentFromTemplate(template, contact, roleIndex);
    const document = await parseRequest("POST", "/classes/contracts_Document", documentPayload);

    const encoded = Buffer.from(
      `${document.objectId}/${email}/${contact.objectId}/false`
    ).toString("base64");
    const signUrl = `${PUBLIC_URL}/login/${encoded}`;

    res.json({
      docId: document.objectId,
      contactId: contact.objectId,
      signUrl
    });
  } catch (error) {
    console.error("start public sign error:", error);
    res.status(500).json({ error: error.message || "Unable to start signing." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Public sign service listening on ${PORT}`);
});
