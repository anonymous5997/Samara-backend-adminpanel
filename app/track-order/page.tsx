'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Truck, CheckCircle2, AlertCircle, MapPin, Calendar, Weight, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BTN_GOLD, Eyebrow, FIELD, FIELD_LABEL } from '@/components/account/ui';

interface TrackingTimeline {
  date: string;
  status: string;
  activity: string;
  location: string;
}

interface ShipmentData {
  awb: string;
  courier: string;
  currentStatus: string;
  shipmentStatus: string;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveredDate: string | null;
  estimatedDelivery: string | null;
  consigneeName: string;
  deliveredTo: string | null;
  weight: string;
  packages: number;
  timeline: TrackingTimeline[];
}

export default function TrackOrderPage() {
  const [trackingId, setTrackingId] = useState('');
  const [trackingType, setTrackingType] = useState<'order_number' | 'awb'>('order_number');
  const [loading, setLoading] = useState(false);
  const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShipmentData(null);

    if (!trackingId.trim()) {
      setError('Please enter a tracking ID or order number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/track-shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingId: trackingId.trim(),
          trackingType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to fetch tracking information');
      } else {
        setShipmentData(data.data);
      }
    } catch (err: any) {
      console.error('Tracking error:', err);
      setError('An error occurred while fetching tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered')) return 'bg-samara-gold text-samara-cream-ink border-samara-gold';
    if (statusLower.includes('out for delivery')) return 'bg-transparent text-samara-gold border-samara-gold';
    if (statusLower.includes('in transit') || statusLower.includes('shipped')) return 'bg-transparent text-samara-gold border-samara-gold/60';
    if (statusLower.includes('picked')) return 'bg-transparent text-samara-ivory border-samara-ivory/40';
    if (statusLower.includes('pending') || statusLower.includes('order')) return 'bg-transparent text-samara-mute border-samara-ivory/25';
    return 'bg-transparent text-samara-mute border-samara-ivory/25';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-samara-ink text-samara-ivory">
      <div className="sm-container pb-20 pt-12 md:pb-28 md:pt-20 lg:pt-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-end lg:gap-20 xl:gap-28">
        <div>
        <Eyebrow className="sm-anim-fade-up">Track Order</Eyebrow>
        <h1 className="sm-display-l sm-anim-fade-up mt-6 font-light [--anim-delay:80ms]">
          Track Your <span className="sm-accent">Shipment</span>
        </h1>
        <p className="sm-body sm-anim-fade-up mt-5 max-w-[40ch] [--anim-delay:160ms]">
          Get real-time updates on your order delivery status
        </p>
        </div>

        <section aria-labelledby="track-form-title" className="sm-anim-fade-up border border-samara-line bg-samara-char px-6 py-8 sm:px-9 sm:py-10 [--anim-delay:240ms]">
            <h2 id="track-form-title" className="sr-only">Enter Tracking Details</h2>
            <form onSubmit={handleTrack} className="space-y-7">
              <fieldset>
                <legend className={FIELD_LABEL}>Tracking Type</legend>
                <div className="grid grid-cols-2">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="order_number"
                      checked={trackingType === 'order_number'}
                      onChange={(e) => setTrackingType(e.target.value as 'order_number')}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-[48px] items-center justify-center border border-samara-ivory/20 px-3 text-center font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-mute transition-colors duration-300 hover:text-samara-ivory peer-checked:border-samara-gold peer-checked:bg-samara-gold peer-checked:text-samara-cream-ink peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-samara-gold">Order Number</span>
                  </label>
                  <label className="-ml-px cursor-pointer">
                    <input
                      type="radio"
                      value="awb"
                      checked={trackingType === 'awb'}
                      onChange={(e) => setTrackingType(e.target.value as 'awb')}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-[48px] items-center justify-center border border-samara-ivory/20 px-3 text-center font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-mute transition-colors duration-300 hover:text-samara-ivory peer-checked:border-samara-gold peer-checked:bg-samara-gold peer-checked:text-samara-cream-ink peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-samara-gold">AWB / Tracking Number</span>
                  </label>
                </div>
              </fieldset>

              <div>
                <Label htmlFor="trackingId" className={FIELD_LABEL}>
                  {trackingType === 'order_number' ? 'Order Number' : 'AWB / Tracking Number'}
                </Label>
                <Input
                  id="trackingId"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder={trackingType === 'order_number' ? 'e.g. SAMARA12345' : 'e.g. 123456789'}
                  className={FIELD}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'track-error' : undefined}
                />
              {error && (
                <p id="track-error" role="alert" className="mt-3 flex items-start gap-2 font-sans text-sm leading-snug text-[#D9806B]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.25} />
                  <span>{error}</span>
                </p>
              )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(BTN_GOLD, 'w-full')}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                    Fetching tracking data...
                  </>
                ) : (
                  'Track Shipment'
                )}
              </button>
            </form>
        </section>
        </div>

        {shipmentData && (
          <div className="mt-16 grid grid-cols-1 gap-12 border-t border-samara-line pt-14 md:mt-20 md:pt-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20 xl:gap-28">
            <section aria-labelledby="shipment-title" className="h-fit border lg:order-2 lg:sticky lg:top-[calc(var(--sm-header-h)+2rem)] border-samara-line bg-samara-char px-6 py-8 sm:px-9 sm:py-10">
                <div className="flex flex-col gap-5 border-b border-samara-line pb-7 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 id="shipment-title" className="font-serif text-[1.875rem] font-light leading-tight text-samara-ivory">
                      Shipment <span className="sm-accent">Details</span>
                    </h2>
                    <p className="mt-2 break-all font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-samara-mute">AWB: {shipmentData.awb}</p>
                  </div>
                  <span className={`inline-flex h-8 w-fit shrink-0 items-center border px-3 font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] ${getStatusColor(shipmentData.currentStatus)}`}>
                    {shipmentData.currentStatus}
                  </span>
                </div>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-7 pt-8 sm:grid-cols-2">
                  <div className="flex items-start gap-4">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-samara-gold" strokeWidth={1.25} />
                    <div>
                      <dt className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-mute">Courier Partner</dt>
                      <dd className="mt-1.5 font-sans text-[0.9375rem] text-samara-ivory">{shipmentData.courier}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-samara-gold" strokeWidth={1.25} />
                    <div>
                      <dt className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-mute">Estimated Delivery</dt>
                      <dd className="mt-1.5 font-sans text-[0.9375rem] text-samara-ivory">
                        {shipmentData.estimatedDelivery ? formatDate(shipmentData.estimatedDelivery) : 'N/A'}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-samara-gold" strokeWidth={1.25} />
                    <div>
                      <dt className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-mute">Origin</dt>
                      <dd className="mt-1.5 font-sans text-[0.9375rem] text-samara-ivory">{shipmentData.origin}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-samara-gold" strokeWidth={1.25} />
                    <div>
                      <dt className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-mute">Destination</dt>
                      <dd className="mt-1.5 font-sans text-[0.9375rem] text-samara-ivory">{shipmentData.destination}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Weight className="mt-0.5 h-4 w-4 shrink-0 text-samara-gold" strokeWidth={1.25} />
                    <div>
                      <dt className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-mute">Weight</dt>
                      <dd className="mt-1.5 font-sans text-[0.9375rem] tabular-nums text-samara-ivory">{shipmentData.weight} kg</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Box className="mt-0.5 h-4 w-4 shrink-0 text-samara-gold" strokeWidth={1.25} />
                    <div>
                      <dt className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-mute">Packages</dt>
                      <dd className="mt-1.5 font-sans text-[0.9375rem] tabular-nums text-samara-ivory">{shipmentData.packages}</dd>
                    </div>
                  </div>
                </dl>

                {shipmentData.deliveredDate && (
                  <div className="mt-8 border-t border-samara-line pt-7">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-samara-gold" strokeWidth={1.25} />
                      <p className="font-serif text-[1.375rem] font-light text-samara-ivory">Delivered Successfully</p>
                    </div>
                    <p className="mt-2 font-sans text-sm text-samara-mute">
                      Delivered on {formatDate(shipmentData.deliveredDate)}
                      {shipmentData.deliveredTo && ` to ${shipmentData.deliveredTo}`}
                    </p>
                  </div>
                )}
            </section>

            <section aria-labelledby="timeline-title" className="min-w-0 lg:order-1">
              <div className="flex items-baseline justify-between gap-4 border-b border-samara-line pb-5">
                <h2 id="timeline-title" className="font-serif text-[1.875rem] font-light leading-tight text-samara-ivory">Tracking Timeline</h2>
                <p className="font-sans text-xs text-samara-mute">Complete shipment journey</p>
              </div>
                {shipmentData.timeline.length > 0 ? (
                  <ol className="pt-8">
                    {shipmentData.timeline.map((event, index) => (
                      <li key={index} className="group relative border-l border-samara-ivory/20 pb-9 pl-8 last:border-l-transparent last:pb-0">
                        <span aria-hidden className="absolute -left-[5px] top-1.5 h-[9px] w-[9px] rounded-full border border-samara-gold bg-samara-ink group-first:bg-samara-gold" />
                        <div className="space-y-1.5">
                          <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between md:gap-6">
                            <p className="font-serif text-[1.25rem] leading-snug text-samara-ivory group-first:text-samara-gold">{event.status}</p>
                            <p className="shrink-0 font-sans text-[0.6875rem] tabular-nums tracking-[0.08em] text-samara-mute">{formatDate(event.date)}</p>
                          </div>
                          <p className="font-sans text-sm leading-relaxed text-samara-mute">{event.activity}</p>
                          {event.location && (
                            <p className="flex items-center gap-1.5 font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-mute/80">
                              <MapPin className="h-3 w-3" strokeWidth={1.25} />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="py-10 font-sans text-sm text-samara-mute">No tracking events available yet</p>
                )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
