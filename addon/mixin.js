import { isNone, typeOf } from '@ember/utils';
import Mixin from '@ember/object/mixin';

// Reserved keys, per the HAL spec
let halReservedKeys = ['_embedded', '_links'],
  reservedKeys = halReservedKeys.concat(['meta']),
  keys = Object.keys;

const /*SINGLE_PAYLOAD_REQUEST_TYPES = [
    'findRecord',
    'findBelongsTo',
    'queryRecord',
    'createRecord',
    'deleteRecord',
    'updateRecord'
  ],*/
  COLLECTION_PAYLOAD_REQUEST_TYPES = [
    'findHasMany',
    'findMany',
    'query',
    'findAll'
  ];

/**
 * @see ember-data/system/coerce-id
 * @param id
 * @returns {*}
 */
function coerceId(id) {
  return id == null || id === '' ? null : id + '';
}

function halToJSONAPILink(link) {
  let converted,
    linkKeys = keys(link);

  if (linkKeys.length === 1) {
    converted = link.href;
  } else {
    converted = {href: link.href, meta: {}};
    linkKeys.forEach(key => {
      if (key !== 'href') {
        converted.meta[key] = link[key];
      }
    });
  }

  return converted;
}

function arrayFlatten(array) {
  let flattened = [];
  return flattened.concat.apply(flattened, array);
}

export default Mixin.create({
  keyForRelationship(relationshipKey/*, relationshipMeta */) {
    return relationshipKey;
  },
  keyForAttribute(attributeName/*, attributeMeta */) {
    return attributeName;
  },
  keyForLink(relationshipKey/*, relationshipMeta */) {
    return relationshipKey;
  },
  isSinglePayload(payload, requestType) {
    return COLLECTION_PAYLOAD_REQUEST_TYPES.indexOf(requestType) === -1;
  },

  extractLink(link) {
    return link.href;
  },

  /**
   * Use ember-data 1.13.5+ extractId method
   * @param modelClass
   * @param resourceHash
   * @returns {*}
   */
  extractId (modelClass, resourceHash) {
    var primaryKey = this.get('primaryKey');
    var id = resourceHash[primaryKey];
    return coerceId(id);
  },

  _extractMeta (store, requestType, payload, primaryModelClass) {
    const meta = payload.meta || {},
      isSingle = this.isSinglePayload(payload, requestType);

    if (!isSingle) {
      keys(payload).forEach(key => {
        if (reservedKeys.indexOf(key) > -1) {
          return;
        }

        meta[key] = payload[key];
        delete payload[key];
      });

      if (payload._links) {
        meta.links = this.extractLinks(primaryModelClass, payload);
      }
    }

    return meta;
  },

  normalizeResponse (store, primaryModelClass, payload, id, requestType) {
    const isSingle = this.isSinglePayload(payload, requestType),
      documentHash = {},
      meta = this._extractMeta(store, requestType, payload, primaryModelClass),
      included = [];

    if (meta) {
      documentHash.meta = meta;
    }

    if (isSingle) {
      documentHash.data = this.normalize(primaryModelClass, payload, included);
    } else {
      documentHash.data = [];
      payload._embedded = payload._embedded || {};

      const normalizedEmbedded = Object.keys(payload._embedded).map(embeddedKey =>
        payload._embedded[embeddedKey].map(embeddedPayload =>
          this.normalize(primaryModelClass, embeddedPayload, included)));

      documentHash.data = arrayFlatten(normalizedEmbedded);
    }

    documentHash.included = included;
    return documentHash;
  },

  normalize(primaryModelClass, payload, included) {
    let data;

    if (payload) {
      const attributes = this.extractAttributes(primaryModelClass, payload),
        relationships = this.extractRelationships(primaryModelClass, payload, included);

      data = {
        id: this.extractId(primaryModelClass, payload),
        type: primaryModelClass.modelName
      };
      if (Object.keys(attributes).length > 0) {
        data.attributes = attributes;
      }
      if (Object.keys(relationships).length > 0) {
        data.relationships = relationships;
      }

      if (data.attributes) {
        this.applyTransforms(primaryModelClass, data.attributes);
      }
    }

    return data;
  },

  extractLinks(primaryModelClass, payload) {
    let links;

    if (payload._links) {
      links = {};
      Object.keys(payload._links).forEach(link => {
        links[link] = halToJSONAPILink(payload._links[link]);
      });
    }

    return links;
  },

  extractAttributes(primaryModelClass, payload) {
    let payloadKey,
      attributes = {};

    primaryModelClass.eachAttribute((attributeName, attributeMeta)=> {
      payloadKey = this.keyForAttribute(attributeName, attributeMeta);

      if (!payload.hasOwnProperty(payloadKey)) {
        return;
      }

      attributes[attributeName] = payload[payloadKey];
      delete payload[payloadKey];
    });

    if(payload._links) {
      attributes.links = this.extractLinks(primaryModelClass, payload);
    }

    return attributes;
  },

  extractRelationship(relationshipModelClass, payload, included) {
    if (isNone(payload)) {
      return undefined;
    }

    let relationshipModelName = relationshipModelClass.modelName,
      relationship;

    if (typeOf(payload) === 'object') {
      relationship = {
        id: coerceId(this.extractId({}, payload))
      };

      if (relationshipModelName) {
        relationship.type = this.modelNameFromPayloadKey(relationshipModelName);
        included.push(this.normalize(relationshipModelClass, payload, included));
      }
    } else {
      relationship = {
        id: coerceId(payload),
        type: relationshipModelName
      };
    }

    return relationship;
  },

  extractRelationships(primaryModelClass, payload, included) {
    let relationships = {},
      embedded = payload._embedded,
      links = payload._links;

    if (embedded || links) {
      primaryModelClass.eachRelationship((key, relationshipMeta) => {
        let relationship,
          relationshipKey = this.keyForRelationship(key, relationshipMeta),
          linkKey = this.keyForLink(key, relationshipMeta);

        if (embedded && embedded.hasOwnProperty(relationshipKey)) {
          let data,
            relationModelClass = this.store.modelFor(relationshipMeta.type);

          if (relationshipMeta.kind === 'belongsTo') {
            data = this.extractRelationship(relationModelClass, embedded[relationshipKey], included);
          } else if (relationshipMeta.kind === 'hasMany') {
            data = embedded[relationshipKey].map(item => {
              return this.extractRelationship(relationModelClass, item, included);
            });
          }

          relationship = {data};
        }

        if (links && links.hasOwnProperty(linkKey)) {
          relationship = relationship || {};

          const link = links[linkKey],
            useRelated = !relationship.data;

          relationship.links = {
            [useRelated ? 'related' : 'self']: this.extractLink(link)
          };
        }

        if (relationship) {
          relationships[key] = relationship;
        }
      }, this);
    }

    return relationships;
  }
});
