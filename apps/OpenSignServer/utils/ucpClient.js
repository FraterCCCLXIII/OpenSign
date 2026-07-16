/**
 * Client for universal-control-plane entitlements / metering.
 * Disabled when UCP_URL is unset (self-host / local without billing).
 */

const UCP_URL = (process.env.UCP_URL || '').replace(/\/$/, '');
const UCP_MASTER_KEY = process.env.UCP_MASTER_KEY || '';

export function isUcpEnabled() {
  return Boolean(UCP_URL && UCP_MASTER_KEY);
}

async function ucpFetch(path, body) {
  if (!isUcpEnabled()) {
    return { ok: true, skipped: true };
  }

  const res = await fetch(`${UCP_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-UCP-Master-Key': UCP_MASTER_KEY,
    },
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Tenants not yet linked to UCP (pre-SaaS) should not block signing.
    if (res.status === 404 && data.error === 'tenant_not_found') {
      return { ok: true, skipped: true, reason: 'tenant_not_linked' };
    }
    const err = new Error(data.reason || data.error || `UCP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Resolve Parse partners_Tenant.objectId → meter against UCP external id */
export async function meterSendByExternalTenant(externalTenantId, opts = {}) {
  if (!externalTenantId) return { ok: true, skipped: true };
  const meter = opts.meter || 'send';
  const quantity = opts.quantity || 1;
  return ucpFetch(`/entitlements/by-external/${externalTenantId}/meter`, {
    meter,
    quantity,
  });
}

export async function checkSendByExternalTenant(externalTenantId, opts = {}) {
  if (!externalTenantId) return { ok: true, skipped: true };
  const meter = opts.meter || 'send';
  const quantity = opts.quantity || 1;
  return ucpFetch(`/entitlements/by-external/${externalTenantId}/check`, {
    meter,
    quantity,
  });
}

export async function getTenantIdForExtUser(extUserId) {
  if (!extUserId) return null;
  const q = new Parse.Query('contracts_Users');
  q.select(['TenantId']);
  const user = await q.get(extUserId, { useMasterKey: true });
  return user?.get('TenantId')?.id || user?.get('TenantId')?.objectId || null;
}
