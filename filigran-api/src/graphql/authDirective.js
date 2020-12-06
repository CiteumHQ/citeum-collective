/* eslint-disable no-underscore-dangle,no-param-reassign */
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { includes, map, filter } from 'ramda';
import { defaultFieldResolver } from 'graphql';
import { AuthRequired, ForbiddenAccess } from '../config/errors';

export const AUTH_DIRECTIVE = 'auth';

// Auth code get from https://www.apollographql.com/docs/graphql-tools/schema-directives.html
// Use object mutation and not conform with eslint but it works pretty well.
class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    this.ensureFieldsWrapped(type);
    // noinspection JSUndefinedPropertyAssignment
    type._requiredCapabilities = this.args.for;
    type._requiredAll = this.args.and;
  }

  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredCapabilities = this.args.for;
    field._requiredAll = this.args.and;
  }

  authenticationControl(func, args) {
    // If a role is required
    const context = args[2];
    const { user } = context;
    if (!user) throw AuthRequired(); // User must be authenticated.
    return func.apply(this, args);
  }

  ensureFieldsWrapped(objectType) {
    const $this = this;
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;
    const fields = objectType.getFields();
    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const { directives } = field.astNode;
      const directiveNames = map((d) => d.name.value, directives);
      const { resolve = defaultFieldResolver, subscribe } = field;
      field.resolve = (...args) =>
        includes(AUTH_DIRECTIVE, directiveNames)
          ? $this.authenticationControl(resolve, args, objectType, field)
          : resolve.apply($this, args);
      if (subscribe) {
        field.subscribe = (...args) => $this.authenticationControl(subscribe, args, objectType, field);
      }
    });
  }
}

export default AuthDirective;
