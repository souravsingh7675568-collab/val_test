/** @format */
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";
import { MdEmail } from "react-icons/md";

const HomeNew = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Refs for smooth scroll
  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  return (
    <div className="font-sans relative">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-[#0B2A4A] text-white px-6 py-4 flex justify-between items-center z-50 shadow-md">
        {/* Logo */}
        <img
          src="https://www.valmo.in/static-assets/valmo-web/valmo-logo-white.svg"
          alt="Valmo Logo"
          className="w-32"
        />

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-6 text-sm font-medium">
          <li
            onClick={() => scrollToSection(homeRef)}
            className="hover:text-blue-300 cursor-pointer"
          >
            Home
          </li>
          <li
            onClick={() =>
              (window.location.href = "https://www.valmo.in/track")
            }
            className="hover:text-blue-300 cursor-pointer"
          >
            Track Order
          </li>
          <li
            onClick={() => navigate("/client-login")}
            className="cursor-pointer"
          >
            Client Login
          </li>
          <li
            onClick={() => navigate("/multi-login")}
            className="cursor-pointer hover:text-blue-300"
          >
            Login
          </li>
          <li
            onClick={() => scrollToSection(aboutRef)}
            className="hover:text-blue-300 cursor-pointer"
          >
            About
          </li>
          <li
            onClick={() => scrollToSection(contactRef)}
            className="hover:text-blue-300 cursor-pointer"
          >
            Contact Us
          </li>
        </ul>

        {/* Hamburger Button (Mobile Only) */}
        <button
          className="md:hidden text-white text-3xl focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <HiX /> : <HiMenu />}
        </button>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#0B2A4A] md:hidden shadow-md py-4 z-20">
            <ul className="flex flex-col items-center gap-4 font-medium text-base">
              <li
                onClick={() => scrollToSection(homeRef)}
                className="hover:text-blue-300 cursor-pointer"
              >
                Home
              </li>
              <li
                onClick={() =>
                  (window.location.href = "https://www.valmo.in/track")
                }
                className="hover:text-blue-300 cursor-pointer"
              >
                Track Order
              </li>
              <li
                onClick={() => scrollToSection(aboutRef)}
                className="hover:text-blue-300 cursor-pointer"
              >
                About
              </li>
              <li
                onClick={() => scrollToSection(contactRef)}
                className="hover:text-blue-300 cursor-pointer"
              >
                Contact Us
              </li>
              <li
                onClick={() => navigate("/client-login")}
                className="cursor-pointer"
              >
                Customer Dashboard
              </li>
              <li
                onClick={() => navigate("/multi-login")}
                className="cursor-pointer hover:text-blue-300"
              >
                Login
              </li>
            </ul>
          </div>
        )}
      </nav>
      <div className=" pt-16">
        {/* Hero Section */}
        <section
          ref={homeRef}
          className="flex flex-col md:flex-row items-center justify-between"
        >
          {/* Left side */}
          <div className="hidden md:flex bg-gradient-to-r from-cyan-400 to-blue-300 w-full md:w-1/2 p-10 h-[400px] flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B2A4A] mb-4">
              A trusted partner in <br /> simplifying logistics
            </h2>
            <button
              onClick={() => navigate("/agent/agent-dashboard")}
              className="bg-[#0B2A4A] text-white px-6 py-2 rounded shadow hover:bg-blue-900 w-fit"
            >
              Join us Now
            </button>
          </div>

          {/* Right side image */}
          <div className="w-full md:w-1/2 h-[400px]">
            <img
              src="/images/valmo-deliveryBoy.jpg"
              alt="Delivery Boy"
              className="object-cover w-full h-full"
            />
          </div>
        </section>

        {/* Sub Section */}
        <section
          ref={aboutRef}
          className="bg-[#0B2A4A] text-white px-6 py-20 text-center md:text-left"
        >
          <h3 className="text-xl md:text-2xl font-bold mb-3">
            We are a trusted partner in simplifying logistics
          </h3>
          <p className="max-w-3xl">
            Our aim is to streamline the logistics process - offering a smooth
            and efficient delivery experience, all while delivering excellent
            value by offering the lowest cost.
          </p>
        </section>

        {/* Stats Section */}
        <section className="bg-white shadow-md rounded-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto -mt-8 relative z-10">
          <div className="text-center">
            <img
              src="https://www.valmo.in/static-assets/valmo-web/box-bookmark.svg"
              alt="Orders Icon"
              className="mx-auto w-10 h-10"
            />
            <h4 className="text-[22px] font-bold mt-3">40 Lac+</h4>
            <p className="text-base text-gray-600">Orders picked per day</p>
          </div>
          <div className="text-center">
            <img
              src="https://www.valmo.in/static-assets/valmo-web/delivery-to-customer.svg"
              alt="Delivery Icon"
              className="mx-auto w-10 h-10"
            />
            <h4 className="text-[22px] font-bold mt-3">70k+</h4>
            <p className="text-base text-gray-600">Delivery pilots</p>
          </div>
          <div className="text-center">
            <img
              src="https://www.valmo.in/static-assets/valmo-web/valmo_handshake.svg"
              alt="Partners Icon"
              className="mx-auto w-10 h-10"
            />
            <h4 className="text-[22px] font-bold mt-3">8k+</h4>
            <p className="text-base text-gray-600">Partners</p>
          </div>
          <div className="text-center">
            <img
              src="https://www.valmo.in/static-assets/valmo-web/location-pin-blue.svg"
              alt="PIN Code Icon"
              className="mx-auto w-10 h-10"
            />
            <h4 className="text-[22px] font-bold mt-3">17k+</h4>
            <p className="text-base text-gray-600">PIN codes served</p>
          </div>
        </section>

        {/* Partner Section */}
        <section className="max-w-6xl mx-auto mt-16 px-4 md:px-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-20">
            {/* Image Card */}
            <div className="w-full md:w-1/2 bg-white rounded-xl shadow-md p-4">
              <img
                src="/images/valmo-delivery-to-customer.jpg"
                alt="Valmo Pilot"
                className="rounded-xl w-full h-auto object-cover"
              />
            </div>

            {/* Text Card */}
            <div className="w-full md:w-1/2 bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl md:text-2xl font-bold mb-4">
                Become a Valmo Pilot (Delivery Partner)
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 text-[16px]">
                <li>
                  Earn ₹15,000 – ₹30,000/month with flexible working hours
                </li>
                <li>Delivery in your local area – No long commutes</li>
                <li>Zero investment – Bring your smartphone & 2-wheeler</li>
                <li>Easy onboarding – Start earning in just 24 hours</li>
                <li>Be your boss – Work full-time or part-time</li>
                <li>Backed by Meesho – Trusted by 100 million+ customers</li>
              </ul>
              <button
                onClick={() => navigate("/agent/agent-dashboard")}
                className="bg-[#0B2A4A] text-white px-6 py-2 rounded mt-6 shadow hover:bg-blue-900"
              >
                Join us Now
              </button>
            </div>
          </div>
        </section>

        {/* Delivery Hub Section */}
        <section className="max-w-6xl mx-auto mt-16 px-4 md:px-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-20">
            <div className="w-full md:w-1/2 bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl md:text-2xl font-bold mb-4">
                Start Your Delivery Hub with Valmo
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 text-[16px]">
                <li>
                  Earn ₹30,000 - ₹50,000/month with consistent daily demand
                </li>
                <li>Investment: Just ₹1 – 2 Lakhs</li>
                <li>
                  Partner with Meesho – India’s largest social commerce platform
                </li>
                <li>
                  Full operational support – Tech, training & process know-how
                </li>
                <li>
                  No prior experience needed – We help you build from scratch
                </li>
                <li>
                  Impact your community – Create 10–15+ local delivery jobs
                </li>
                <li>
                  Build a reliable, scalable logistics business – backed by
                  Meesho
                </li>
              </ul>
              <button
                onClick={() => navigate("/agent/agent-dashboard")}
                className="bg-[#0B2A4A] text-white px-6 py-2 rounded mt-6 shadow hover:bg-blue-900"
              >
                Join us Now
              </button>
            </div>
            {/* Image Card */}
            <div className="w-full md:w-1/2 bg-white rounded-xl shadow-md p-4">
              <img
                src="/images/valmo-delivery-group.jpg"
                alt="Valmo Delivery Hub"
                className="rounded-xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          ref={contactRef}
          className="bg-[#0B2A4A] text-white mt-20 pt-10 pb-6 px-6"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
            {/* Left Side */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-20">
              {/* Logo */}
              <img
                src="https://www.valmo.in/static-assets/valmo-web/valmo-logo-white.svg"
                alt="Valmo Logo"
                className="w-32 md:w-48 md:mb-24"
              />

              {/* Address and Email */}
              <div>
                <h4 className="text-lg font-semibold mb-2">
                  Fashnear Technologies Private Limited
                </h4>

                {/* Location */}
                <div className="flex items-start text-sm text-gray-200 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mt-1 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                    />
                    <circle cx="12" cy="11" r="3" fill="currentColor" />
                  </svg>
                  <p className="leading-relaxed">
                    Fashnear Technologies Private Limited,
                    <br />
                    CIN: U74900KA2015PTC082263
                    <br />
                    3rd Floor, Wing-E, Helios Business Park,
                    <br />
                    Kadubeesanahalli Village, Varthur Hobli,
                    <br />
                    Outer Ring Road Bellandur, Bangalore South,
                    <br />
                    Karnataka, India, 560103
                  </p>
                </div>

                {/* Email */}
                <div className="flex items-center text-sm text-gray-200 gap-2.5">
                  <MdEmail />
                  <span>hello@valmodeliver.in</span>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="mt-8 md:mt-3 md:mr-10">
              <ul className="text-xl text-gray-200 font-semibold space-y-2">
                <li className="hover:underline cursor-pointer">
                  <span>Legal</span>
                </li>
                <li>
                  <Link to="/privacy" className="hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:underline">
                    Terms of use
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Disclaimer */}
          <div className="max-w-7xl mx-auto mt-6 border-t border-gray-500 pt-4 text-xs text-gray-300">
            <p className="italic">
              Disclaimer: Any official communication for business related
              formalities will be sent by Valmo using our authorised official
              email addresses (@valmodeliver.in or @meesho.com). Kindly DO NOT
              interact with any communications or requests for payments from any
              other sources or share any personal information.
            </p>
            <p className="mt-4">
              &copy; Copyright © 2024. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomeNew;
