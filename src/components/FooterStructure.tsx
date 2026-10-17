import React from 'react';
import { Mail, Phone, MapPin, Linkedin, MessageCircle } from 'lucide-react';
import type { CategoryId } from '../types';
import { CONTACT_EMAIL, CONTACT_PHONES, whatsappUrl } from '../data/siteContact';

interface FooterStructureProps {
  onSelectCategory?: (id: CategoryId) => void;
  onOpenInquiry?: () => void;
}

export const FooterStructure: React.FC<FooterStructureProps> = ({
  onSelectCategory,
  onOpenInquiry,
}) => {
  const handleCategoryClick = (e: React.MouseEvent, catId: CategoryId) => {
    if (onSelectCategory) {
      e.preventDefault();
      onSelectCategory(catId);
    }
  };

  const categoryLink = (catId: CategoryId, label: string) => (
    <a
      href={`/catalogue/${encodeURIComponent(catId)}`}
      onClick={(event) => handleCategoryClick(event, catId)}
      className="hover:text-[#01266A]/70 hover:underline underline-offset-2 transition-colors text-left"
    >
      {label}
    </a>
  );

  return (
    <footer id="technoedge-corporate-footer" className="w-full bg-white text-[rgba(0,0,0,0.72)] border-t border-[rgba(38,102,196,0.14)] mt-auto">
      {/* Main Footer Body */}
      <div className="te-page-container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          
          {/* Col 1: Contact Info */}
          <div className="flex flex-col space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2 border-b border-[rgba(1,38,106,0.12)] pb-2 text-[#01266A]">
              Contact Info
            </h3>
            
            <div className="space-y-4 text-sm text-[rgba(0,0,0,0.68)]">
              {CONTACT_PHONES.map((phone) => (
                <div className="flex items-center gap-3" key={phone.number}>
                  <Phone className="w-4 h-4 text-[#01266A] shrink-0" />
                  <a href={`tel:${phone.e164}`} className="hover:text-[#01266A]/70 transition-colors underline-offset-2 hover:underline">
                    {phone.display}
                  </a>
                  <a href={whatsappUrl(phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${phone.display}`} className="text-[#01266A] hover:text-[#01266A]/70">
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              ))}
              
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#01266A] shrink-0" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[#01266A]/70 transition-colors underline-offset-2 hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <MapPin className="w-4 h-4 text-[#01266A] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block mb-1 text-[#01266A]">Registered Office:</strong>
                  Office No. B-2/201,<br/>
                  Umang Premiere,<br/>
                  G.No.677, 687(P), 6 Tal-Haveli,<br/>
                  Dist-Pune, Wagholi-412207,<br/>
                  Maharashtra, India
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <MapPin className="w-4 h-4 text-[#01266A] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block mb-1 text-[#01266A]">Head Office:</strong>
                  Baner Biz Bay,<br/>
                  Office No. B-704, B-705 & B-706,<br/>
                  7th Floor, Laxman Nagar,<br/>
                  Baner, Pune - 411045,<br/>
                  Maharashtra, India
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 border-b border-[rgba(1,38,106,0.12)] pb-2 text-[#01266A]">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm text-[rgba(0,0,0,0.68)]">
              <li><a href="/about" className="hover:text-[#01266A]/70 hover:underline underline-offset-2 transition-colors">About Us</a></li>
              <li><a href="/services/corporate-training" className="hover:text-[#01266A]/70 hover:underline underline-offset-2 transition-colors">Corporate Training</a></li>
              <li><a href="/e-learning/" className="hover:text-[#01266A]/70 hover:underline underline-offset-2 transition-colors">E-learning Solution</a></li>
              <li><a href="/services/ai-automation-consulting" className="hover:text-[#01266A]/70 hover:underline underline-offset-2 transition-colors">AI &amp; Automation Consulting</a></li>
              <li><a href="/catalogue" className="hover:text-[#01266A]/70 hover:underline underline-offset-2 transition-colors">Explore Programmes</a></li>
              <li><a href="/contact" className="hover:text-[#01266A]/70 hover:underline underline-offset-2 transition-colors" onClick={(e) => { if (onOpenInquiry) { e.preventDefault(); onOpenInquiry(); } }}>Contact Us</a></li>
            </ul>
          </div>

          {/* Col 3: Explore Training */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 border-b border-[rgba(1,38,106,0.12)] pb-2 text-[#01266A]">
              Explore Training
            </h3>
            <ul className="space-y-3 text-sm text-[rgba(0,0,0,0.68)]">
              <li>{categoryLink('role-based', 'Role-Based Training')}</li>
              <li>{categoryLink('tools-technology', 'Tools & Technology')}</li>
              <li>{categoryLink('process-based', 'Process Based')}</li>
              <li>{categoryLink('certifications', 'Certifications')}</li>
              <li>{categoryLink('ai-tools', 'AI Tools')}</li>
              <li>{categoryLink('people-behavioural', 'People & Behavioural')}</li>
            </ul>
          </div>

          {/* Col 4: Follow Us / Policies */}
          <div className="flex flex-col space-y-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-6 border-b border-[rgba(1,38,106,0.12)] pb-2 text-[#01266A]">
                Follow Us
              </h3>
              <a 
                href="https://www.linkedin.com/company/technoedge-learning-services-india-pvt-ltd"
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(115,194,251,0.08)] border border-[rgba(1,38,106,0.12)] text-[#01266A] hover:bg-[#01266A] hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 fill-current" />
              </a>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-6 border-b border-[rgba(1,38,106,0.12)] pb-2 text-[#01266A]">
                Policies
              </h3>
              <ul className="space-y-3 text-sm text-[rgba(0,0,0,0.68)]">
                <li><a href="/terms" className="hover:text-[#01266A]/70 hover:underline underline-offset-2 transition-colors">Terms &amp; Conditions</a></li>
                <li><a href="/privacy" className="hover:text-[#01266A]/70 hover:underline underline-offset-2 transition-colors">Privacy Policy</a></li>
                <li><a href="/editorial-policy" className="hover:text-[#01266A]/70 hover:underline underline-offset-2 transition-colors">Editorial Policy</a></li>
              </ul>
            </div>
          </div>
          
        </div>
      </div>

      {/* Copyright Bottom Bar */}
      <div className="border-t border-[rgba(1,38,106,0.12)] bg-[#F0F7FF]">
        <div className="te-page-container py-6 text-center">
          <p className="text-sm text-[rgba(0,0,0,0.58)]">
            © TechnoEdge Learning Services. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
