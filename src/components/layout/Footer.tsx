import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, FileText, Cookie, Building2, Mail } from 'lucide-react';

export function Footer() {
  const { t: _t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container py-8 px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <span className="font-bold text-lg">Majster.AI</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Profesjonalne wyceny dla fachowców. Szybko, łatwo, profesjonalnie.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:kontakt@majster.ai" className="hover:text-primary transition-colors">
                  kontakt@majster.ai
                </a>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Produkt</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/billing" className="text-muted-foreground hover:text-primary transition-colors">
                  Cennik
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-muted-foreground hover:text-primary transition-colors">
                  Szablony
                </Link>
              </li>
              {/* TEMPORARILY DISABLED for MVP stability */}
              {/* <li>
                <Link to="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">
                  Marketplace
                </Link>
              </li> */}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Prawne
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/legal/privacy" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Shield className="h-3 w-3" />
                  Polityka Prywatności
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/terms" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Regulamin
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/cookies" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Cookie className="h-3 w-3" />
                  Polityka Cookies
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/dpa" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Umowa DPA
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/gdpr" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Centrum RODO
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Wsparcie</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="mailto:support@majster.ai" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Pomoc techniczna
                </a>
              </li>
              <li>
                <a 
                  href="mailto:privacy@majster.ai" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Ochrona danych (RODO)
                </a>
              </li>
              <li>
                <a 
                  href="mailto:sales@majster.ai" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Sprzedaż i partnerstwa
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {currentYear} Majster.AI. Wszystkie prawa zastrzeżone.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>🇵🇱 Made in Poland</span>
            <span>•</span>
            <span>RODO Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
