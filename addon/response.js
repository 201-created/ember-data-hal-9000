import Ember from 'ember';

export default class Response {
  constructor(store) {
    this._data = null;
    this._included = [];

    this._resourceStack = [];
    this.store = store;
  }

  currentResource() {
    return this._resourceStack[this._resourceStack.length - 1];
  }

  pushResource(resource, isCollection, callback) {
    Ember.assert('pushed resource must have `type`', !!resource.type);

    if (!this.currentResource()) {
      this.pushPrimary(resource, isCollection);
    } else {
      this.pushRelationship(this.currentResource(), resource, isCollection);
    }

    this._resourceStack.push(resource);
    callback();
    this._resourceStack.pop();
  }

  pushPrimary(resource, isCollection=false) {
    if (isCollection) {
      if (!this._data) { this._data = []; }
      Ember.assert('Cannot push primary onto a collection if primary data is not at an array',
                   Array.isArray(this._data));
      this._data.push(resource);
    } else {
      if (!this._data) { this._data = {}; }
      Ember.assert('Cannot push primary onto a singular object if it was previously pushed onto an array',
                   !Array.isArray(this._data));
      this._data = resource;
    }
  }

  pushRelationship(resource, relationship, isCollection) {
    resource.pushRelationship(relationship, isCollection);
    this._included.push(relationship);
  }

  primaryData() {
    if (Array.isArray(this._data)) {
      return this._data.map((resource) => resource.toJSON());
    } else {
      return this._data.toJSON();
    }
  }

  toJSON() {
    let result = {
      data: this.primaryData(),
      included: this._included.map((i) => i.toJSON())
    };

    if (!result.included.length) {
      delete result.included;
    }

    return result;
  }
}
