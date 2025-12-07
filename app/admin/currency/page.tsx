'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { format } from 'date-fns';

interface CurrencyRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  updated_at: string;
}

export default function CurrencyManagementPage() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [usdRate, setUsdRate] = useState('');
  const [aedRate, setAedRate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('base_currency', 'INR')
        .order('target_currency');

      if (error) throw error;

      setRates(data || []);

      const usd = data?.find((r) => r.target_currency === 'USD');
      const aed = data?.find((r) => r.target_currency === 'AED');

      if (usd) setUsdRate(usd.rate.toString());
      if (aed) setAedRate(aed.rate.toString());
    } catch (error) {
      console.error('Error fetching currency rates:', error);
      toast.error('Failed to fetch currency rates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRates = async () => {
    if (!usdRate || !aedRate) {
      toast.error('Please enter rates for both USD and AED');
      return;
    }

    const usdRateNum = parseFloat(usdRate);
    const aedRateNum = parseFloat(aedRate);

    if (isNaN(usdRateNum) || isNaN(aedRateNum) || usdRateNum <= 0 || aedRateNum <= 0) {
      toast.error('Please enter valid positive numbers');
      return;
    }

    setSaving(true);
    try {
      const existingUsd = rates.find((r) => r.target_currency === 'USD');
      const existingAed = rates.find((r) => r.target_currency === 'AED');

      if (existingUsd) {
        await supabase
          .from('currency_rates')
          .update({ rate: usdRateNum, updated_at: new Date().toISOString() })
          .eq('id', existingUsd.id);
      } else {
        await supabase.from('currency_rates').insert({
          base_currency: 'INR',
          target_currency: 'USD',
          rate: usdRateNum,
        });
      }

      if (existingAed) {
        await supabase
          .from('currency_rates')
          .update({ rate: aedRateNum, updated_at: new Date().toISOString() })
          .eq('id', existingAed.id);
      } else {
        await supabase.from('currency_rates').insert({
          base_currency: 'INR',
          target_currency: 'AED',
          rate: aedRateNum,
        });
      }

      toast.success('Currency rates updated successfully');
      fetchRates();
    } catch (error) {
      console.error('Error saving currency rates:', error);
      toast.error('Failed to save currency rates');
    } finally {
      setSaving(false);
    }
  };

  const calculateExample = (inrAmount: number) => {
    const usd = parseFloat(usdRate) || 0;
    const aed = parseFloat(aedRate) || 0;
    return {
      usd: usd > 0 ? (inrAmount / usd).toFixed(2) : 'N/A',
      aed: aed > 0 ? (inrAmount / aed).toFixed(2) : 'N/A',
    };
  };

  const exampleINR = 10000;
  const example = calculateExample(exampleINR);

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Currency Management</h1>
          <p className="text-neutral-600 mt-2">
            Manage exchange rates for INR to USD and AED conversions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b bg-neutral-50">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <CardTitle>Update Exchange Rates</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <Label htmlFor="usd-rate" className="text-sm font-medium">
                  USD Rate (1 USD = ? INR)
                </Label>
                <Input
                  id="usd-rate"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 83.50"
                  value={usdRate}
                  onChange={(e) => setUsdRate(e.target.value)}
                  className="mt-2 border-amber-200 focus:ring-amber-500"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Current market rate: 1 USD ≈ ₹{usdRate || '--'}
                </p>
              </div>

              <div>
                <Label htmlFor="aed-rate" className="text-sm font-medium">
                  AED Rate (1 AED = ? INR)
                </Label>
                <Input
                  id="aed-rate"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 22.75"
                  value={aedRate}
                  onChange={(e) => setAedRate(e.target.value)}
                  className="mt-2 border-amber-200 focus:ring-amber-500"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Current market rate: 1 AED ≈ ₹{aedRate || '--'}
                </p>
              </div>

              <Button
                onClick={handleSaveRates}
                disabled={saving || !usdRate || !aedRate}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Exchange Rates'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-neutral-50">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                <CardTitle>Conversion Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-neutral-600 mb-3">
                  Example: ₹{exampleINR.toLocaleString('en-IN')} converts to:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-neutral-700">USD:</span>
                    <span className="text-lg font-bold text-amber-600">
                      ${example.usd}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-neutral-700">AED:</span>
                    <span className="text-lg font-bold text-amber-600">
                      {example.aed} AED
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-neutral-500 mb-2">Quick Reference:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-neutral-50 p-2 rounded">
                    <p className="text-neutral-600">₹1,000</p>
                    <p className="font-semibold text-amber-600">
                      ${calculateExample(1000).usd}
                    </p>
                  </div>
                  <div className="bg-neutral-50 p-2 rounded">
                    <p className="text-neutral-600">₹5,000</p>
                    <p className="font-semibold text-amber-600">
                      ${calculateExample(5000).usd}
                    </p>
                  </div>
                  <div className="bg-neutral-50 p-2 rounded">
                    <p className="text-neutral-600">₹1,000</p>
                    <p className="font-semibold text-amber-600">
                      {calculateExample(1000).aed} AED
                    </p>
                  </div>
                  <div className="bg-neutral-50 p-2 rounded">
                    <p className="text-neutral-600">₹5,000</p>
                    <p className="font-semibold text-amber-600">
                      {calculateExample(5000).aed} AED
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center text-neutral-500">
              Loading currency rates...
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="border-b bg-neutral-50">
              <CardTitle>Current Exchange Rates</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Base Currency</TableHead>
                    <TableHead>Target Currency</TableHead>
                    <TableHead>Exchange Rate</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-neutral-500">
                        No currency rates configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    rates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">
                          {rate.base_currency}
                        </TableCell>
                        <TableCell>{rate.target_currency}</TableCell>
                        <TableCell className="font-semibold text-amber-600">
                          1 {rate.target_currency} = ₹{rate.rate.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-neutral-600">
                          {format(new Date(rate.updated_at), 'PPp')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-neutral-900 mb-2">Important Notes:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-neutral-700">
              <li>Exchange rates should be updated regularly to reflect market conditions</li>
              <li>
                Rates are expressed as: 1 foreign currency unit = X INR (e.g., 1 USD = 83.50
                INR)
              </li>
              <li>
                These rates will be used throughout the store for price conversions
              </li>
              <li>If a rate is not configured, prices will default to INR display only</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
