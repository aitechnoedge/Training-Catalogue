import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`site-header${menuOpen ? ' menu-open' : ''}`}>
      <a className="site-brand" href="/" aria-label="TechnoEdge home">
        <img className="site-brand__logo" src="/website/assets/technoedge-logo.png" alt="TechnoEdge Learning Services" />
      </a>
      <nav id="e-learning-primary-nav" className="global-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/e-learning/" aria-current="page">E-Learning</a>
        <a href="/catalogue">Catalogue</a>
        <a href="/insights">Insights</a>
        <a href="/careers">Careers</a>
        <a href="/training-roi">Training ROI</a>
      </nav>
      <div className="header-controls">
        <a className="header-cta" href="#contact" onClick={() => setMenuOpen(false)}>Build with us <ArrowUpRight size={15} /></a>
        <button className="global-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="e-learning-primary-nav" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
