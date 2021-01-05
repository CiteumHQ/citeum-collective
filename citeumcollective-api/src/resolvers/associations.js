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
  updateMembership,
  getAssociationById,
  getAssociationMemberships,
  getMembershipAssociation,
  getMembershipById,
  deleteMembership,
} from '../domain/memberships';
import {
  createApplication,
  createProduct,
  getAssociationProducts,
  getProductApplications,
  deleteProduct,
  deleteApplication,
  getApplicationMemberships,
} from '../domain/products';
import { addMember, getAssociationMembers, removeMember, updateMember } from '../domain/users';

const associationsResolvers = {
  Query: {
    membership: (_, { id }, ctx) => getMembershipById(ctx, id),
    association: (_, { id }, ctx) => getAssociationById(ctx, id),
    associations: (_, __, ctx) => getAssociations(ctx),
    federation: (_, __, ctx) => getAssociationByCode(ctx, conf.get('association:identifier')),
  },
  Subscription: {
    association: (subscription, _, ctx) => getAssociationById(ctx, subscription.association_id),
    membership: (subscription, _, ctx) => getMembershipById(ctx, subscription.membership_id),
  },
  Association: {
    members: (association, _, ctx) => getAssociationMembers(ctx, association),
    memberships: (association, _, ctx) => getAssociationMemberships(ctx, association),
    products: (association, _, ctx) => getAssociationProducts(ctx, association),
  },
  Product: {
    applications: (product, _, ctx) => getProductApplications(ctx, product),
  },
  Application: {
    memberships: (application, _, ctx) => getApplicationMemberships(ctx, application),
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
    productAdd: (_, { associationId, input }, ctx) => createProduct(ctx, associationId, input),
    productDelete: (_, { id }, ctx) => deleteProduct(ctx, id),
    applicationAdd: (_, { productId, input }, ctx) => createApplication(ctx, productId, input),
    applicationDelete: (_, { id }, ctx) => deleteApplication(ctx, id),
  },
};

export default associationsResolvers;
