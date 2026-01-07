import { FaGithub, FaInstagram, FaLinkedin } from "react-icons/fa6";
import { BiLogoGmail } from "react-icons/bi";

export default function BotNav() {
  return (
    <nav className="mx-auto h-14 w-full max-w-[1400px] border-t border-gray-700 px-3">
      <div className="flex h-full w-full items-center justify-end gap-3 md:gap-3">
        <a
          href="mailto:laboratorymember008@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <BiLogoGmail size={26} className="min-w-fit" />
        </a>

        <a
          href="https://github.com/wenbo68/tonytonyshopper"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <FaGithub size={24} className="min-w-fit" />
        </a>

        <a
          href="https://www.linkedin.com/in/wenboliu68/"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <FaLinkedin size={24} className="min-w-fit" />
        </a>

        <a
          href="https://www.instagram.com/wenboliu68/"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <FaInstagram size={24} className="min-w-fit" />
        </a>
      </div>
    </nav>
  );
}
