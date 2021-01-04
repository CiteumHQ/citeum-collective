import {
  createAssociation,
  updateAssociation,
  deleteAssociation,
  getAssociationByCode,
  getAssociations,
  addMember,
  removeMember,
  updateMember,
} from '../domain/associations';
import conf from '../config/conf';
import {
  createMembership,
  updateMembership,
  getAssociationById,
  getAssociationMembers,
  getAssociationMemberships,
  getMembershipAssociation,
  getMembershipByCode,
  getMembershipById,
  deleteMembership,
} from '../domain/memberships';

const associationsResolvers = {
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
    associationAdd: (_, { input }, ctx) => createAssociation(ctx, input),
    associationUpdate: (_, { id, input }, ctx) => updateAssociation(ctx, id, input),
    associationDelete: (_, { id }, ctx) => deleteAssociation(ctx, id),
    membershipAdd: (_, { input }, ctx) => createMembership(ctx, input),
    membershipUpdate: (_, { id, input }, ctx) => updateMembership(ctx, id, input),
    membershipDelete: (_, { id }, ctx) => deleteMembership(ctx, id),
    memberAdd: (_, { input }, ctx) => addMember(ctx, input),
    memberUpdate: (_, { input }, ctx) => updateMember(ctx, input),
    memberDelete: (_, { associationId, userId, membershipId }, ctx) =>
      removeMember(ctx, associationId, userId, membershipId),
  },
};

export default associationsResolvers;
