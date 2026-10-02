'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Truck, CheckCircle2, AlertCircle, MapPin, Calendar, Weight, Box } from 'lucide-react';

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
    if (statusLower.includes('delivered')) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (statusLower.includes('out for delivery')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (statusLower.includes('in transit') || statusLower.includes('shipped')) return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
    if (statusLower.includes('picked')) return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    if (statusLower.includes('pending') || statusLower.includes('order')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-samara-ivory/60 bg-samara-ivory/5 border-samara-ivory/10';
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
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-4xl">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            Shipments
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory mb-6">
            Track <em className="italic text-samara-gold">Order</em>
          </h1>
          <p className="text-sm font-sans tracking-wide text-samara-ivory/60">
            Get real-time updates on your delivery status
          </p>
        </div>

        {/* INPUT FORM */}
        <div className="bg-samara-void1 border border-samara-ivory/10 p-8 md:p-12 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-samara-gold/30 -mt-px -mr-px hidden md:block" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-b border-l border-samara-gold/30 -mb-px -ml-px hidden md:block" />
          
          <form onSubmit={handleTrack} className="space-y-8 relative z-10">
            
            <div className="space-y-4">
              <label className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">Tracking Type</label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${trackingType === 'order_number' ? 'border-samara-gold bg-samara-gold/10' : 'border-samara-ivory/30 group-hover:border-samara-ivory/60'}`}>
                    {trackingType === 'order_number' && <div className="w-2 h-2 rounded-full bg-samara-gold" />}
                  </div>
                  <input
                    type="radio"
                    value="order_number"
                    checked={trackingType === 'order_number'}
                    onChange={(e) => setTrackingType(e.target.value as 'order_number')}
                    className="sr-only"
                  />
                  <span className={`text-sm font-sans tracking-wide transition-colors ${trackingType === 'order_number' ? 'text-samara-ivory' : 'text-samara-ivory/60 group-hover:text-samara-ivory/80'}`}>Order Number</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${trackingType === 'awb' ? 'border-samara-gold bg-samara-gold/10' : 'border-samara-ivory/30 group-hover:border-samara-ivory/60'}`}>
                    {trackingType === 'awb' && <div className="w-2 h-2 rounded-full bg-samara-gold" />}
                  </div>
                  <input
                    type="radio"
                    value="awb"
                    checked={trackingType === 'awb'}
                    onChange={(e) => setTrackingType(e.target.value as 'awb')}
                    className="sr-only"
                  />
                  <span className={`text-sm font-sans tracking-wide transition-colors ${trackingType === 'awb' ? 'text-samara-ivory' : 'text-samara-ivory/60 group-hover:text-samara-ivory/80'}`}>AWB / Tracking Number</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <label htmlFor="trackingId" className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">
                {trackingType === 'order_number' ? 'Order Number' : 'AWB / Tracking Number'}
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  id="trackingId"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder={trackingType === 'order_number' ? 'e.g. SAMARA12345' : 'e.g. 123456789'}
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-14 text-sm font-sans placeholder:text-samara-ivory/20 transition-colors flex-1"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 px-10 bg-samara-gold hover:bg-samara-goldDeep text-samara-void rounded-none font-sans text-[11px] tracking-[0.2em] uppercase transition-colors shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Track Shipment'
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 text-sm font-sans text-red-400 bg-[#150a0a] p-4 border border-red-500/20">
                <AlertCircle className="w-4 h-4 stroke-[1.5]" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* RESULTS */}
        {shipmentData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* OVERVIEW */}
            <div className="bg-samara-void1 border border-samara-ivory/10 p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-samara-ivory/10 pb-8 mb-8">
                <div>
                  <h2 className="text-2xl font-serif text-samara-gold mb-1">
                    Shipment Details
                  </h2>
                  <p className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/40">AWB: {shipmentData.awb}</p>
                </div>
                <span className={`inline-flex px-4 py-2 border text-[10px] font-sans tracking-[0.2em] uppercase ${getStatusColor(shipmentData.currentStatus)}`}>
                  {shipmentData.currentStatus}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                <div>
                  <div className="flex items-center gap-2 text-samara-gold mb-2">
                    <Truck className="w-4 h-4 stroke-[1.5]" />
                    <p className="text-[10px] font-sans tracking-[0.2em] uppercase">Courier Partner</p>
                  </div>
                  <p className="text-sm font-sans text-samara-ivory">{shipmentData.courier}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-samara-gold mb-2">
                    <Calendar className="w-4 h-4 stroke-[1.5]" />
                    <p className="text-[10px] font-sans tracking-[0.2em] uppercase">Estimated Delivery</p>
                  </div>
                  <p className="text-sm font-sans text-samara-ivory">
                    {shipmentData.estimatedDelivery ? formatDate(shipmentData.estimatedDelivery) : 'N/A'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-samara-gold mb-2">
                    <Weight className="w-4 h-4 stroke-[1.5]" />
                    <p className="text-[10px] font-sans tracking-[0.2em] uppercase">Weight</p>
                  </div>
                  <p className="text-sm font-sans text-samara-ivory">{shipmentData.weight} kg</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-samara-gold mb-2">
                    <MapPin className="w-4 h-4 stroke-[1.5]" />
                    <p className="text-[10px] font-sans tracking-[0.2em] uppercase">Origin</p>
                  </div>
                  <p className="text-sm font-sans text-samara-ivory">{shipmentData.origin}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-samara-gold mb-2">
                    <MapPin className="w-4 h-4 stroke-[1.5]" />
                    <p className="text-[10px] font-sans tracking-[0.2em] uppercase">Destination</p>
                  </div>
                  <p className="text-sm font-sans text-samara-ivory">{shipmentData.destination}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-samara-gold mb-2">
                    <Box className="w-4 h-4 stroke-[1.5]" />
                    <p className="text-[10px] font-sans tracking-[0.2em] uppercase">Packages</p>
                  </div>
                  <p className="text-sm font-sans text-samara-ivory">{shipmentData.packages}</p>
                </div>
              </div>

              {shipmentData.deliveredDate && (
                <div className="mt-10 bg-[#0a1a10] border border-green-500/20 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="font-serif text-lg text-green-400 mb-1">Delivered Successfully</p>
                    <p className="text-sm font-sans text-green-400/70">
                      Delivered on {formatDate(shipmentData.deliveredDate)}
                      {shipmentData.deliveredTo && ` to ${shipmentData.deliveredTo}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* TIMELINE */}
            <div className="bg-samara-void1 border border-samara-ivory/10 p-8 md:p-10">
              <h2 className="text-2xl font-serif text-samara-gold mb-8">Tracking Timeline</h2>
              
              {shipmentData.timeline.length > 0 ? (
                <div className="space-y-6">
                  {shipmentData.timeline.map((event, index) => (
                    <div key={index} className="relative pl-8 pb-6 border-l border-samara-ivory/10 last:border-l-0 last:pb-0">
                      <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-samara-gold" />
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                          <p className="font-serif text-lg text-samara-ivory">{event.status}</p>
                          <p className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/40">{formatDate(event.date)}</p>
                        </div>
                        <p className="text-sm font-sans tracking-wide text-samara-ivory/70">{event.activity}</p>
                        {event.location && (
                          <p className="text-[10px] font-sans tracking-widest uppercase text-samara-gold flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 stroke-[2]" />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm font-sans tracking-wide text-samara-ivory/40">No tracking events available yet.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
