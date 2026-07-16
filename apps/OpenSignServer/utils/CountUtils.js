import { meterSendByExternalTenant } from './ucpClient.js';

export const setDocumentCount = async (extUserId, docsCount, meterOpts = {}) => {
  if (extUserId) {
    try {
      // Update count in contracts_Users class
      const extQuery = new Parse.Query('contracts_Users');
      extQuery.equalTo('objectId', extUserId);
      const contractUser = await extQuery.first({ useMasterKey: true });
      if (contractUser) {
        if (docsCount) {
          const count = contractUser.get('DocumentCount')
            ? contractUser.get('DocumentCount') + Number(docsCount)
            : 0 + Number(docsCount);
          contractUser.set('DocumentCount', count);
        } else {
          contractUser.increment('DocumentCount', 1);
        }
        await contractUser.save(null, { useMasterKey: true });

        const tenantId = contractUser.get('TenantId')?.id;
        if (tenantId) {
          try {
            await meterSendByExternalTenant(tenantId, {
              meter: meterOpts.meter || 'send',
              quantity: docsCount ? Number(docsCount) : 1,
            });
          } catch (ucpErr) {
            console.log('UCP meter warning:', ucpErr.message);
          }
        }
      }
    } catch (error) {
      console.log('Error updating document count in contracts_Users: ' + error.message);
    }
  }
};
export const setTemplateCount = async extUserId => {
  if (extUserId) {
    try {
      // Update count in contracts_Users class
      const extQuery = new Parse.Query('contracts_Users');
      extQuery.equalTo('objectId', extUserId);
      const contractUser = await extQuery.first({ useMasterKey: true });
      if (contractUser) {
        contractUser.increment('TemplateCount', 1);
        await contractUser.save(null, { useMasterKey: true });
      }
    } catch (error) {
      console.log('Error updating template count in contracts_Users: ' + error.message);
    }
  }
};
