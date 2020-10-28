import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'react-moment';

const ProfileExperince = ({
  experience: { company, title, location, from, to, description },
}) => {
  return (
    <div>
      <h3 className="text-dark">{company}</h3>
      <p>
        <Moment format="MMM/YYYY">{from}</Moment> -{' '}
        {!to ? ' Now' : <Moment format="MMM/YYYY">{to}</Moment>}
      </p>
      <p>
        <strong>Position: </strong>
        {title}
      </p>
      <p>
        <strong>Description: </strong> {description}
      </p>
    </div>
  );
};

ProfileExperince.propTypes = {
  experience: PropTypes.object.isRequired,
};

export default ProfileExperince;
