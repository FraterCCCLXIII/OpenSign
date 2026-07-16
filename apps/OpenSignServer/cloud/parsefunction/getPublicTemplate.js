/**
 * Public (unauthenticated) metadata for a shareable template signing page.
 */
export default async function getPublicTemplate(request) {
  const templateId = request.params?.templateId;
  if (!templateId) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'templateId is required.');
  }

  try {
    const query = new Parse.Query('contracts_Template');
    query.equalTo('objectId', templateId);
    query.notEqualTo('IsArchive', true);
    query.equalTo('IsPublic', true);
    query.select(['Name', 'Description', 'Note', 'PublicRole', 'IsPublic']);
    const template = await query.first({ useMasterKey: true });

    if (!template) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        'Template is not available for public signing.'
      );
    }

    const data = JSON.parse(JSON.stringify(template));
    return {
      objectId: data.objectId,
      Name: data.Name || 'Document',
      Description: data.Description || '',
      Note: data.Note || '',
      PublicRole: Array.isArray(data.PublicRole) ? data.PublicRole : [],
    };
  } catch (error) {
    if (error instanceof Parse.Error) throw error;
    console.log('err in getPublicTemplate', error);
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'Unable to load template.');
  }
}
