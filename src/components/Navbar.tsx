"use client";

import Link from "next/link";
import { Menu, Sprout } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    "Home",
    "Dashboard",
    "Features",
    "About",
    "Contact",
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-green-100 shadow-sm">
      <div className="max-w-7xl mx-auto h-20 px-6 flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center">

            <Sprout className="text-white"/>

          </div>

          <div>

            <h1 className="text-2xl font-bold text-green-700">
              Agro Rate Tracker
            </h1>

            <p className="text-xs text-gray-500">
              Smart Agriculture
            </p>

          </div>

        </div>

        <div className="hidden lg:flex gap-8">

          {links.map((item)=>(
            <Link
            key={item}
            href="#"
            className="font-medium text-gray-700 hover:text-green-600 transition"
            >
              {item}
            </Link>
          ))}

        </div>

        <div className="hidden lg:flex gap-3">

          <button className="px-5 py-2 rounded-xl bg-white border border-green-200 hover:bg-green-50 transition">
            EN
          </button>

          <button className="px-5 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition">
            Login
          </button>

        </div>

        <button
        onClick={()=>setOpen(!open)}
        className="lg:hidden">

          <Menu/>

        </button>

      </div>

      {open && (

        <div className="lg:hidden bg-white border-t">

          {links.map((item)=>(
            <Link
            key={item}
            href="#"
            className="block px-6 py-4 hover:bg-green-50"
            >
              {item}
            </Link>
          ))}

        </div>

      )}

    </nav>
  );
}
