import './Header.css';
import styles from '../global.module.css';
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function Header() {
  const loc = useLocation();
  const selPage = loc.pathname;
  let navigate = useNavigate();


  return (
    <div className={`Header ${styles.globalheaderback}`}>
      <Button className={styles.globalbuttonback} onClick={() => navigate(selPage === '/yt' ? '/ia' : '/yt')}>
        <p className={styles.globaltitle}>
            Internet Archive
        </p>
        {selPage  === '/yt' ?
          <ArrowBackIcon className={styles.globalicon} disabled></ArrowBackIcon>
          : 
          <ArrowForwardIcon className={styles.globalicon} disabled></ArrowForwardIcon>
        }
        <p className={styles.globaltitle}>
            Youtube-dl
        </p>
      </Button>
    </div>
  );
}

export default Header;
