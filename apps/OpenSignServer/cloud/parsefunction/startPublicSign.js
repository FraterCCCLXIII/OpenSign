import { setDocumentCount } from '../../utils/CountUtils.js';
import {
  checkSendByExternalTenant,
  isUcpEnabled,
} from '../../utils/ucpClient.js';

const normalizeEmail = email => email?.toLowerCase()?.trim()?.replace(/\s/g, '');

const pointerId = value => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.objectId || value.id;
};

async function findOrCreateGuestUser({ name, email, phone }) {
  const userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo('email', email);
  let user = await userQuery.first({ useMasterKey: true });
  if (user) return user;

  user = new Parse.User();
  user.set('username', email);
  user.set('email', email);
  user.set('password', email);
  user.set('name', name);
  if (phone) user.set('phone', phone);
  await user.signUp(null, { useMasterKey: true });
  return user;
}

async function findOrCreateContact({ name, email, phone, createdBy, tenantId, user }) {
  const contactQuery = new Parse.Query('contracts_Contactbook');
  contactQuery.equalTo('Email', email);
  contactQuery.equalTo('CreatedBy', createdBy);
  contactQuery.notEqualTo('IsDeleted', true);
  const existing = await contactQuery.first({ useMasterKey: true });
  if (existing) return existing;

  const contact = new Parse.Object('contracts_Contactbook');
  contact.set('Name', name);
  contact.set('Email', email);
  contact.set('Phone', phone || '');
  contact.set('CreatedBy', createdBy);
  contact.set('UserId', {
    __type: 'Pointer',
    className: '_User',
    objectId: user.id,
  });
  contact.set('UserRole', 'contracts_Guest');
  if (tenantId) {
    contact.set('TenantId', {
      __type: 'Pointer',
      className: 'partners_Tenant',
      objectId: tenantId,
    });
  }
  contact.set('IsDeleted', false);
  const acl = new Parse.ACL();
  acl.setReadAccess(pointerId(createdBy), true);
  acl.setWriteAccess(pointerId(createdBy), true);
  acl.setReadAccess(user.id, true);
  acl.setWriteAccess(user.id, true);
  contact.setACL(acl);
  return contact.save(null, { useMasterKey: true });
}

/**
 * Create a document from a public template and return a guest signing URL path.
 * Intended for unauthenticated public-sign pages (no session / no master key on client).
 */
