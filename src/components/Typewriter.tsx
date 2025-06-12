import { useEffect, useState } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
}

const Typewriter = ({ text, speed = 40 }: TypewriterProps) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i === text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayed}</span>;
};

export default Typewriter;