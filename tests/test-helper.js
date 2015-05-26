/* global QUnit */
import resolver from './helpers/resolver';
import {
  setResolver
} from 'ember-qunit';
import Pretender from 'pretender';

setResolver(resolver);

Pretender.prototype.prepareHeaders = function(headers){
  headers['Content-Type'] = 'application/json';
  return headers;
};

Pretender.prototype.prepareBody = function(body){
  if (typeof body === 'string') {
    return body;
  } else {
    return JSON.stringify(body);
  }
};
