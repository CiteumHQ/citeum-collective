import React, { useRef, useState } from 'react';
import * as PropTypes from 'prop-types';
import { CloudUploadOutlined } from '@material-ui/icons';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';

const FileUploader = (props) => {
  const { onFileSelection } = props;
  const uploadRef = useRef(null);
  const [doc, setDoc] = useState(null);
  const handleOpenUpload = () => uploadRef.current.click();
  const setFile = (file) => {
    setDoc(file);
    onFileSelection(file);
  };
  return (
    <React.Fragment>
      <input ref={uploadRef} type="file" style={{ display: 'none' }}
        onChange={({ target: { validity, files: [file] } }) =>
          // eslint-disable-next-line implicit-arrow-linebreak
          validity.valid && setFile(file)
        }
      />
      {doc ? (
        <Tooltip title={`Uploading ${doc.name}`} aria-label={`Uploading ${doc.name}`}>
          <IconButton onClick={handleOpenUpload} aria-haspopup="true" color="primary">
            <CloudUploadOutlined /> <span style={{ fontSize: 10, marginLeft: 10 }}>{doc.name}</span>
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title='Select your file' aria-label="Select your file">
          <IconButton onClick={handleOpenUpload} aria-haspopup="true" color="primary">
            {/* eslint-disable-next-line max-len */}
            <CloudUploadOutlined /> <span style={{ fontSize: 10, marginLeft: 10 }}>Select a document</span>
          </IconButton>
        </Tooltip>
      )}
    </React.Fragment>
  );
};

FileUploader.propTypes = {
  onFileSelection: PropTypes.func.isRequired,
};

export default FileUploader;