export default async function startPublicSign(request) {
  const templateId = request.params?.templateId;
  const name = request.params?.name?.trim();
  const email = normalizeEmail(request.params?.email);
  const phone = request.params?.phone?.trim() || '';
  let role = request.params?.role?.trim();

  if (!templateId || !name || !email) {
    throw new Parse.Error(
      Parse.Error.VALIDATION_ERROR,
      'Name, email, and templateId are required.'
    );
  }

  try {
    const templateQuery = new Parse.Query('contracts_Template');
    templateQuery.include('ExtUserPtr');
    templateQuery.include('ExtUserPtr.TenantId');
    templateQuery.include('CreatedBy');
    templateQuery.include('Signers');
    const templateObj = await templateQuery.get(templateId, { useMasterKey: true });
    const template = JSON.parse(JSON.stringify(templateObj));

    if (template.IsArchive) {
      throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Template is archived.');
    }
    if (!template.IsPublic) {
      throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Template is not public.');
    }

    const ownerTenantId =
      template.ExtUserPtr?.TenantId?.objectId || template.ExtUserPtr?.TenantId?.id;
    if (ownerTenantId && isUcpEnabled()) {
      const check = await checkSendByExternalTenant(ownerTenantId, {
        meter: 'public_sign',
        quantity: 1,
      });
      if (check && check.ok === false) {
        throw new Parse.Error(
          Parse.Error.OPERATION_FORBIDDEN,
          check.reason === 'feature_locked'
            ? 'Public signing requires a Business plan. Visit www.doctransit.com/pricing'
            : 'Send quota exceeded for this workspace. Upgrade at www.doctransit.com/account'
        );
      }
    }

    const placeholders = Array.isArray(template.Placeholders)
      ? JSON.parse(JSON.stringify(template.Placeholders))
      : [];
    const publicRoles = Array.isArray(template.PublicRole) ? template.PublicRole : [];

    if (!role) {
      role =
        publicRoles[0] ||
        placeholders.find(item => item?.Role && !item?.signerObjId)?.Role ||
        placeholders[0]?.Role;
    }

    if (publicRoles.length > 0 && !publicRoles.includes(role)) {
      throw new Parse.Error(
        Parse.Error.VALIDATION_ERROR,
        `Role "${role}" is not enabled for public signing.`
      );
    }

    const roleIndex = placeholders.findIndex(item => item?.Role === role);
    if (roleIndex === -1) {
      throw new Parse.Error(
        Parse.Error.VALIDATION_ERROR,
        `Role "${role}" was not found on template.`
      );
    }

    if (!template.CreatedBy?.objectId) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Template owner is missing.');
    }

    const createdBy = {
      __type: 'Pointer',
      className: '_User',
      objectId: template.CreatedBy.objectId,
    };
    const tenantId = template.ExtUserPtr?.TenantId?.objectId;
    const user = await findOrCreateGuestUser({ name, email, phone });
    const contact = await findOrCreateContact({
      name,
      email,
      phone,
      createdBy,
      tenantId,
      user,
    });

    placeholders[roleIndex] = {
      ...placeholders[roleIndex],
      email,
      signerObjId: contact.id,
      signerPtr: {
        __type: 'Pointer',
        className: 'contracts_Contactbook',
        objectId: contact.id,
      },
    };

    const signers = Array.isArray(template.Signers)
      ? JSON.parse(JSON.stringify(template.Signers))
      : [];
    const contactPointer = {
      __type: 'Pointer',
      className: 'contracts_Contactbook',
      objectId: contact.id,
    };
    // Keep role order aligned with placeholders when possible.
    if (signers[roleIndex]) {
      signers.splice(roleIndex, 0, contactPointer);
    } else {
      signers.push(contactPointer);
    }

    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + (template.TimeToCompleteDays || 15));

    const doc = new Parse.Object('contracts_Document');
    doc.set('Name', template.Name || 'untitled document');
    if (template.Description) doc.set('Description', template.Description);
    if (template.Note) doc.set('Note', template.Note);
    doc.set('URL', template.URL);
    doc.set('SignedUrl', template.URL);
    doc.set('TimeToCompleteDays', template.TimeToCompleteDays || 15);
    doc.set('SendinOrder', template.SendinOrder ?? true);
    doc.set('SendInOrderStrict', !!template.SendInOrderStrict);
    doc.set('AutomaticReminders', !!template.AutomaticReminders);
    doc.set('RemindOnceInEvery', template.RemindOnceInEvery || 5);
    doc.set('IsEnableOTP', !!template.IsEnableOTP);
    doc.set('IsTourEnabled', !!template.IsTourEnabled);
    doc.set('NotifyOnSignatures', template.NotifyOnSignatures ?? true);
    if (Array.isArray(template.SignatureType)) {
      doc.set('SignatureType', template.SignatureType);
    }
    doc.set('Placeholders', placeholders);
    doc.set('Signers', signers);
    doc.set('SentToOthers', true);
    doc.set('CreatedBy', createdBy);
    if (template.ExtUserPtr?.objectId) {
      doc.set('ExtUserPtr', {
        __type: 'Pointer',
        className: 'contracts_Users',
        objectId: template.ExtUserPtr.objectId,
      });
    }
    doc.set('OriginIp', template.OriginIp || '');
    doc.set('TemplateId', {
      __type: 'Pointer',
      className: 'contracts_Template',
      objectId: template.objectId,
    });
    doc.set('DocSentAt', now);
    doc.set('ExpiryDate', expiry);

    const acl = new Parse.ACL();
    acl.setReadAccess(template.CreatedBy.objectId, true);
    acl.setWriteAccess(template.CreatedBy.objectId, true);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    doc.setACL(acl);

    const document = await doc.save(null, { useMasterKey: true });
    if (template.ExtUserPtr?.objectId) {
      setDocumentCount(template.ExtUserPtr.objectId, undefined, {
        meter: 'public_sign',
      });
    }

    const encoded = Buffer.from(
      `${document.id}/${email}/${contact.id}/false`
    ).toString('base64');

    return {
      docId: document.id,
      contactId: contact.id,
      signPath: `/login/${encoded}`,
    };
  } catch (error) {
    if (error instanceof Parse.Error) throw error;
    console.log('err in startPublicSign', error);
    throw new Parse.Error(
      Parse.Error.INTERNAL_SERVER_ERROR,
      error?.message || 'Unable to start signing.'
    );
  }
}
