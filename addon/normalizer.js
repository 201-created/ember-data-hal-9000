import Ember from 'ember';
import Response from './response';
import Resource from './resource';

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
    this.response = new Response(this.store);
  }

  normalizeArrayResponse() {
    const resourcePayloads =
      this.payload._embedded[this._payloadKeyForClass(this.primaryModelClass)];
    const type = this.primaryModelClass.modelName;

    this._extractCollection(resourcePayloads, type, type);
    return this.response.toJSON();
  }

  normalizeSingleResponse() {
    const resourcePayload = this.payload;
    const type = this.primaryModelClass.modelName;
    const isCollection = false;

    this._extractSingle(resourcePayload, type, type, isCollection);
    return this.response.toJSON();
  }

  _extractCollection(payloads, key, type) {
    const isCollection = true;
    payloads.forEach((payload) => this._extractSingle(payload, key, type, isCollection));
  }

  _extractSingle(payload, key, type, isCollection=false) {
    const attributes = copyAttributesExcluding(payload, RESERVED_ATTRIBUTES);
    const id = payload.id;
    const resource = new Resource({ id, key, type, attributes });

    this.response.pushResource(resource, isCollection, () => {
      var primaryModelClass = this.primaryModelClass;
      this._extractRelationships(payload._embedded || {}, primaryModelClass);
    });
  }

  _extractRelationships(payload, primaryModelClass) {
    Object.keys(payload).forEach((key) => {
      const relatedPayload = payload[key];
      const attributeName = Ember.String.camelize(key);
      const relationship = Ember.get(primaryModelClass, 'relationshipsByName').get(attributeName);

      var type;
      if (relationship && relationship.type) {
        type = relationship.type;
      } else {
        type = attributeName;
      }

      this._extractRelationship(relatedPayload, Ember.String.dasherize(key), type);
    });
  }

  _extractRelationship(payload, key, type) {
    if (Array.isArray(payload)) {
      this._extractCollection(payload, key, type);
    } else {
      this._extractSingle(payload, key, type);
    }
  }

  // the key in the incoming payload for this class
  _payloadKeyForClass(modelClass) {
    return Ember.String.pluralize(modelClass.modelName);
  }

  _modelClassForPayloadKey(key) {
    return this.store.modelFor(key);
  }
}
