import { useState, useEffect } from "react";


export const useWindowWidth = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 769)
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [])

  return isMobile;
}
