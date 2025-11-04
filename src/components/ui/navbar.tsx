// components/ui/navbar.tsx (New file)
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FaBars, FaHome, FaPlus, FaRocket, FaUserCheck, FaTrash, FaExternalLinkAlt, FaTimes } from 'react-icons/fa'; // Added FaTimes for close icon

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/dashboard/portfolio", icon: FaHome },
    { name: "How to Add Project", href: "#", icon: FaPlus }, // Placeholder href
    { name: "How to Submit Project", href: "#", icon: FaRocket }, // Placeholder href
    { name: "How to Verify Project", href: "#", icon: FaUserCheck }, // Placeholder href
    { name: "How to Delete Project", href: "#", icon: FaTrash }, // Placeholder href
  ];

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left side: My Portfolio (Always visible) */}
        <div className="flex items-center">
          <Link href="/dashboard/portfolio" className="text-2xl font-bold text-white mr-4">
            My Portfolio
          </Link>

          {/* Desktop Navigation (hidden on small screens) */}
          <div className="hidden md:flex space-x-2">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className={`flex items-center px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors
                  ${item.name === "Home" ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''} // Apply active style for Home
                `}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Right side: Launch New Project button */}
        <Button
          className="hidden md:flex bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-semibold py-2 px-6 rounded-lg shadow-lg"
          asChild
        >
          <Link href="/dashboard/portfolio/add">
            <FaPlus className="mr-2 h-4 w-4" /> Launch New Project
          </Link>
        </Button>

        {/* Mobile Hamburger/Close Icon (visible on small screens) */}
        <div className="md:hidden flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            {isOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Menu (conditionally rendered) */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 mt-4 rounded-lg shadow-lg p-4 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className={`w-full justify-start flex items-center px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors
                ${item.name === "Home" ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''} // Apply active style for Home
              `}
              asChild
              onClick={() => setIsOpen(false)} // Close dropdown on item click
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          ))}
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-semibold py-2 px-6 rounded-lg shadow-lg mt-4"
            asChild
            onClick={() => setIsOpen(false)} // Close dropdown on item click
          >
            <Link href="/dashboard/portfolio/add">
              <FaPlus className="mr-2 h-4 w-4" /> Launch New Project
            </Link>
          </Button>
        </div>
      )}
    </nav>
  );
}