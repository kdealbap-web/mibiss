import { Link } from 'react-router-dom';
import { BissLogo } from '../brand/BissLogo';
import { useFlowDrawer } from '../../context/FlowDrawer';

export function Footer() {
  const { openFlow } = useFlowDrawer();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <BissLogo variant="white" height={50} style={{ marginBottom: 14 }} />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55 }}>
              Cuenta lo que pasa en tu barrio. Mira qué se está moviendo.
            </p>
          </div>

          <div className="footer-col">
            <h4>BISS</h4>
            <ul>
              <li><Link to="/home#mapa">Mapa de Soledad</Link></li>
              <li><Link to="/home#casos">Casos abiertos</Link></li>
              <li><Link to="/home#barrios">Barrios con bitácora</Link></li>
              <li><Link to="/home#como-funciona">Cómo funciona</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Participa</h4>
            <ul>
              <li>
                <button type="button" className="footer-link-btn" onClick={() => openFlow('reportar')}>
                  Reporta tu caso
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={() => openFlow('testimonio')}>
                  Suma tu voz
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={() => openFlow('apadrinar')}>
                  Apadrina causa
                </button>
              </li>
              <li><Link to="/login">Ingresar</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Equipo Kevin</h4>
            <ul>
              <li><Link to="/home#concejal">El concejal</Link></li>
              <li><Link to="/mi-cuenta">Mi cuenta</Link></li>
              <li><Link to="/login">Panel admin</Link></li>
              <li>
                <a
                  href="https://wa.me/573201234567"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  WhatsApp 320 123 4567
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BISS · Soledad, Atlántico — Solo cosas buenas</span>
          <span>Hecho con cosas buenas</span>
        </div>
      </div>
    </footer>
  );
}
