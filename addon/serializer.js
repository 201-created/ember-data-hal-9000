import DS from "ember-data";
import Ember from 'ember';

let {JSONAPISerializer} = DS;

// requestType values that indicate that we are loading a collection, not a single resource
let findManyRequestTypes = ["findMany", "findAll", "findHasMany", "findQuery"],
// Reserved keys, per the HAL spec
  halReservedKeys = ['_embedded', '_links'],
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

function arrayFlatten(array) {
  let flattened = [];
  return flattened.concat.apply(flattened, array);
}

function extractLinksIntoMeta(payload, meta) {
  let links = payload._links;
  if (links) {
    meta = meta || {};
    meta.links = {};

    keys(links).forEach(function (key) {
      meta.links[key] = links[key].href;
    });
  }

  return meta;
}

export default JSONAPISerializer.extend({
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
  extractId: function (modelClass, resourceHash) {
    var primaryKey = this.get('primaryKey');
    var id = resourceHash[primaryKey];
    return coerceId(id);
  },

  extractMeta: function (store, requestType, payload) {
    let meta = payload.meta ? payload.meta : undefined,
      isSingle = this.isSinglePayload(payload, requestType);

    meta = meta || {};

    if (findManyRequestTypes.indexOf(requestType) > -1 && !isSingle) {
      keys(payload).forEach(function (key) {
        if (reservedKeys.indexOf(key) > -1) {
          return;
        }

        meta[key] = payload[key];
        delete payload[key];
      });
    }
    if (!isSingle) {
      meta = extractLinksIntoMeta(payload, meta);
    }

    return meta;
  },

  normalizeResponse: function (store, primaryModelClass, payload, id, requestType) {
    const IS_SINGLE = this.isSinglePayload(payload, requestType);
    let documentHash = {
        data: null
      },
      meta = this.extractMeta(store, requestType, payload),
      included = [];

    if (meta) {
      documentHash.meta = meta;
    }

    if (IS_SINGLE) {
      documentHash.data = this.normalize(primaryModelClass, payload, included);
    } else {
      documentHash.data = [];
      payload._embedded = payload._embedded || {};
      let normalizedEmbedded = Object.keys(payload._embedded).map(embeddedKey =>
        payload._embedded[embeddedKey].map(embeddedPayload => {
          return this.normalize(primaryModelClass, embeddedPayload, included);
        }));

      documentHash.data = arrayFlatten(normalizedEmbedded);
    }

    documentHash.included = included;
    return documentHash;
  },

  normalize(primaryModelClass, payload, included) {
    let data = null;

    if (payload) {
      data = {
        id: this.extractId(primaryModelClass, payload),
        type: primaryModelClass.modelName
      };
      let attributes = this.extractAttributes(primaryModelClass, payload);
      let relationships = this.extractRelationships(primaryModelClass, payload, included);
      if (Object.keys(attributes).length > 0) {
        data.attributes = attributes;
      }
      if (Object.keys(relationships).length > 0) {
        data.relationships = relationships;
      }
    }

    return data;
  },

  extractAttributes(primaryModelClass, payload) {
    let keyForAttribute = this.keyForAttribute,
      payloadKey,
      attributes = {};

    Ember.assert('Payload can\'t contain attributes key',
      !payload.hasOwnProperty('attributes'));

    primaryModelClass.eachAttribute((attributeName, attributeMeta)=> {
      payloadKey = keyForAttribute(attributeName, attributeMeta);

      if (!payload.hasOwnProperty(payloadKey)) {
        return;
      }

      attributes[attributeName] = payload[payloadKey];
      delete payload[payloadKey];
    });

    // add attribute links
    if (payload._links) {
      attributes.links = {};
      Object.keys(payload._links).forEach(link => {
        attributes.links[link] = this.extractLink(payload._links[link]);
      });
    }

    return attributes;
  },

  extractRelationship(relationshipModelClass, payload, included) {
    if (Ember.isNone(payload)) {
      return null;
    }

    let relationshipModelName = relationshipModelClass.modelName,
      relationship = {};

    if (Ember.typeOf(payload) === 'object') {
      let relationshipHash = {};
      relationshipHash.id = coerceId(this.extractId({}, payload));
      if (relationshipModelName) {
        relationshipHash.type = this.modelNameFromPayloadKey(relationshipModelName);
        included.push(this.normalize(relationshipModelClass, payload, included));
      }
      relationship = relationshipHash;
    } else {
      relationship = {id: coerceId(payload), type: relationshipModelName};
    }

    return relationship;
  },

  extractRelationships(primaryModelClass, payload, included) {
    let relationships = {},
      embedded = payload._embedded,
      keyForRelationship = this.keyForRelationship,
      keyForLink = this.keyForLink,
      extractLink = this.extractLink,
      links = payload._links;

    if (embedded || links) {
      primaryModelClass.eachRelationship((key, relationshipMeta) => {
        let relationship = null,
          relationshipKey = keyForRelationship(key, relationshipMeta),
          linkKey = keyForLink(key, relationshipMeta);

        if (embedded && embedded.hasOwnProperty(relationshipKey)) {
          let data = null,
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

          let link = payload._links[linkKey],
            useRelated = !relationship.data;

          relationship.links = {
            [useRelated ? 'related' : 'self']: extractLink(link)
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
