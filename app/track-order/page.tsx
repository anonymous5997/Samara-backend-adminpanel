'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Package, Truck, CheckCircle2, AlertCircle, MapPin, Calendar, Weight, Box } from 'lucide-react';

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
    if (statusLower.includes('delivered')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (statusLower.includes('out for delivery')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (statusLower.includes('in transit') || statusLower.includes('shipped')) return 'bg-sky-100 text-sky-800 border-sky-300';
    if (statusLower.includes('picked')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (statusLower.includes('pending') || statusLower.includes('order')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
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
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16 max-w-4xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[#D4AF37]">
          Track Your Shipment
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Get real-time updates on your order delivery status
        </p>

        <Card className="bg-[#050505] border border-[#D4AF37]/20 mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-[#F5F5F5]">Enter Tracking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Tracking Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="order_number"
                      checked={trackingType === 'order_number'}
                      onChange={(e) => setTrackingType(e.target.value as 'order_number')}
                      className="accent-[#D4AF37]"
                    />
                    <span className="text-sm text-gray-300">Order Number</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="awb"
                      checked={trackingType === 'awb'}
                      onChange={(e) => setTrackingType(e.target.value as 'awb')}
                      className="accent-[#D4AF37]"
                    />
                    <span className="text-sm text-gray-300">AWB / Tracking Number</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackingId" className="text-sm text-gray-300">
                  {trackingType === 'order_number' ? 'Order Number' : 'AWB / Tracking Number'}
                </Label>
                <Input
                  id="trackingId"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder={trackingType === 'order_number' ? 'e.g. SAMARA12345' : 'e.g. 123456789'}
                  className="bg-black border-[#D4AF37]/30 text-white placeholder:text-gray-600"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 p-3 rounded-md border border-red-900/50">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/40"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching tracking data...
                  </>
                ) : (
                  'Track Shipment'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {shipmentData && (
          <div className="space-y-6">
            <Card className="bg-[#050505] border border-[#D4AF37]/20">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-[#F5F5F5] mb-1">
                      Shipment Details
                    </CardTitle>
                    <p className="text-xs text-gray-500 font-mono">AWB: {shipmentData.awb}</p>
                  </div>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(shipmentData.currentStatus)}`}>
                    {shipmentData.currentStatus}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Courier Partner</p>
                      <p className="text-sm font-semibold text-white">{shipmentData.courier}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Estimated Delivery</p>
                      <p className="text-sm font-semibold text-white">
                        {shipmentData.estimatedDelivery ? formatDate(shipmentData.estimatedDelivery) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Origin</p>
                      <p className="text-sm font-semibold text-white">{shipmentData.origin}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Destination</p>
                      <p className="text-sm font-semibold text-white">{shipmentData.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Weight className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Weight</p>
                      <p className="text-sm font-semibold text-white">{shipmentData.weight} kg</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Box className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Packages</p>
                      <p className="text-sm font-semibold text-white">{shipmentData.packages}</p>
                    </div>
                  </div>
                </div>

                {shipmentData.deliveredDate && (
                  <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <p className="text-sm font-semibold text-emerald-400">Delivered Successfully</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Delivered on {formatDate(shipmentData.deliveredDate)}
                      {shipmentData.deliveredTo && ` to ${shipmentData.deliveredTo}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#050505] border border-[#D4AF37]/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#F5F5F5]">Tracking Timeline</CardTitle>
                <p className="text-xs text-gray-500">Complete shipment journey</p>
              </CardHeader>
              <CardContent>
                {shipmentData.timeline.length > 0 ? (
                  <div className="space-y-4">
                    {shipmentData.timeline.map((event, index) => (
                      <div key={index} className="relative pl-8 pb-4 border-l-2 border-[#D4AF37]/30 last:border-l-0 last:pb-0">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-[#D4AF37] border-4 border-black"></div>
                        <div className="space-y-1">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                            <p className="text-sm font-semibold text-white">{event.status}</p>
                            <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                          </div>
                          <p className="text-sm text-gray-400">{event.activity}</p>
                          {event.location && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No tracking events available yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
