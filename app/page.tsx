'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Menu, X, ArrowRight, Check, Star,
  Globe, CalendarClock, Wrench, Package, FileText,
  Bell, BarChart3, Car, TrendingUp, Shield,
  Mail, Phone,
} from 'lucide-react'
import ThemeToggle from '@/components/admin/ThemeToggle'

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '2 400+', label: 'Garages actifs' },
  { value: '98%',    label: 'Satisfaction client' },
  { value: '6 min',  label: 'Temps de prise en main' },
  { value: '35%',    label: 'Réduction des pannes récurrentes' },
]

const FEATURES = [
  {
    icon:  CalendarClock,
    title: 'Gestion des rendez-vous',
    desc:  'Planifiez, confirmez et reprogrammez les rendez-vous en quelques clics. Rappels automatiques pour réduire les absences.',
  },
  {
    icon:  Wrench,
    title: "Fiches d'intervention",
    desc:  'Créez et suivez chaque intervention avec pièces utilisées, temps technicien et coûts en temps réel.',
  },
  {
    icon:  Package,
    title: 'Stock intelligent',
    desc:  "Alertes de réapprovisionnement automatiques. Ne soyez jamais pris de court sur une pièce critique.",
  },
  {
    icon:  FileText,
    title: 'Facturation intégrée',
    desc:  'Générez des factures conformes, gérez les paiements et suivez les impayés depuis un seul écran.',
  },
  {
    icon:  BarChart3,
    title: 'Statistiques & rapports',
    desc:  "Visualisez votre chiffre d'affaires, la performance de chaque technicien et les tendances de votre garage.",
  },
  {
    icon:  Shield,
    title: 'Sécurité & conformité',
    desc:  'Données hébergées en Afrique, chiffrement bout en bout, accès par rôles pour votre équipe.',
  },
]

const HISTORY_ITEMS = [
  { date: 'Mar 2026',  label: 'Vidange + filtre à huile',      km: '87 450 km' },
  { date: 'Jan 2026',  label: 'Remplacement plaquettes frein', km: '85 200 km' },
  { date: 'Nov 2025',  label: 'Contrôle technique',            km: '82 100 km' },
  { date: 'Juil 2025', label: 'Remplacement courroie',         km: '79 000 km' },
]

const PLANS = [
  {
    name:      'Starter',
    price:     '9 900',
    period:    'FCFA / mois',
    desc:      'Pour les garagistes indépendants qui débutent.',
    highlight: false,
    badge:     null,
    features:  [
      '1 technicien',
      'Rendez-vous illimités',
      "Fiches d'intervention",
      'Facturation basique',
      'Support email',
    ],
  },
  {
    name:      'Pro',
    price:     '24 900',
    period:    'FCFA / mois',
    desc:      'Pour les garages en croissance avec une équipe.',
    highlight: true,
    badge:     'Populaire',
    features:  [
      "Jusqu'à 10 techniciens",
      'Gestion de stock complète',
      'Statistiques avancées',
      'Rappels SMS automatiques',
      'Support prioritaire',
      'Exportation PDF',
    ],
  },
  {
    name:      'Entreprise',
    price:     '59 900',
    period:    'FCFA / mois',
    desc:      'Pour les réseaux de garages et grandes structures.',
    highlight: false,
    badge:     null,
    features:  [
      'Techniciens illimités',
      'Multi-garages',
      'API & intégrations',
      'Tableau de bord multi-sites',
      'Gestionnaire de compte dédié',
      'SLA garanti',
    ],
  },
]

const TESTIMONIALS = [
  {
    quote:    "MyKpokpo a transformé la gestion de mon garage. Je perds moins de temps sur l'administratif et mes clients reçoivent leurs factures instantanément.",
    name:     'Ama Dossou',
    role:     'Directrice, Garage Excellence Lomé',
    initials: 'AD',
  },
  {
    quote:    "Les alertes de stock m'ont évité plusieurs situations critiques. Je commande les pièces au bon moment, plus jamais en rupture sur une réparation urgente.",
    name:     'Kofi Mensah',
    role:     'Propriétaire, Auto Service Kégué',
    initials: 'KM',
  },
  {
    quote:    "L'interface est simple, mon équipe a appris en moins d'une journée. Le suivi des interventions nous a permis d'augmenter notre productivité de 40%.",
    name:     'Sébastien Agbodjan',
    role:     'Gérant, Mécanique Pro Adidogomé',
    initials: 'SA',
  },
]

