import axios from 'axios';
import { cloudServerUrl, serverAppId } from '../../Utils.js';

const serverUrl = cloudServerUrl;
const APPID = serverAppId;
const masterKEY = process.env.MASTER_KEY;

async function addTeamAndOrg(extUser) {
  const extUserCls = new Parse.Query('contracts_Users');
  const updateUser = await extUserCls.get(extUser.objectId, { useMasterKey: true });
  if (updateUser?.get('OrganizationId')) return;

  const orgCls = new Parse.Object('contracts_Organizations');
  orgCls.set('Name', extUser.Company);
  orgCls.set('IsActive', true);
  orgCls.set('ExtUserId', {
    __type: 'Pointer',
    className: 'contracts_Users',
    objectId: extUser.objectId,
  });
  orgCls.set('CreatedBy', {
    __type: 'Pointer',
    className: '_User',
    objectId: extUser.UserId.objectId,
  });
  orgCls.set('TenantId', {
    __type: 'Pointer',
    className: 'partners_Tenant',
    objectId: extUser.TenantId.objectId,
  });
  const orgRes = await orgCls.save(null, { useMasterKey: true });

  const teamCls = new Parse.Object('contracts_Teams');
  teamCls.set('Name', 'All Users');
  teamCls.set('OrganizationId', {
    __type: 'Pointer',
    className: 'contracts_Organizations',
    objectId: orgRes.id,
  });
  teamCls.set('IsActive', true);
  const teamRes = await teamCls.save(null, { useMasterKey: true });

  updateUser.set('UserRole', 'contracts_Admin');
  updateUser.set('OrganizationId', {
    __type: 'Pointer',
    className: 'contracts_Organizations',
    objectId: orgRes.id,
  });
  updateUser.set('TeamIds', [
    {
      __type: 'Pointer',
      className: 'contracts_Teams',
      objectId: teamRes.id,
    },
  ]);
  await updateUser.save(null, { useMasterKey: true });
}

async function saveUser({ email, password, name }) {
  const username = email.toLowerCase().replace(/\s/g, '');
  const userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo('username', username);
  const existing = await userQuery.first({ useMasterKey: true });

  if (existing) {
    const axiosRes = await axios({
      method: 'POST',
      url: `${serverUrl}/loginAs`,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'X-Parse-Application-Id': APPID,
        'X-Parse-Master-Key': masterKEY,
      },
      params: { userId: existing.id },
    });
    return {
      id: axiosRes.data.objectId,
      sessionToken: axiosRes.data.sessionToken,
      created: false,
    };
  }

  const user = new Parse.User();
  user.set('username', username);
  user.set('password', password);
  user.set('email', username);
  user.set('name', name);
  const res = await user.signUp();
  return { id: res.id, sessionToken: res.getSessionToken(), created: true };
}

/**
 * Called by universal-control-plane with Parse master key.
 * Creates a new company tenant + admin for each SaaS signup (multi-company).
 */
export default async function ucpProvisionTenant(request) {
  if (!request.master) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Master key required');
  }

  const email = String(request.params.email || '')
    .toLowerCase()
    .replace(/\s/g, '');
  const name = String(request.params.name || '').trim();
  const company = String(request.params.company || '').trim();
  const password = String(request.params.password || '');

  if (!email || !name || !company || password.length < 8) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Invalid provision params');
  }

  const user = await saveUser({ email, password, name });

  const extQuery = new Parse.Query('contracts_Users');
  extQuery.equalTo('UserId', {
    __type: 'Pointer',
    className: '_User',
    objectId: user.id,
  });
  const existingExt = await extQuery.first({ useMasterKey: true });
  if (existingExt) {
    return {
      tenantId: existingExt.get('TenantId')?.id,
      userId: user.id,
      extUserId: existingExt.id,
      alreadyExists: true,
    };
  }

  const tenant = new Parse.Object('partners_Tenant');
  tenant.set('UserId', {
    __type: 'Pointer',
    className: '_User',
    objectId: user.id,
  });
  tenant.set('TenantName', company);
  tenant.set('EmailAddress', email);
  tenant.set('IsActive', true);
  tenant.set('CreatedBy', {
    __type: 'Pointer',
    className: '_User',
    objectId: user.id,
  });
  const tenantRes = await tenant.save(null, { useMasterKey: true });

  const extUser = new Parse.Object('contracts_Users');
  extUser.set('UserId', {
    __type: 'Pointer',
    className: '_User',
    objectId: user.id,
  });
  extUser.set('UserRole', 'contracts_Admin');
  extUser.set('Email', email);
  extUser.set('Name', name);
  extUser.set('Company', company);
  extUser.set('TenantId', {
    __type: 'Pointer',
    className: 'partners_Tenant',
    objectId: tenantRes.id,
  });
  const extRes = await extUser.save(null, { useMasterKey: true });

  await addTeamAndOrg({
    objectId: extRes.id,
    Company: company,
    UserId: { objectId: user.id },
    TenantId: { objectId: tenantRes.id },
  });

  return {
    tenantId: tenantRes.id,
    userId: user.id,
    extUserId: extRes.id,
    alreadyExists: false,
  };
}
