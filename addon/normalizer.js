import Ember from 'ember';

const RESERVED_ATTRIBUTES = ['type', 'id', '_embedded', '_links'];

function copyAttributesExcluding(payload, excludedAttrs) {
  let response = {};
  Object.keys(payload).map((k) => response[k] = payload[k]);

  for (let excluded of excludedAttrs) {
    delete response[excluded];
  }
  return response;
}

export default class Normalizer {
  constructor(store, primaryModelClass, payload, id, requestType) {
    this.store = store;
    this.primaryModelClass = primaryModelClass;
    this.payload = payload;
    this.id = id;
    this.requestType = requestType;
  }

  normalizeResponse() {
    return this.normalizeFindAllResponse();
  }

  normalizeFindAllResponse() {
    const rawCollectionResources =
      this.payload._embedded[this._payloadKeyForClass(this.primaryModelClass)];

    const normalizedCollectionResources = rawCollectionResources.map((rawResource) => {
      return this._extractSingleOfClass(rawResource, this.primaryModelClass);
    });

    return {
      data: normalizedCollectionResources
    };
  }

  _extractSingleOfClass(payload, modelClass) {
    let attributes = copyAttributesExcluding(payload, RESERVED_ATTRIBUTES);

    if (payload._embedded) {
      let relationships = this._extractRelationships(payload._embedded);
    }

    return {
      id: payload.id,
      type: this._responseTypeForClass(modelClass),
      attributes
    };
  }

  _extractRelationships(payload) {
  }

  // the "type" value in the normalized response for this class
  _responseTypeForClass(modelClass) {
    return modelClass.modelName;
  }

  // the key in the incoming payload for this class
  _payloadKeyForClass(modelClass) {
    return Ember.String.pluralize(modelClass.modelName);
  }
}
