import { getApplicationInfo } from '../domain/settings';

const settingsResolvers = {
  Query: {
    about: (_, __, ctx) => getApplicationInfo(ctx),
  },
};

export default settingsResolvers;
