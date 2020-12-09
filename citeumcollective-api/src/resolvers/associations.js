import { createAssociation, getAssociationByCode, getAssociationById } from '../domain/associations';
import conf from '../config/conf';
import {
  createMembership,
  getAssociationMembers,
  getAssociationMemberships,
  getMembershipAssociation,
  getMembershipById,
  removeMembership,
} from '../domain/memberships';

const usersResolvers = {
  Query: {
    membership: (_, { id }, ctx) => getMembershipById(ctx, id),
    association: (_, { id }, ctx) => getAssociationById(ctx, id),
    federation: (_, __, ctx) => getAssociationByCode(ctx, conf.get('association:identifier')),
  },
  Association: {
    members: (association, _, ctx) => getAssociationMembers(ctx, association),
    memberships: (association, _, ctx) => getAssociationMemberships(ctx, association),
  },
  Membership: {
    association: (membership, _, ctx) => getMembershipAssociation(ctx, membership),
  },
  Mutation: {
    associationAdd: (_, { input }, ctx) => createAssociation(ctx, input),
    membershipAdd: (_, { input }, ctx) => createMembership(ctx, input),
    membershipRemove: (_, { id }, ctx) => removeMembership(ctx, id),
  },
};

export default usersResolvers;
