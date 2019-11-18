import request from 'superagent';
import { normalizeResource } from './utils/common';

/**
 * hasSignedIn
 *
 * @returns {boolean}
 */
function hasSignedIn() {
  return true;
}

/**
 * Init API
 *
 * @returns {Promise<{apiInitialized: boolean, apiSignedIn: boolean}>}
 */
function init() {
  return {
    apiInitialized: true,
    apiSignedIn: true
  };
}

async function getCapabilitiesForResource(options, resource) {
  return resource.capabilities || [];
}

async function getResourceById(options, id) {
  const token = sessionStorage.getItem('token');
  console.log('token',token);
  console.log('getResourceById');
  const route = `${options.apiRoot}/files/${id}`;
  const method = 'GET';
  const response = await request(method, route).set({Authorization: `Bearer ${token}`});
  console.log('response', response);
  return normalizeResource(response.body.response);
}

async function getChildrenForId(options, { id, sortBy = 'name', sortDirection = 'ASC' }) {
  console.log('getChildrenForId');
  const route = `${options.apiRoot}/files/${id}/children?orderBy=${sortBy}&orderDirection=${sortDirection}`;
  const method = 'GET';
  const response = await request(method, route).set({Authorization: `Bearer ${options.apiToken}`});
  return response.body.response.items.map(normalizeResource)
}

async function getParentsForId(options, id, result = []) {
  console.log('getParentsForId');
  if (!id) {
    return result;
  }

  const resource = await getResourceById(options, id);
  if (resource && resource.ancestors) {
    return resource.ancestors;
  }
  return result;
}

async function getBaseResource(options) {
  console.log('getBaseResource');
  const route = `${options.apiRoot}/files`;
  const response = await request.get(route).set({Authorization: `Bearer ${options.apiToken}`});
  return normalizeResource(response.body);
}

async function getIdForPartPath(options, currId, pathArr) {
  console.log('getIdForPartPath');
  const resourceChildren = await getChildrenForId(options, { id: currId });
  for (let i = 0; i < resourceChildren.length; i++) {
    const resource = resourceChildren[i];
    if (resource.name === pathArr[0]) {
      if (pathArr.length === 1) {
        return resource.id;
      } else {
        return getIdForPartPath(options, resource.id, pathArr.slice(1));
      }
    }
  }

  return null;
}

async function getIdForPath(options, path) {
  console.log('getIdForPath');
  const resource = await getBaseResource(options);
  const pathArr = path.split('/');

  if (pathArr.length === 0 || pathArr.length === 1 || pathArr[0] !== '') {
    return null;
  }

  if (pathArr.length === 2 && pathArr[1] === '') {
    return resource.id;
  }

  return getIdForPartPath(options, resource.id, pathArr.slice(1));
}

async function getParentIdForResource(options, resource) {
  console.log('getParentIdForResource');
  return resource.parentId;
}

async function uploadFileToId({ apiOptions, parentId, file, onProgress }) {
  console.log('uploadFileToId');
  const route = `${apiOptions.apiRoot}/files`;
  return request.post(route)
      .set({Authorization: `Bearer ${apiOptions.apiToken}`})
      .field('type', 'file')
      .field('parentId', parentId)
      .attach('files', file.file, file.name)
      .on('progress', event => {
      onProgress(event.percent);
    });
}

async function downloadResources({ apiOptions, resources, onProgress }) {
  const downloadUrl = resources.reduce(
    (url, resource, num) => url + (num === 0 ? '' : '&') + `items=${resource.id}`,
    `${apiOptions.apiRoot}/download?`
  );

  const res = await request.get(downloadUrl)
      .set({Authorization: `Bearer ${apiOptions.apiToken}`})
      .responseType('blob').
    on('progress', event => {
      onProgress(event.percent);
    });

  return res.body;
}

async function createFolder(options, parentId, folderName) {
  console.log('createFolder');
  const route = `${options.apiRoot}/files`;
  const method = 'POST';
  const params = {
    parentId,
    name: folderName,
    type: 'dir'
  };
  return request(method, route)
      .set({ Authorization: `Bearer ${options.apiToken}` })
      .set({ 'content-type': 'application/json' })
      .send(params)
}

function getResourceName(apiOptions, resource) {
  console.log('getResourceName');
  return resource.name;
}

async function renameResource(options, id, newName) {
  console.log('renameResource');
  const route = `${options.apiRoot}/files/${id}`;
  const method = 'PATCH';
  return request(method, route)
      .set({Authorization: `Bearer ${options.apiToken}`})
      .type('application/json')
      .send({ name: newName })
}

async function removeResource(options, resource) {
  console.log('removeResource');
  const route = `${options.apiRoot}/files/${resource.id}`;
  const method = 'DELETE';
  return request(method, route).set({Authorization: `Bearer ${options.apiToken}`})
}

async function removeResources(options, selectedResources) {
  console.log('removeResources');
  return Promise.all(selectedResources.map(resource => removeResource(options, resource)))
}

export default {
  init,
  hasSignedIn,
  getIdForPath,
  getResourceById,
  getCapabilitiesForResource,
  getChildrenForId,
  getParentsForId,
  getParentIdForResource,
  getResourceName,
  createFolder,
  downloadResources,
  renameResource,
  removeResources,
  uploadFileToId
};
