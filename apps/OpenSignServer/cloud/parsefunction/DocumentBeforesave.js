import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH, MAX_NOTE_LENGTH } from '../../Utils.js';
import { setDocumentCount } from '../../utils/CountUtils.js';
import {
  checkSendByExternalTenant,
  getTenantIdForExtUser,
  isUcpEnabled,
} from '../../utils/ucpClient.js';

async function DocumentBeforesave(request) {
  if (!request.original) {
    const validations = [
      { field: 'Name', max: MAX_NAME_LENGTH },
      { field: 'Note', max: MAX_NOTE_LENGTH },
      { field: 'Description', max: MAX_DESCRIPTION_LENGTH },
    ];

    for (const { field, max } of validations) {
      const value = request?.object?.get(field);
      if (value && value.length > max) {
        throw new Parse.Error(
          Parse.Error.VALIDATION_ERROR,
          `The "${field}" field must be at most ${max} characters long.`
        );
      }
    }

    const TimeToCompleteDays = request?.object?.get('TimeToCompleteDays') || 15;
    const RemindOnceInEvery = request?.object?.get('RemindOnceInEvery') || 5;
    const AutoReminder = request?.object?.get('AutomaticReminders') || false;
    const reminderCount = TimeToCompleteDays / RemindOnceInEvery;
    if (AutoReminder && reminderCount > 15) {
      throw new Parse.Error(Parse.Error.INVALID_QUERY, 'only 15 reminder allowed');
    }
  }
  try {
    // below code is used to update document when user sent document or self signed
    const document = request.object;
    const oldDocument = request.original;

    // Check if SignedUrl field has been added (transition from undefined to defined)
    if (oldDocument && !oldDocument?.get('SignedUrl') && document?.get('SignedUrl')) {
      const extUserId = oldDocument?.get('ExtUserPtr')?.id;
      if (extUserId && isUcpEnabled()) {
        const tenantId = await getTenantIdForExtUser(extUserId);
        const check = await checkSendByExternalTenant(tenantId, { meter: 'send', quantity: 1 });
        if (check && check.ok === false) {
          throw new Parse.Error(
            Parse.Error.OPERATION_FORBIDDEN,
            check.reason === 'quota_exceeded'
              ? 'Send quota exceeded for your plan. Upgrade at www.doctransit.com/account'
              : 'This feature requires a plan upgrade. Visit www.doctransit.com/pricing'
          );
        }
      }
      if (extUserId) {
        setDocumentCount(extUserId);
      }
      if (document?.get('Signers') && document.get('Signers').length > 0) {
        document.set('DocSentAt', new Date());
      }
    }
  } catch (err) {
    if (err instanceof Parse.Error) throw err;
    console.log('err in document beforesave', err.message);
  }
}
export default DocumentBeforesave;
