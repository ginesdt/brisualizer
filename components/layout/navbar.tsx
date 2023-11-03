"use client";

import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";

export default function NavBar() {
  const pathname = usePathname()

  function linkActive(link: string[]): boolean {
    return link.some((l) => l === pathname);
  }

  const selectedStyles = "border-2 border-blue-500 rounded-3xl text-blue-500";
  const linkClasses = (link: string[]) => `flex items-center font-display text-2xl px-8 ${linkActive(link) ? selectedStyles : ""}`;

  return (
    <>
      <div className={"fixed top-0 w-full flex justify-center border-b border-gray-200 bg-amber-200 backdrop-blur-xl z-30 transition-all"}>
        <div className="mx-5 flex h-16 max-w-screen-xl w-full space-x-16">
          <Link href="/" className="flex items-center text-2xl pr-32 text-[#e1864c] font-light ">
            <Image
              src="/img/brisualizer-logo.png"
              alt="Brisualizer logo"
              width="40"
              height="40"
              className="mr-2 rounded-sm" />
            <p>Brisualizer</p>
          </Link>
          <Link href="/" className={linkClasses(["/", "/optimism"])}>
            <Image
              src="/img/optimism-logo.svg"
              alt="Optimism logo"
              width="30"
              height="30"
              className="mr-2 rounded-sm" />
            <p>Optimism</p>
          </Link>
          <Link href="/base" className={linkClasses(["/base"])}>
            <Image
              src="/img/base-logo.svg"
              alt="Base logo"
              width="30"
              height="30"
              className="mr-2 rounded-sm" />
            <p>Base</p>
          </Link>
          {/*<Link href="/opbnb" className={linkClasses(["/opbnb"])}>*/}
          {/*  <Image*/}
          {/*    src="/img/opbnb-logo.svg"*/}
          {/*    alt="opBNB logo"*/}
          {/*    width="30"*/}
          {/*    height="30"*/}
          {/*    className="mr-2 rounded-sm" />*/}
          {/*  <p>opBNB</p>*/}
          {/*</Link>*/}
        </div>
      </div>
    </>
  );
}
