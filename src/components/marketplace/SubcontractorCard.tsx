import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import type { Subcontractor } from '@/hooks/useSubcontractors';

interface SubcontractorCardProps {
  subcontractor: Subcontractor;
  onViewDetails?: () => void;
  onInvite?: () => void;
}

export function SubcontractorCard({ subcontractor, onViewDetails, onInvite }: SubcontractorCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {subcontractor.avatar_url ? (
              <img 
                src={subcontractor.avatar_url} 
                alt={subcontractor.company_name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary">
                  {subcontractor.company_name[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold">{subcontractor.company_name}</h3>
              {subcontractor.contact_name && (
                <p className="text-sm text-muted-foreground">{subcontractor.contact_name}</p>
              )}
            </div>
          </div>
          
          {subcontractor.rating > 0 && (
            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="font-medium">{subcontractor.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({subcontractor.review_count})</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {subcontractor.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {subcontractor.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {subcontractor.location_city && (
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {subcontractor.location_city}
            </Badge>
          )}
          {subcontractor.hourly_rate && (
            <Badge variant="secondary">
              {subcontractor.hourly_rate} zł/godz.
            </Badge>
          )}
        </div>
        
        {(subcontractor.phone || subcontractor.email) && (
          <div className="flex gap-3 text-sm text-muted-foreground">
            {subcontractor.phone && (
              <a href={`tel:${subcontractor.phone}`} className="flex items-center gap-1 hover:text-foreground">
                <Phone className="h-3 w-3" />
                {subcontractor.phone}
              </a>
            )}
            {subcontractor.email && (
              <a href={`mailto:${subcontractor.email}`} className="flex items-center gap-1 hover:text-foreground">
                <Mail className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Szczegóły
            </Button>
          )}
          {onInvite && (
            <Button size="sm" className="flex-1" onClick={onInvite}>
              Zaproś
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
