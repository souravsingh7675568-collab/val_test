/** @format */

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";
import { Link } from "react-router-dom";
import { MdEmail } from "react-icons/md";

const Privacy = () => {
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
    <div>
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
            </ul>
          </div>
        )}
      </nav>
      <div className="px-4 py-8 md:px-12 lg:px-24 max-w-7xl mx-auto text-gray-800 pt-20">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 text-center">
          Terms and Conditions
        </h1>
        <div className="space-y-6 text-sm md:text-base lg:text-lg leading-relaxed">
          <p>
            Please read these terms and conditions ("Terms") carefully before
            accessing or using Valmo’s website “valmo.in”, any of the offline
            businesses run under the brand name Valmo, mobile application and
            any of the platforms/tools developed by us from time to time
            (together referred to as Platform). These Terms along with the
            Privacy Policy published on our website ("Privacy Policy") and other
            policies (as may be notified/displayed/published on our
            website/mobile application or any other tool or platform as may be
            notified to you) constitutes a legally binding contract between you
            and the Company. By use of our Platform, you agree to be bound by
            these Terms and any other policies as mentioned above as updated
            from time to time.
          </p>

          <h2 className="text-2xl font-semibold">
            What is Valmo and who operates it?
          </h2>
          <p>
            Valmo is a brand where registered delivery executives and delivery
            partners (together, “Partners”) can offer to provide their logistics
            services.
          </p>
          <p>
            The Platform provided under the brand name “Valmo” are run by Meesho
            Limited (formerly Meesho Private Limited and Fashnear Technologies
            Private Limited) ("Company").
          </p>
          <p>
            The Company does not own, sell, resell, furnish or provide any
            logistics services. Company’s role is limited to facilitating the
            services and associated marketing, facilitating payment collections,
            fulfillment, enquiry management and other incidental services to
            enable the transactions between Partners and end-users.
          </p>

          <h2 className="text-2xl font-semibold">
            When are these Terms applicable and binding on Users?
          </h2>
          <p>
            The Terms and other Company policies as published on our websites
            and/or other tools or platforms are applicable to any person when
            they install, download any tool, visit or access the website or any
            of the tools/platforms of Valmo, or utilize our online or offline
            Platform, which include without limitation browsers, Suppliers,
            merchants, purchasers or contributors of content and onboarded
            Partners (collectively, "User/You").
          </p>
          <p>
            These terms are applicable from the date on which any of our tool or
            application is downloaded/website is accessed or online or offline
            services are utilized or signed up for and/or the date on which
            terms of agreement (i.e., our Terms and any other Valmo policies) is
            updated, creating a legally binding arrangement between the User and
            the Company.
          </p>

          <h2 className="text-2xl font-semibold">
            Whether the Terms or any other Valmo policies can be modified?
          </h2>
          <p>
            Users can review the most current version of the Terms and any other
            Valmo policies at any time on Valmo website. Company reserves the
            right to unilaterally update, change or replace them at any time and
            such amended provisions of the Terms or any other Valmo policy shall
            be effective immediately upon being posted on the website.
          </p>
          <p>
            It is the responsibility of the Users to check this page
            periodically for changes. The Users’ continued use of or access to
            the Platform following the posting of any changes constitutes
            acceptance of those changes.
          </p>

          <h2 className="text-2xl font-semibold">
            What if the Terms are not acceptable to the User?
          </h2>
          <p>
            If the User does not agree with these Terms or the terms of any
            other agreement executed between them and the Company, the User is
            advised to refrain from using the Platform. By use of the Platform,
            it is signified that the User agrees to abide by all our Terms and/
            or policies (as updated from time to time).
          </p>

          <h2 className="text-2xl font-semibold">Eligibility</h2>
          <p>
            You may use the Platform in accordance with our contractual
            arrangement with you and /or as per these Terms. You must be over
            the age of eighteen (18) years and able to understand and agree to
            the terms set forth in these Terms.
          </p>
          <h2 className="text-2xl font-semibold">
            What details are required from Users?
          </h2>
          <p>
            The Users are required to share their personal details including
            name, address, phone number, payment information along with other
            details as mentioned in the form or otherwise requested at the time
            of onboarding or registration, as further detailed under the Privacy
            Policy. By such registration, User consents to be contacted by
            Company via phone calls, SMS notifications, WhatsApp communications,
            e-mails, instant messages or other such means of communication inter
            alia for subscription/services/promotional updates etc.
          </p>
          <p>
            It is the responsibility of the Users to provide the correct contact
            details so that the Company can communicate with the Users. The
            Users understand and agree that if the Company sends any
            communication, including an SMS or reaches out otherwise, but the
            Users do not receive it because the Users’ contact details are
            incorrect, outdated or blocked by the User's service provider, or
            the Users are otherwise unable to receive such communication, the
            Company shall be deemed to have provided the communication to the
            Users effectively.
          </p>
          <p>
            It is the User’s responsibility to provide accurate, current and
            complete information during the onboarding process and to update
            such information to keep it accurate, current and complete.
          </p>

          <h2 className="text-2xl font-semibold">
            Can a User be suspended or terminated from using the Platform?
          </h2>
          <p>
            The Company reserves the right to suspend or terminate the access to
            the Platform (or any part thereof), including blocking any amounts
            due to the User and associated account without notice and the Users
            will remain liable for all amounts due up to and including the date
            of termination, if:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              any information provided during the onboarding process or
              thereafter proves to be inaccurate, not current or incomplete;
              and/or
            </li>
            <li>
              in Company’s assessment, the User has engaged in actions that are
              unlawful, fraudulent, negligent or derogatory to the Company’s
              interests;
            </li>
            <li>
              failed or is suspected to have failed to comply with any term or
              provision of the any agreement executed between you and the
              Company or incase there are any issues in performance or breach of
              metrics identified in the agreement executed between you and the
              Company or breach of applicable law by you;
            </li>
            <li>
              User is found to be non-compliant with these Terms or any other
              agreement executed with the Company.
            </li>
          </ul>
          <p>
            If the violation of the terms or any other agreement gives rise to
            criminal or civil action, the Company may at its sole discretion
            pursue such action.
          </p>
          <p>
            Without prejudice to the above stated rights of the Company, in case
            of alleged fraud or other breach of these terms by User, Company may
            at its sole discretion (a) withhold all amounts payable to such
            User; and (b) impose penalties as the Company may reasonably
            determine and set off such penalties from the monies payable by
            Company to such User.
          </p>
          <p>
            Company shall at times and at their sole discretion reserve the
            right to disable any user identification code or password if any
            User has failed to comply with any of the provisions of these Terms
            or any other agreement executed between you and the Company. Company
            shall have all the rights to take necessary action and claim damages
            that may occur due to User's involvement/participation in any way
            either on their own or through group/s of people, intentionally or
            unintentionally in hacking.
          </p>

          <h2 className="text-2xl font-semibold">
            What are User obligations vis-à-vis the Platform?
          </h2>
          <p>
            User acknowledges and agrees that having access to Platform does not
            grant it any rights in respect to such Platform, Valmo’s website or
            any tools or applications created pursuant to it unless such a right
            is specifically granted to them by the Company. The User understands
            that all the rights in and to the Platform are and shall forever be
            owned by and inure to the benefit of the Company.
          </p>
          <p>
            All information displayed, transmitted or carried on by the Company
            is protected under applicable laws. All rights, including copyright,
            in this website or any other information belonging to the Company
            are owned by the Company.
          </p>
          <p>
            The Platform is provided solely for the use of current and Users to
            interact with Valmo and may not be used by any other person or
            entity or for any other purpose.
          </p>
          <p>
            Any material on the Platform is solely for your personal,
            non-commercial use. You may not copy, modify, publish, translate,
            transmit, distribute, adapt, reproduce, create derivative work from,
            repost, display, decompile, reverse engineer, disassemble or in any
            way commercially exploit any of the content available on the
            Platform, or any other tool or application run under the brand name
            of Valmo. Without the prior written consent of the owner,
            modification of the materials, use of the materials on any other
            website or networked computer environment or use of the materials
            for any purpose other than personal, non-commercial use is a
            violation of the copyrights, trademarks and other proprietary
            rights, and is prohibited. Any use for which you receive any
            remuneration, whether in money or otherwise, is a commercial use for
            the purposes of this clause.
          </p>
          <p>
            You agree that when accessing the Platform, you will not defame,
            abuse, harass, stalk, threaten or otherwise violate the legal rights
            of others.
          </p>
          <p>
            You will not publish, post, upload, distribute or disseminate
            information which:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              is inappropriate, profane, defamatory, infringing, obscene,
              indecent, libellous, invasive of another's privacy, hateful, or
              racially, ethnically objectionable, disparaging, relating or
              encouraging money laundering or gambling, or otherwise unlawful in
              any manner whatever on any topic, name, material or information on
              Valmo website or any related tool or application;
            </li>
            <li>
              does not belong to you or on which you do not have any right;
            </li>
            <li>
              infringes any patent, trademark, copyright or other proprietary
              rights or third party's trade secrets or rights of publicity or
              privacy or shall not be fraudulent or involve the sale of
              counterfeit, unlawful, harmful, dangerous or stolen products;
            </li>
            <li>
              threatens the unity, integrity, defense, security or sovereignty
              of India, friendly relations with foreign states, or public order
              or causes incitement to the commission of any cognizable offence
              or prevents investigation of any offence or is insulting any other
              nation.
            </li>
          </ul>
          <p>
            User will not use another person’s username, password or other
            account information, or another person’s name, likeness, voice,
            image or photograph or impersonate any person or entity or
            misrepresent their identity or affiliation with any person or entity
            in trying to access or use the Platform. User shall not forge
            headers or otherwise manipulate identifiers in order to disguise the
            origin of any message or transmittal User sends to Valmo on or
            through the Platform. You shall not pretend that you are, or that
            you represent, someone else, or impersonate any other individual or
            entity;
          </p>
          <p>
            User will not or attempt to delete or modify any content of Valmo’s
            website or any related tools or applications, including but not
            limited to, disclaimers or proprietary notices such as copyright or
            trademark symbols, logos;
          </p>
          <p>
            User shall not access Platform without authority or use Valmo’s
            website or any related tools or applications in a manner that
            damages, interferes or disrupts it or any part of it;
          </p>
          <p>
            User shall at all times ensure full compliance with the applicable
            law, as amended from time to time, including that of:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              the Information Technology Act, 2000 and the rules thereunder;
            </li>
            <li>
              all applicable domestic laws, rules and regulations (including the
              provisions of any applicable exchange control laws or regulations
              in force); and
            </li>
            <li>
              international laws, foreign exchange laws, statutes, ordinances
              and regulations (including, but not limited to Direct and Indirect
              Taxes applicable as per current statue in the country) regarding
              the use of the Platform.
            </li>
          </ul>
          <p>
            The User shall not engage in any transaction which is prohibited by
            the provisions of any applicable law including exchange control laws
            or regulations for the time being in force.
          </p>
          <p>
            In order to allow Company to use the information supplied by the
            Users, without violating any rights or any laws, Users agree to
            grant the Company a non-exclusive, worldwide, perpetual,
            irrevocable, royalty-free, sub-licensable (through multiple tiers)
            right to exercise the copyright, publicity, database rights or any
            other rights. Company will only use the information in accordance
            with these Terms and/or other Valmo policies, applicable to use of
            Platform.
          </p>
          <p>
            You will not use any deep-link, page-scrape, robot, spider or other
            automatic device, program, algorithm or methodology, or any similar
            or equivalent manual process, to access, acquire, copy or monitor
            any portion of the Valmo website or content, or in any way reproduce
            or circumvent the navigational structure or presentation of the
            website, to obtain or attempt to obtain any materials, documents or
            information through any means not specifically made available
            through the website;
          </p>
          <p>
            You shall not attempt to gain unauthorized access to any portion or
            feature of the Platform, or any other systems or networks connected
            to the Platform or to any server, computer, network, or to any of
            the services offered on or through the Platform, by hacking,
            password "mining" or any other illegitimate means. You agree not to
            use any device, software or routine to interfere or attempt to
            interfere with the proper working of the Platform or any transaction
            being conducted on the Platform, or with any other person's use of
            the Platform.
          </p>
          <p>
            You shall not make any negative, denigrating or defamatory
            statement(s) or comment(s) about Valmo/the Company or the brand name
            or domain name used by Valmo/Company or otherwise engage in any
            conduct or action that might tarnish the image or reputation of
            Valmo/the Company/Platform or otherwise tarnish or dilute any Valmo
            trade or service marks, trade name and/or goodwill associated with
            such trade or service marks, tradename as may be owned or used by
            us.
          </p>
          <p>
            On registration, the Users may receive a password protected account
            and an identification. The Users agree to: maintain the
            confidentiality of their password, if applicable; take full
            responsibility for all activities by Users accessing the website
            through their account; immediately notify the Company of any
            unauthorized use of their account or any other breach of security
            that they become aware of.
          </p>

          <h2 className="text-2xl font-semibold">
            Whether for transacting further to using our Platform, User is
            required to be registered under the Central or State Goods and
            Services Tax Legislations ("GST Laws")?
          </h2>
          <p>
            Company is not obligated towards any direct or indirect tax
            obligation of the User that may arise as a result of User's access
            or use of Platform. The requirement for registration and compliances
            under the GST Laws and other tax laws is the sole responsibility of
            the User, the Company is not liable for any omissions or commissions
            by such User who acts in violation of any applicable law.
            Accordingly, User is advised to seek independent tax advice relating
            to its business and/or transaction in relation to the Platform.
          </p>
          <h2 className="text-2xl font-semibold">
            What is the accuracy and completeness of all information displayed
            on the Valmo website and/ or other tools or application?
          </h2>
          <p>
            Company takes all endeavors to the best of its efforts to keep
            information on its website or any other tools or applications
            accurate. However, the material and content provided in these forums
            is provided for general information only and should not be relied
            upon or used as the sole basis for making decisions without
            consulting primary, more accurate, more complete or timely sources
            of information.
          </p>
          <p>
            Company undertakes no obligation to update, amend or clarify
            information on its website or any other tools or applications,
            including without limitation, pricing information, except as
            required by law. Any reliance on the material on our website or any
            other tools or applications is at the Users’ own risk.
          </p>
          <p>
            The website and/or any other tools or applications may contain
            certain historical information. Historical information, necessarily,
            is not current and is provided for your reference only. The Company
            reserves the right to modify the contents of its website and/or any
            other tools or applications at any time but has no obligation to
            update any information on its website or any other tools or
            applications.
          </p>
          <p>
            User is solely responsible to monitor changes to the information on
            our website or any other tools or applications. No specified update
            or refresh date applied to our website or any other tools or
            applications should be taken to indicate that all information on our
            website or any other tools or applications or pertaining to the
            Platform have been modified or updated.
          </p>
          <p>
            Occasionally there may be information on our website or any other
            tools or applications that contains typographical errors,
            inaccuracies or omissions that may relate to information pertaining
            to the pricing, promotions, offers, transit times and availability.
            Company reserves the right to correct any errors, inaccuracies, or
            omissions, and to change or update information if any information is
            inaccurate at any time without prior notice.
          </p>
          <p>
            The Information is provided ‘as is’ with no guarantee of
            completeness, accuracy, timeliness or of the results obtained from
            the use of the information, and without warranty of any kind,
            express or implied, including, but not limited to warranties of
            performance, merchantability, and fitness for a particular purpose.
          </p>

          <h2 className="text-2xl font-semibold">
            What warranties are provided with respect to the Platform?
          </h2>
          <p>
            The Platform and its contents are provided “AS IS”. Valmo and its
            licensors disclaim any and all warranties, express or implied,
            including without limitation, the implied warranties of
            merchantability and fitness for a particular purpose, title and
            non-infringement regarding the Platform and any content hosted
            thereon and your ability or inability to access or use the Platform.
          </p>
          <p>
            Without prejudice to the forgoing paragraph, Valmo does not warrant
            that:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              The Platform’s (or a part thereof’s) availability at all times; or
            </li>
            <li>
              The information on the Platform is complete, true, accurate or
              non-misleading.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold">
            What information is collected from the User? How does the Company
            deal with the information provided to it by a User?
          </h2>
          <p>
            Company collects various types of information, some information is
            non-personal information and some is personal information.
          </p>
          <p>
            All information about Users that are collected, stored, or
            transmitted is processed for facilitating various operations in
            relation to the Platform and logistics services, including
            registration, order placement, listing, delivery, or payments.
          </p>
          <p>
            For a more comprehensive understanding, Users are encouraged to view
            the Valmo’s Privacy Policy available on the website.
          </p>

          <h2 className="text-2xl font-semibold">
            Does Company use third-party links or third-party tools on its
            website? Are these links and tools accurate and secure?
          </h2>
          <p>
            Certain content available on our website may include materials from
            third parties. Third-party links may direct User to third-party
            websites that are not affiliated with the Company. The Company is
            not responsible for examining or evaluating the content or accuracy
            and does not warrant and will not have any liability or
            responsibility for any third-party materials or websites, or for any
            other materials, products, or services of third parties.
          </p>
          <p>
            Company is not liable for any harm or damages related to the
            purchase or use of goods, services, resources, content, or any other
            transactions made in connection with any third-party websites
            regardless of the existence of any third-party link. Please review
            carefully such third-party’s policies and practices and make sure to
            understand them before engaging in any transactions.
          </p>
          <h2 className="text-2xl font-semibold">
            What happens to the User’s order in case of a lockdown or other
            force majeure event?
          </h2>
          <p>
            Company shall not be liable for any damages whatsoever arising out
            of force majeure or other similar circumstances, directly or
            indirectly affecting Company and/or the Platform. Examples of force
            majeure events include without limitation real or potential labour
            disputes, governmental actions, war or threat of war, sabotage,
            civil unrest, demonstrations, fire, storm, flooding, explosion,
            earthquake, epidemic or pandemic, provisions or limitations of
            materials or resources, inability to obtain the relevant
            authorization, accident, and defect in electricity or
            telecommunication network.
          </p>
          <p>
            Force majeure or other events beyond the Company’s control entitles
            the Company to suspend or limit the Platform until further notice.
          </p>

          <h2 className="text-2xl font-semibold">
            How to contact the Company in case of any grievances regarding
            Services?
          </h2>
          <p>
            All concerns or grievances about Platform should be sent to the
            Company at{" "}
            <a
              href="mailto:support@valmodeliver.in"
              className="text-blue-600 underline"
            >
              support@valmodeliver.in
            </a>
            .
          </p>
          <p>
            Murthy SN is the designated Grievance Officer in respect of this
            Agreement. Any complaints or concerns with regard to the Platform or
            any breach of this Agreement can be directed to the designated
            Grievance Officer in writing at the following address:
          </p>
          <p className="pl-4">
            3rd Floor, Wing-E, Helios Business Park, Kadubeesanahalli Village,
            Varthur Hobli, Outer Ring Road Bellandur, Bangalore, Bangalore
            South, Karnataka, India, 560103
          </p>

          <h2 className="text-2xl font-semibold">Termination Of Use</h2>
          <p>
            We may discontinue, suspend or modify the Platform at any time
            without notice, and may block, terminate or suspend your and any
            users access to Platform at any time in its sole discretion.
          </p>

          <h2 className="text-2xl font-semibold">Severability</h2>
          <p>
            If any part of the provisions contained in these Terms are
            determined to be invalid, or unenforceable to any extent, such
            provision shall be severed from the remaining provisions which shall
            continue to be valid and enforceable to the fullest extent permitted
            by law.
          </p>

          <h2 className="text-2xl font-semibold">Frauds</h2>
          <p>
            Company urges the Users to beware of fake offers and fraudulent
            callers/messengers who may impersonate themselves as representatives
            of the Company. The Company’s authorized representatives will never
            contact the Users to demand money for allocation of hubs or other
            business opportunities with Valmo, for prizes or ask for
            password/PIN/CVV. In the event you are asked for confidential
            details by anyone posing as the Company’s representatives, please
            ask them to communicate with you through email and only respond to
            emails from the valmo.com domain.
          </p>
          <h2 className="text-2xl font-semibold">
            Can User disclose its communication through calls with the Company
            to third parties?
          </h2>
          <p>
            All calls to the Company are completely confidential. However, the
            Users’ calls may be recorded to ensure quality of service. Further,
            for training purposes and to ensure excellent customer service,
            calls from the Company may be monitored and recorded.
          </p>

          <h2 className="text-2xl font-semibold">Indemnity</h2>
          <p>
            You shall indemnify and hold harmless the Company, its affiliates,
            subsidiaries, licensees, and their respective officers, directors,
            agents, and employees, from any claim or demand, including
            third-party claims, or actions including reasonable attorneys' fees,
            made by any third party or penalty imposed due to or arising out of
            your breach of these terms of use, Privacy Policy and other terms
            and conditions, or your violation of any law, rules or regulations
            or the rights (including infringement of intellectual property
            rights) of a third party, wilful misconduct and gross negligence and
            any of your activities conducted in connection with the Platform.
          </p>

          <h2 className="text-2xl font-semibold">
            Miscellaneous provisions applicable to terms
          </h2>
          <p>
            These terms are governed by the laws of India. Any action, suit, or
            other legal proceeding, which is commenced to resolve any matter
            arising under or relating to these Terms or the Platform provided by
            the Company shall be subject to the jurisdiction of the courts at
            Bangalore, India.
          </p>
          <p>
            Company shall have the right to assign its obligations and duties
            under these Terms to any person or entity.
          </p>
          <p>
            The failure of the Company to exercise or enforce any right or
            provision of these Terms shall not constitute a waiver of such right
            or provision.
          </p>
          <p>
            The Platform is controlled and operated from India and the Company
            makes no representation that the content, information or materials
            made available herein are appropriate or will be available for use
            in other locations. Access and use of the Platform from outside
            India is entirely at User's sole risk and User agrees and undertakes
            to be responsible for compliance with all applicable local laws and
            agrees to release, discharge and absolve Company from any liability
            or loss in this respect.
          </p>
          <p>
            Company reserves the right to introduce and initiate new features,
            functionalities and components to Valmo website or any tools or
            applications or any aspect of its offline business and/or change,
            alter, modify, suspend, discontinue or remove the existing ones
            without any prior notice to you. Further, Company is entitled to
            discontinue (either permanently or temporarily) one or more of the
            Platform provided or charge for Service which were early free of
            cost, without any prior notice to User.
          </p>
        </div>
      </div>
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
          <p className="mt-4">&copy; Copyright © 2024. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
