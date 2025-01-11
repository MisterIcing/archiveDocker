import './Header.css';
import styles from '../global.module.css';
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@mui/material";

function Header() {
  // const loc = useLocation();
  // const selPage = loc.pathname;
  let navigate = useNavigate();


  return (
    <div className={`Header ${styles.globalheaderback}`}>
      <Button className={styles.globalbuttonback} onClick={() => navigate('/ia')}>
        <p className={styles.globaltitle}>
            Internet Archive
        </p>
      </Button>
    </div>
  );
}

export default Header;
