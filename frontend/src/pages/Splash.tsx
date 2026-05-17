import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import '../styles/splash.css';

const REDIRECT_MS = 7000;

export function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('splash-body');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = reduce ? 2500 : REDIRECT_MS;
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (!cancelled) navigate('/home', { replace: true });
    }, delay);
    const cancel = () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    window.addEventListener('scroll', cancel, { once: true, passive: true });
    window.addEventListener('touchstart', cancel, { once: true, passive: true });
    return () => {
      cancel();
      window.removeEventListener('scroll', cancel);
      window.removeEventListener('touchstart', cancel);
      document.body.classList.remove('splash-body');
    };
  }, [navigate]);

  const enter = () => navigate('/home', { replace: true });

  return (
    <div className="splash-stage">
      <button type="button" className="skip" onClick={enter}>
        Saltar intro →
      </button>

      <div className="scene" aria-hidden="true">
        <div className="pages-stack" />

        <div className="page-left">
          <div className="chapter-num">Prólogo · pág. I</div>
          <h2 className="intro-title">
            Soledad merece <span className="accent">que la cuenten bien.</span>
          </h2>
          <div className="intro-body">
            <p>
              Este libro no es mío. Es de Doña Marlén que carga baldes desde San Vicente para
              hervirle tetero a su hija de dos meses. Es de Édgar, que ya se cayó dos veces en el
              cráter de la calle 30.
            </p>
            <p>
              Es de cada vecino que abre una página y dice <em>"esto es lo que pasa aquí"</em>.
            </p>
            <div className="pull">
              No te prometo nada. Te prometo que cuando algo se mueva, lo vas a ver. Y cuando no,
              también.
            </div>
            <p>Bienvenido al banco de ideas y soluciones de Soledad. Tu capítulo empieza ahora.</p>
          </div>
          <div className="signature-block">
            <div className="sig">Kevin Balvuena</div>
            <div className="who">Concejal de Soledad · período 2024–2027</div>
          </div>
          <div className="page-num">— I —</div>
        </div>

        <div className="page-right">
          <div className="toc-head">Índice de capítulos abiertos</div>
          <h2 className="toc-title">Lo que se está moviendo.</h2>
          <div className="toc-list">
            <div className="toc-row">
              <span className="dot" style={{ background: 'var(--state-critical)' }} />
              <span className="name">Soledad 2000</span>
              <span className="pg">cap. 01</span>
              <div className="state">23 casos · 3 críticos · zona occidental</div>
            </div>
            <div className="toc-row">
              <span className="dot" style={{ background: 'var(--state-progress)' }} />
              <span className="name">Don Bosco</span>
              <span className="pg">cap. 02</span>
              <div className="state">19 casos · 9 en gestión</div>
            </div>
            <div className="toc-row">
              <span className="dot" style={{ background: 'var(--state-critical)' }} />
              <span className="name">La Candelaria</span>
              <span className="pg">cap. 03</span>
              <div className="state">14 casos · 4 críticos · oriental</div>
            </div>
            <div className="toc-row">
              <span className="dot" style={{ background: 'var(--state-resolved)' }} />
              <span className="name">El Hipódromo</span>
              <span className="pg">cap. 04</span>
              <div className="state">11 casos · 3 resueltos esta semana</div>
            </div>
            <div className="toc-row">
              <span className="dot" style={{ background: 'var(--cat-social)' }} />
              <span className="name">San Vicente</span>
              <span className="pg">cap. 06</span>
              <div className="state">6 casos · comedor reabierto</div>
            </div>
          </div>
          <div className="toc-footer-block">
            <div className="yr">211 barrios · 142 casos vivos</div>
            <div className="tag">Edición 2026 · escrita por sus vecinos</div>
          </div>
          <div className="page-num">— II —</div>
        </div>

        <div className="spine-binding" />

        <div className="cover-flap">
          <div className="flap-face flap-front">
            <div className="cover-spine-stripe" />
            <div className="cover-eyebrow">Soledad · Atlántico</div>
            <img
              src="/biss-logo.png"
              alt="BISS — Banco de Ideas y Soluciones de Soledad"
              className="cover-mark"
            />
            <div className="cover-line" />
            <div className="cover-tagline">
              Un libro vivo
              <br />
              escrito por sus vecinos
            </div>
            <div className="cover-edition">EDICIÓN 2026 · TOMO I</div>
          </div>

          <div className="flap-face flap-back">
            <div className="chapter-num">Dedicatoria</div>
            <h2 className="intro-title">
              Para los que insisten <span className="accent">en hacer barrio.</span>
            </h2>
            <div className="intro-body">
              <p>
                Para Doña Eva, que lleva 40 años empujando obras en la 18. Para Don Rafael, que
                firmó doce oficios sin que nadie los lea. Para todas las JAC que reciben cartas
                sin respuesta.
              </p>
              <p>Este libro es de ustedes — yo solo sostengo la pluma.</p>
            </div>
            <div className="signature-block" style={{ marginTop: 'auto' }}>
              <div className="sig" style={{ fontSize: '1.8rem' }}>— K.B.</div>
              <div className="who">Abierto el 14 de mayo de 2026</div>
            </div>
            <div className="page-num">Prólogo</div>
          </div>
        </div>
      </div>

      <div className="below">
        <p className="lema">
          El <span className="accent">primer libro vivo</span> de Soledad — escrito en tiempo
          real por sus vecinos.
        </p>
        <button type="button" className="splash-cta" onClick={enter}>
          Abrir el libro <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
