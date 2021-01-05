/* eslint-disable no-underscore-dangle,no-param-reassign */
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { filter, includes, map } from 'ramda';
import { defaultFieldResolver } from 'graphql';
import { AuthRequired, ForbiddenAccess } from '../config/errors';

export const AUTH_DIRECTIVE = 'auth';

// Auth code get from https://www.apollographql.com/docs/graphql-tools/schema-directives.html
// Use object mutation and not conform with eslint but it works pretty well.
class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    this.ensureFieldsWrapped(type);
    // noinspection JSUndefinedPropertyAssignment
    type._requiredRoles = this.args.for;
    type._requiredAll = this.args.and;
  }

  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredRoles = this.args.for;
    field._requiredAll = this.args.and;
  }

  authenticationControl(func, args, objectType, field) {
    // Get the required Role from the field first, falling back
    // to the objectType if no Role is required by the field:
    const requiredRoles = field._requiredRoles || objectType._requiredRoles || [];
    const requiredAll = field._requiredAll || objectType._requiredAll || false;
    // If a role is required
    const context = args[2];
    const { user } = context;
    if (!user) throw AuthRequired(); // User must be authenticated.
    // Start checking roles
    if (requiredRoles.length === 0) return func.apply(this, args);
    // Check the user roles
    const availableRoles = [];
    for (let index = 0; index < requiredRoles.length; index += 1) {
      const checkRole = requiredRoles[index];
      const matchingRoles = filter((r) => includes(checkRole, r), user.roles);
      if (matchingRoles.length > 0) availableRoles.push(checkRole);
    }
    if (availableRoles.length === 0) throw ForbiddenAccess();
    if (requiredAll && availableRoles.length !== requiredRoles.length) throw ForbiddenAccess();
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
