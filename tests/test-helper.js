import resolver from './helpers/resolver';
import {
  setResolver
} from 'ember-qunit';
import Pretender from "pretender";

setResolver(resolver);

document.write('<div id="ember-testing-container"><div id="ember-testing"></div></div>');

QUnit.config.urlConfig.push({ id: 'nocontainer', label: 'Hide container'});
var containerVisibility = QUnit.urlParams.nocontainer ? 'hidden' : 'visible';
document.getElementById('ember-testing-container').style.visibility = containerVisibility;

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
