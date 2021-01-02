import {
  createAssociation,
  updateAssociation,
  deleteAssociation,
  getAssociationByCode,
  getAssociations,
} from '../domain/associations';
import conf from '../config/conf';
import {
  createMembership,
  getAssociationById,
  getAssociationMembers,
  getAssociationMemberships,
  getMembershipAssociation,
  getMembershipByCode,
  getMembershipById,
  removeMembership,
} from '../domain/memberships';
import { createDocument } from '../domain/documents';

const usersResolvers = {
  Query: {
    membership: (_, { id }, ctx) => getMembershipById(ctx, id),
    association: (_, { id }, ctx) => getAssociationById(ctx, id),
    associations: (_, __, ctx) => getAssociations(ctx),
    federation: (_, __, ctx) => getAssociationByCode(ctx, conf.get('association:identifier')),
  },
  Subscription: {
    membership: (associationMembership, _, ctx) => getMembershipByCode(ctx, associationMembership.membershipCode),
  },
  Association: {
    members: (association, _, ctx) => getAssociationMembers(ctx, association),
    memberships: (association, _, ctx) => getAssociationMemberships(ctx, association),
  },
  Membership: {
    association: (membership, _, ctx) => getMembershipAssociation(ctx, membership),
  },
  Mutation: {
    documentAdd: (_, { associationId, input }, ctx) => createDocument(ctx, associationId, input),
    associationAdd: (_, { input }, ctx) => createAssociation(ctx, input),
    associationUpdate: (_, { id, input }, ctx) => updateAssociation(ctx, id, input),
    associationDelete: (_, { id }, ctx) => deleteAssociation(ctx, id),
    membershipAdd: (_, { input }, ctx) => createMembership(ctx, input),
    membershipRemove: (_, { id }, ctx) => removeMembership(ctx, id),
  },
};

export default usersResolvers;
