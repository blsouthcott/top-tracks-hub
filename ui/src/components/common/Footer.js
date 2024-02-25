import React from "react";
import { Link } from "react-router-dom";
import "../../App.css"
import { styles } from "../../utils/styles";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";

export default function Footer () {
  return (
    <footer>
        <p className={styles.hasTextCentered}>
          <strong>Website</strong> by Ben Southcott | <Link to="https://github.com/blsouthcott" target="_blank"><FontAwesomeIcon icon={faGithub} /></Link>
          &nbsp;<Link to="https://www.linkedin.com/in/ben-southcott/" target="_blank"><FontAwesomeIcon icon={faLinkedin} /></Link> 
          {/* The source code is licensed <a href="http://opensource.org/licenses/mit-license.php"> MIT</a>. */}
        </p>
    </footer>
  )
}
