import React, { useContext } from 'react';
import { gql, useMutation } from '@apollo/client';
import { UserContext } from '../Context';

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UserProfileInput!) {
    updateProfile(input: $input) {
      firstName
      lastName
    }
  }
`;

const Profile = () => {
  const { me, update } = useContext(UserContext);
  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    onCompleted(data) {
      update({ ...me, ...data.updateProfile });
    },
  });
  const formSubmit = (e) => {
    e.preventDefault();
    const firstName = e.target.firstName.value;
    const lastName = e.target.lastName.value;
    const input = { firstName, lastName };
    updateProfile({ variables: { input } });
  };
  return (<div>
    <form onSubmit={formSubmit}>
      <input type='text' disabled value={me.email}/>
      <br/>
      <input type='text' name='firstName' defaultValue={me.firstName}/>
      <br/>
      <input type='text' name='lastName' defaultValue={me.lastName}/>
      <br/>
      <input type="submit" value="Save!"/>
    </form>
    <hr/>
    <ul>
      {me.accessRights.map((access, index) => <li key={ index }><b>{access.name}</b>: {access.roles.join(', ')}</li>)}
    </ul>
  </div>);
};

export default Profile;
