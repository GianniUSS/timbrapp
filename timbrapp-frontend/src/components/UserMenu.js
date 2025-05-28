import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';
import UpdateIcon from '@mui/icons-material/Update';
import BugReportIcon from '@mui/icons-material/BugReport';

function UserMenu({ anchorEl, open, onClose, onLogout, onUpdate, onDiagnostic }) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 0,
        sx: {
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          width: 200,
        },
      }}
    >
      <MenuItem onClick={onLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <Typography variant="inherit">Logout</Typography>
      </MenuItem>
      <MenuItem onClick={onUpdate}>
        <ListItemIcon>
          <UpdateIcon fontSize="small" />
        </ListItemIcon>
        <Typography variant="inherit">Aggiorna applicazione</Typography>
      </MenuItem>
      <MenuItem onClick={onDiagnostic}>
        <ListItemIcon>
          <BugReportIcon fontSize="small" />
        </ListItemIcon>
        <Typography variant="inherit">Diagnostica</Typography>
      </MenuItem>
    </Menu>
  );
}

export default UserMenu;
