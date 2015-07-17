import Ember from 'ember';

function isEmptyObject(object) {
  return Object.keys(object).length === 0;
}

export default class Resource {
  constructor({id, key, type, attributes}) {
    this.id = id;
    this.type = type;
    this.key = key;
    this.attributes = attributes;
    this.relationships = {};
  }

  // http://jsonapi.org/format/#document-resource-object-relationships
  /**
   * relationship must contain at least one of: `links`, `data`, `meta`
   *
   * `data` is a resource linkage (http://jsonapi.org/format/#document-resource-object-linkage),
   *   and must be one of `null`, `[]`, a single resource identifier (object),
   *   or an array of resource identifier objects
   */
  pushRelationship(relationshipResource, isCollection=false) {
    const key = relationshipResource.key;
    if (!this.relationships[key]) {
      this.relationships[key] = {
        // FIXME optionally add links and meta
        data: null
      };
    }

    const resourceIdentifier = relationshipResource.toIdentifier();
    if (isCollection) {
      if (!this.relationships[key].data) { this.relationships[key].data = []; }
      Ember.assert('Cannot push relationship as a collection unless `data` is an array',
                   Array.isArray(this.relationships[key].data));
      this.relationships[key].data.push(resourceIdentifier);
    } else {
      if (!this.relationships[key].data) { this.relationships[key].data = {}; }
      Ember.assert('Cannot push relationship as singular when  `data` is an array',
                   !Array.isArray(this.relationships[key].data));
      Ember.assert(`Cannot overwrite pushed singular relationship of key ${key}`,
                   isEmptyObject(this.relationships[key].data));

      this.relationships[key].data = resourceIdentifier;
    }
  }

  /**
   * returns a resource identifier object
   * see http://jsonapi.org/format/#document-resource-identifier-objects
   */
  toIdentifier() {
    return {
      id: this.id,
      type: this.type
      // FIXME optionally include meta
    };
  }

  toJSON() {
    let result = {
      id: this.id,
      type: this.type,
      attributes: this.attributes,
      relationships: this.relationships
      // FIXME optionally add links, meta
    };

    if (isEmptyObject(result.relationships)) {
      delete result.relationships;
    }

    return result;
  }
}
