import React, { useState } from 'react';
import { Button, Modal, Box, Typography } from '@mui/material';

interface PopupButtonProps {
  	buttonText?: string;
  	popupTitle?: string;
	messageContent?: React.ReactNode;
}

const PopupButton: React.FC<PopupButtonProps> = ({buttonText = "Get AI Insights", messageContent ="something"}) => 
{
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  return (
    <div>
		  <Button variant="contained" onClick={handleOpen}>{buttonText}</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Popup Title
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
					  {messageContent ? messageContent : "NA"}
          </Typography>
          <Button onClick={handleClose}>Close</Button>
        </Box>
      </Modal>
    </div>
  );
};

export default PopupButton;