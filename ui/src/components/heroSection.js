import React from "react";
import Footer from "./footer";
import { styles, toClassName } from "./styles";


export default function HeroSection ({ content, containerStyle }) {
  containerStyle = containerStyle ? `${styles.container} ${containerStyle}` : styles.container;
  return (
    <section className={toClassName(styles.hero, styles.isFullHeight)}>
      <div className={styles.heroBody}>
        <div className={containerStyle}>
          { content }
        </div>
      </div>
      <Footer />
    </section>
  )
}
