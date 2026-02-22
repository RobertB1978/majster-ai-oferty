import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, FileText, Cookie, Building2, Mail } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card mt-auto">
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
              {t('footer.tagline')}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:kontakt@CHANGE-ME.example" className="hover:text-primary transition-colors">
                  kontakt@CHANGE-ME.example
                </a>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/app/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.dashboard')}
                </Link>
              </li>
              <li>
                <Link to="/app/templates" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.templates')}
                </Link>
              </li>
              <li>
                <Link to="/app/jobs" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.projects')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('footer.legal')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/legal/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Shield className="h-3 w-3" />
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/terms"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/cookies"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Cookie className="h-3 w-3" />
                  {t('footer.cookies')}
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/dpa"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('footer.dpa')}
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/rodo"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('footer.gdpr')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:support@CHANGE-ME.example"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('footer.techSupport')}
                </a>
              </li>
              <li>
                <a
                  href="mailto:sales@CHANGE-ME.example"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('footer.sales')}
                </a>
              </li>
              <li>
                <a
                  href="mailto:kontakt@CHANGE-ME.example"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('footer.partnership')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {currentYear} Majster.AI. {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>🇵🇱 {t('footer.madeIn')}</span>
            <span>•</span>
            <span>RODO Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