const NAV_LINKS = [
  { label: 'Fonctionnalités', anchor: 'fonctionnalites' },
  { label: 'Tarifs',          anchor: 'tarifs' },
  { label: 'Témoignages',     anchor: 'temoignages' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('[data-animate]')
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(26px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        [data-animate] { opacity: 0; transform: translateY(26px); }
        [data-animate].animate-in {
          animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .stagger-1 { animation-delay: 0.05s; }
        .stagger-2 { animation-delay: 0.13s; }
        .stagger-3 { animation-delay: 0.21s; }
        .stagger-4 { animation-delay: 0.29s; }
        .stagger-5 { animation-delay: 0.37s; }
        .stagger-6 { animation-delay: 0.45s; }

        :root { --bg-nav: rgba(250,250,248,0.92); }
        .dark  { --bg-nav: rgba(22,22,22,0.92);   }

        .land-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 450;
          transition: color 150ms ease;
        }
        .land-link:hover { color: var(--text-primary); }

        .feat-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }
        .feat-card:hover {
          border-color: var(--accent);
          box-shadow: 0 2px 20px rgba(0,0,0,0.06);
        }

        .plan-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: box-shadow 200ms ease, transform 200ms ease;
        }
        .plan-card:hover {
          box-shadow: 0 6px 28px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        .plan-card.plan-pro { border: 2px solid var(--accent); }

        .testi-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: box-shadow 200ms ease;
        }
        .testi-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

        .mockup-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 11px;
          border-radius: 7px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
        }

        /* ── Responsive ── */
        .nav-desktop { display: flex; }
        .nav-hamburger { display: none; }

        @media (max-width: 768px) {
          .nav-desktop   { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .hero-grid     { flex-direction: column !important; }
          .hero-right    { display: none !important; }
          .stats-grid    { grid-template-columns: 1fr 1fr !important; }
          .feat-top      { grid-template-columns: 1fr !important; }
          .feat-bottom   { grid-template-columns: 1fr 1fr !important; }
          .plans-grid    { grid-template-columns: 1fr !important; }
          .testi-grid    { grid-template-columns: 1fr !important; }
          .footer-grid   { grid-template-columns: 1fr !important; }
          .indiv-grid    { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .feat-bottom { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}>

        {/* ── Navbar ──────────────────────────────────────────────────────── */}
        <header style={{
          position:        'fixed',
          top:             0, left: 0, right: 0,
          height:          64,
          display:         'flex',
          alignItems:      'center',
          padding:         '0 40px',
          zIndex:          50,
          backgroundColor: scrolled ? 'var(--bg-nav)' : 'transparent',
          backdropFilter:  scrolled ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
          borderBottom:    scrolled ? '1px solid var(--border)' : '1px solid transparent',
          transition:      'background-color 220ms ease, border-color 220ms ease',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 7,
              backgroundColor: 'var(--accent-muted)',
            }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'block' }} />
            </span>
            <span className="font-display" style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              MyKpokpo
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="nav-desktop" style={{ alignItems: 'center', gap: 28, marginLeft: 48 }}>
            {NAV_LINKS.map(({ label, anchor }) => (
              <a key={anchor} href={`#${anchor}`} className="land-link">{label}</a>
            ))}
          </nav>

          <div className="nav-desktop" style={{ alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <ThemeToggle />
            <a href="/login" className="land-link" style={{ padding: '0 14px', height: 34, display: 'flex', alignItems: 'center', borderRadius: 7 }}>
              Connexion
            </a>
            <a
              href="/demo"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 34, padding: '0 16px', borderRadius: 7,
                backgroundColor: 'var(--accent)', color: '#FFF',
                fontSize: 13, fontWeight: 500, textDecoration: 'none',
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            >
              Essai gratuit <ArrowRight size={13} strokeWidth={2} />
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className="nav-hamburger" style={{ marginLeft: 'auto', alignItems: 'center', gap: 8 }}>
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 7,
                border: 'none', backgroundColor: 'transparent',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            position: 'fixed', top: 64, left: 0, right: 0, zIndex: 49,
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 24px 20px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {NAV_LINKS.map(({ label, anchor }) => (
              <a
                key={anchor}
                href={`#${anchor}`}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '11px 0', color: 'var(--text-secondary)',
                  textDecoration: 'none', fontSize: 15,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {label}
              </a>
            ))}
            <a
              href="/demo"
              style={{
                marginTop: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                height: 42, borderRadius: 8,
                backgroundColor: 'var(--accent)', color: '#FFF',
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
              }}
            >
              Essai gratuit <ArrowRight size={14} strokeWidth={2} />
            </a>
          </div>
        )}

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section style={{ paddingTop: 112, paddingBottom: 72, padding: '112px 40px 72px', maxWidth: 1200, margin: '0 auto' }}>
          <div className="hero-grid" style={{ display: 'flex', gap: 56, alignItems: 'center' }}>

            {/* Left 60% */}
            <div style={{ flex: '0 0 58%', display: 'flex', flexDirection: 'column', gap: 26 }}>
              <div
                data-animate
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '5px 12px 5px 8px', borderRadius: 100,
                  backgroundColor: 'var(--accent-muted)',
                  border: '1px solid rgba(168,130,62,0.22)',
                  width: 'fit-content',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'block' }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Gestion de garage 100 % africain
                </span>
              </div>

              <h1
                data-animate
                className="font-display stagger-1"
                style={{
                  fontSize: 'clamp(40px, 5.5vw, 70px)',
                  fontStyle: 'italic', fontWeight: 400,
                  lineHeight: 1.06, letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
              >
                Gérez votre garage<br />
                <span style={{ color: 'var(--accent)' }}>comme un expert,</span><br />
                pas comme un comptable.
              </h1>

              <p
                data-animate
                className="stagger-2"
                style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--text-secondary)', maxWidth: 500 }}
              >
                MyKpokpo centralise rendez-vous, interventions, stock et facturation dans une interface pensée pour les garages d&apos;Afrique de l&apos;Ouest. Moins de paperasse, plus de véhicules réparés.
              </p>

              <div data-animate className="stagger-3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href="/demo"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    height: 46, padding: '0 22px', borderRadius: 9,
                    backgroundColor: 'var(--accent)', color: '#FFF',
                    fontSize: 14, fontWeight: 500, textDecoration: 'none',
                    transition: 'opacity 150ms ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
                >
                  Commencer gratuitement <ArrowRight size={14} strokeWidth={2} />
                </a>
                <a
                  href="#fonctionnalites"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    height: 46, padding: '0 22px', borderRadius: 9,
                    border: '1px solid var(--border)', backgroundColor: 'transparent',
                    color: 'var(--text-secondary)', fontSize: 14, fontWeight: 450,
                    textDecoration: 'none',
                    transition: 'border-color 150ms ease, color 150ms ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.borderColor = 'var(--accent)'; el.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)'
                  }}
                >
                  Voir les fonctionnalités
                </a>
              </div>

              {/* Trust avatars */}
              <div data-animate className="stagger-4" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex' }}>
                  {['KM', 'AD', 'SA', 'BK'].map((init, i) => (
                    <span key={init} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: '50%',
                      backgroundColor: 'var(--accent-muted)', color: 'var(--accent)',
                      fontSize: 9, fontWeight: 600,
                      border: '2px solid var(--bg-base)',
                      marginLeft: i === 0 ? 0 : -8,
                      zIndex: 4 - i, position: 'relative',
                    }}>
                      {init}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>2 400+</strong> garages nous font confiance
                </span>
              </div>
            </div>

            {/* Right 40% — UI mockup */}
            <div className="hero-right stagger-2" data-animate style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)', borderRadius: 14,
                padding: 20,
                boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {/* Browser chrome */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['#D64045', '#E8A838', '#3D9970'].map(c => (
                      <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: c, display: 'block' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4, fontFamily: 'monospace' }}>
                    mykpokpo.com/dashboard
                  </span>
                </div>

                {/* KPI mini-cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Interventions', value: '47',   sub: '+8 cette semaine', color: 'var(--success)' },
                    { label: 'CA du mois',    value: '1.2M', sub: 'FCFA',             color: 'var(--accent)'  },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
                      <div className="font-display" style={{ fontSize: 22, fontStyle: 'italic', color: kpi.color, lineHeight: 1.25, marginTop: 2 }}>{kpi.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>{kpi.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                    Activité récente
                  </div>
                  {[
                    { plate: 'TG-4821-A', action: 'Vidange terminée',  tech: 'Kofi M.',      status: 'Terminé',  dot: '#3D9970' },
                    { plate: 'TG-2234-B', action: 'Freins en cours',   tech: 'Ama D.',       status: 'En cours', dot: '#E8A838' },
                    { plate: 'TG-7790-C', action: 'RDV confirmé',      tech: 'Sébastien A.', status: 'Confirmé', dot: '#C8A96E' },
                  ].map(item => (
                    <div key={item.plate} className="mockup-row">
                      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.dot, display: 'block', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.plate} — {item.action}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.tech}</div>
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 500,
                        padding: '2px 7px', borderRadius: 4,
                        backgroundColor: item.dot + '25', color: item.dot, flexShrink: 0,
                      }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Alert banner */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 7,
                  backgroundColor: 'var(--warning-muted)',
                  border: '1px solid rgba(232,168,56,0.25)',
                }}>
                  <Bell size={11} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 450 }}>
                    Stock bas : Filtre à huile Bosch — 3 restants
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <section style={{ padding: '48px 40px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
              {STATS.map((stat, i) => (
                <div key={stat.value} data-animate className={`stagger-${i + 1}`} style={{ textAlign: 'center' }}>
                  <div className="font-display nums" style={{
                    fontSize: 48, fontStyle: 'italic', fontWeight: 400,
                    color: 'var(--accent)', lineHeight: 1, letterSpacing: '-0.02em',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 450 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section id="fonctionnalites" style={{ padding: '88px 40px', maxWidth: 1200, margin: '0 auto' }}>
          <div data-animate style={{ marginBottom: 52, maxWidth: 560 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 100,
              backgroundColor: 'var(--accent-muted)',
              border: '1px solid rgba(168,130,62,0.20)',
              marginBottom: 14,
            }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Fonctionnalités
              </span>
            </div>
            <h2 className="font-display" style={{
              fontSize: 'clamp(30px, 3.5vw, 46px)',
              fontStyle: 'italic', fontWeight: 400,
              lineHeight: 1.1, letterSpacing: '-0.015em',
              color: 'var(--text-primary)', marginBottom: 14,
            }}>
              Tout ce dont votre garage a besoin, rien de superflu.
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
              Une plateforme conçue par et pour les professionnels de l&apos;automobile en Afrique.
            </p>
          </div>

          {/* Top row: 2fr + 1fr */}
          <div className="feat-top" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            {FEATURES.slice(0, 2).map((f, i) => {
              const Icon = f.icon
              return (
                <div key={f.title} data-animate className={`feat-card stagger-${i + 1}`}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    backgroundColor: 'var(--accent-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} style={{ color: 'var(--accent)' }} strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{f.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Bottom row: 4 equal */}
          <div className="feat-bottom" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {FEATURES.slice(2).map((f, i) => {
              const Icon = f.icon
              return (
                <div key={f.title} data-animate className={`feat-card stagger-${i + 1}`}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    backgroundColor: 'var(--accent-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} style={{ color: 'var(--accent)' }} strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── For individuals ─────────────────────────────────────────────── */}
        <section style={{ padding: '72px 40px', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="indiv-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 64, alignItems: 'center' }}>

            {/* Vehicle history mockup */}
            <div data-animate style={{ flex: '0 0 400px', minWidth: 260 }}>
              <div style={{
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border)', borderRadius: 14,
                padding: 20,
                boxShadow: '0 4px 28px rgba(0,0,0,0.07)',
              }}>
                {/* Vehicle header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9,
                    backgroundColor: 'var(--accent-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Car size={17} style={{ color: 'var(--accent)' }} strokeWidth={1.75} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Toyota Corolla 2019</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 1 }}>TG-4821-A</div>
                  </div>
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 500,
                    padding: '3px 8px', borderRadius: 5,
                    backgroundColor: 'var(--success-muted)', color: 'var(--success)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    À jour
                  </span>
                </div>

                {/* Timeline */}
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Historique d&apos;entretien
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {HISTORY_ITEMS.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'block', marginTop: 4, flexShrink: 0 }} />
                        {i < HISTORY_ITEMS.length - 1 && (
                          <span style={{ width: 1, flex: 1, backgroundColor: 'var(--border)', display: 'block', marginTop: 3 }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 450, color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{item.km}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.date}</span>
                            <span style={{
                              fontSize: 9, fontWeight: 500,
                              padding: '2px 6px', borderRadius: 4,
                              backgroundColor: 'var(--success-muted)', color: 'var(--success)',
                              textTransform: 'uppercase', letterSpacing: '0.04em',
                            }}>Terminé</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next service */}
                <div style={{
                  padding: '9px 11px', borderRadius: 8,
                  backgroundColor: 'var(--accent-muted)',
                  border: '1px solid rgba(168,130,62,0.20)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <TrendingUp size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} strokeWidth={1.75} />
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 450 }}>
                    Prochaine vidange recommandée à 92 000 km
                  </span>
                </div>
              </div>
            </div>

            {/* Text */}
            <div data-animate className="stagger-2" style={{ flex: 1, minWidth: 240 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 100,
                backgroundColor: 'var(--accent-muted)',
                border: '1px solid rgba(168,130,62,0.20)',
                marginBottom: 16,
              }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Pour les propriétaires
                </span>
              </div>
              <h2 className="font-display" style={{
                fontSize: 'clamp(26px, 3vw, 38px)',
                fontStyle: 'italic', fontWeight: 400,
                lineHeight: 1.12, letterSpacing: '-0.015em',
                color: 'var(--text-primary)', marginBottom: 16,
              }}>
                L&apos;histoire complète de votre véhicule, accessible en un clic.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 22 }}>
                En tant que client du garage, consultez l&apos;historique d&apos;entretien de votre voiture, recevez des rappels avant chaque échéance et partagez votre carnet numérique lors d&apos;une vente.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  'Historique complet consultable en ligne',
                  'Rappels SMS avant les révisions',
                  'Devis transparent avant chaque intervention',
                  'Carnet numérique partageable',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      backgroundColor: 'var(--success-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>
                      <Check size={10} style={{ color: 'var(--success)' }} strokeWidth={2.5} />
                    </span>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────────── */}
        <section id="tarifs" style={{ padding: '88px 40px', maxWidth: 1200, margin: '0 auto' }}>
          <div data-animate style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 100,
              backgroundColor: 'var(--accent-muted)',
              border: '1px solid rgba(168,130,62,0.20)',
              marginBottom: 14,
            }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tarifs</span>
            </div>
            <h2 className="font-display" style={{
              fontSize: 'clamp(30px, 3.5vw, 46px)',
              fontStyle: 'italic', fontWeight: 400,
              lineHeight: 1.1, letterSpacing: '-0.015em',
              color: 'var(--text-primary)', marginBottom: 12,
            }}>
              Des prix conçus pour l&apos;Afrique.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
              Payez en FCFA. Aucune carte internationale requise. Annulez à tout moment.
            </p>
          </div>

          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, alignItems: 'start' }}>
            {PLANS.map((plan, i) => (
              <div key={plan.name} data-animate className={`plan-card${plan.highlight ? ' plan-pro' : ''} stagger-${i + 1}`}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{plan.name}</span>
                    {plan.badge && (
                      <span style={{
                        fontSize: 9, fontWeight: 600,
                        padding: '3px 9px', borderRadius: 100,
                        backgroundColor: 'var(--accent)', color: '#FFF',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{plan.desc}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span className="font-display nums" style={{
                    fontSize: 34, fontStyle: 'italic', fontWeight: 400,
                    color: plan.highlight ? 'var(--accent)' : 'var(--text-primary)',
                    letterSpacing: '-0.02em', lineHeight: 1,
                  }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.3 }}>{plan.period}</span>
                </div>

                <a
                  href="/demo"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    height: 40, borderRadius: 8,
                    backgroundColor: plan.highlight ? 'var(--accent)' : 'transparent',
                    color: plan.highlight ? '#FFF' : 'var(--text-secondary)',
                    border: plan.highlight ? 'none' : '1px solid var(--border)',
                    fontSize: 13, fontWeight: 500, textDecoration: 'none',
                    transition: 'opacity 150ms ease, background-color 150ms ease, color 150ms ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    if (plan.highlight) { el.style.opacity = '0.85' }
                    else { el.style.backgroundColor = 'var(--bg-elevated)'; el.style.color = 'var(--text-primary)' }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    if (plan.highlight) { el.style.opacity = '1' }
                    else { el.style.backgroundColor = 'transparent'; el.style.color = 'var(--text-secondary)' }
                  }}
                >
                  Commencer <ArrowRight size={13} strokeWidth={2} />
                </a>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  {plan.features.map(feat => (
                    <div key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%',
                        backgroundColor: plan.highlight ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}>
                        <Check size={9} style={{ color: plan.highlight ? 'var(--accent)' : 'var(--text-secondary)' }} strokeWidth={2.5} />
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ────────────────────────────────────────────────── */}
        <section id="temoignages" style={{ padding: '72px 40px', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div data-animate style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 100,
                backgroundColor: 'var(--accent-muted)',
                border: '1px solid rgba(168,130,62,0.20)',
                marginBottom: 14,
              }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Témoignages</span>
              </div>
              <h2 className="font-display" style={{
                fontSize: 'clamp(28px, 3.2vw, 42px)',
                fontStyle: 'italic', fontWeight: 400,
                lineHeight: 1.1, letterSpacing: '-0.015em',
                color: 'var(--text-primary)',
              }}>
                Ce que disent les garagistes africains.
              </h2>
            </div>

            <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {TESTIMONIALS.map((t, i) => (
                <div key={t.name} data-animate className={`testi-card stagger-${i + 1}`}>
                  <div className="font-display" style={{ fontSize: 56, fontStyle: 'italic', lineHeight: 0.7, color: 'var(--accent)', opacity: 0.35, userSelect: 'none' }}>
                    &ldquo;
                  </div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={12} strokeWidth={0} style={{ fill: 'var(--accent)', color: 'var(--accent)' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', flex: 1 }}>{t.quote}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 34, height: 34, borderRadius: '50%',
                      backgroundColor: 'var(--accent-muted)', color: 'var(--accent)',
                      fontSize: 11, fontWeight: 600, flexShrink: 0,
                    }}>
                      {t.initials}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Final ───────────────────────────────────────────────────── */}
        <section style={{ padding: '88px 40px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div data-animate style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 className="font-display" style={{
              fontSize: 'clamp(30px, 4vw, 52px)',
              fontStyle: 'italic', fontWeight: 400,
              lineHeight: 1.08, letterSpacing: '-0.02em',
              color: 'var(--text-primary)', marginBottom: 18,
            }}>
              Votre garage mérite un outil à sa hauteur.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--text-secondary)', marginBottom: 30 }}>
              Rejoignez 2 400+ garages africains qui font confiance à MyKpokpo. Démarrez votre essai gratuit de 30 jours — aucune carte de crédit requise.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/demo"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  height: 48, padding: '0 26px', borderRadius: 9,
                  backgroundColor: 'var(--accent)', color: '#FFF',
                  fontSize: 15, fontWeight: 500, textDecoration: 'none',
                  transition: 'opacity 150ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
              >
                Démarrer gratuitement <ArrowRight size={15} strokeWidth={2} />
              </a>
              <a
                href="/demo"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  height: 48, padding: '0 26px', borderRadius: 9,
                  border: '1px solid var(--border)', backgroundColor: 'transparent',
                  color: 'var(--text-secondary)', fontSize: 15, fontWeight: 450,
                  textDecoration: 'none',
                  transition: 'border-color 150ms ease, color 150ms ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = 'var(--accent)'; el.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)'
                }}
              >
                Voir la démo
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)', padding: '48px 40px 28px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 40, marginBottom: 36 }}>

              {/* Brand */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 6,
                    backgroundColor: 'var(--accent-muted)',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'block' }} />
                  </span>
                  <span className="font-display" style={{ fontSize: 16, fontStyle: 'italic', fontWeight: 500, color: 'var(--text-primary)' }}>
                    MyKpokpo
                  </span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 260, marginBottom: 16 }}>
                  La première plateforme de gestion automobile pensée pour les garages d&apos;Afrique de l&apos;Ouest.
                </p>
                <div style={{ display: 'flex', gap: 7 }}>
                  {[
                    { Icon: Globe, label: 'Site web'    },
                    { Icon: Mail,  label: 'Email'       },
                    { Icon: Phone, label: 'Téléphone'   },
                  ].map(({ Icon, label }) => (
                    <button
                      key={label}
                      title={label}
                      aria-label={label}
                      style={{
                        width: 32, height: 32, borderRadius: 7,
                        border: '1px solid var(--border)', backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 150ms ease, color 150ms ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                      <Icon size={14} strokeWidth={1.75} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Product */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                  Produit
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['Fonctionnalités', 'Tarifs', 'Roadmap', 'Changelog', 'API'].map(item => (
                    <li key={item}><a href="#" className="land-link" style={{ fontSize: 13 }}>{item}</a></li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                  Entreprise
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['À propos', 'Blog', 'Carrières', 'Contact', 'Mentions légales'].map(item => (
                    <li key={item}><a href="#" className="land-link" style={{ fontSize: 13 }}>{item}</a></li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 18, borderTop: '1px solid var(--border)',
              flexWrap: 'wrap', gap: 8,
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                © 2026 MyKpokpo. Tous droits réservés.
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {['Confidentialité', 'CGU', 'Cookies'].map(item => (
                  <a key={item} href="#" className="land-link" style={{ fontSize: 12 }}>{item}</a>
                ))}
                <div style={{ width: 1, height: 14, backgroundColor: 'var(--border)' }} />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
