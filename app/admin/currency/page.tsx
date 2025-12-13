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
  const [gbpRate, setGbpRate] = useState('');
  const [cadRate, setCadRate] = useState('');

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
      const gbp = data?.find((r) => r.target_currency === 'GBP');
      const cad = data?.find((r) => r.target_currency === 'CAD');

      if (usd) setUsdRate(usd.rate.toString());
      if (aed) setAedRate(aed.rate.toString());
      if (gbp) setGbpRate(gbp.rate.toString());
      if (cad) setCadRate(cad.rate.toString());
    } catch (error) {
      console.error('Error fetching currency rates:', error);
      toast.error('Failed to fetch currency rates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRates = async () => {
    if (!usdRate || !aedRate || !gbpRate || !cadRate) {
      toast.error('Please enter all currency rates');
      return;
    }

    const updates = [
      { code: 'USD', rate: parseFloat(usdRate) },
      { code: 'AED', rate: parseFloat(aedRate) },
      { code: 'GBP', rate: parseFloat(gbpRate) },
      { code: 'CAD', rate: parseFloat(cadRate) },
    ];

    for (const u of updates) {
      if (isNaN(u.rate) || u.rate <= 0) {
        toast.error(`Invalid rate for ${u.code}`);
        return;
      }
    }

    setSaving(true);
    try {
      for (const entry of updates) {
        const existingRow = rates.find(
          (r) => r.target_currency === entry.code
        );

        if (existingRow) {
          await supabase
            .from('currency_rates')
            .update({
              rate: entry.rate,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingRow.id);
        } else {
          await supabase.from('currency_rates').insert({
            base_currency: 'INR',
            target_currency: entry.code,
            rate: entry.rate,
          });
        }
      }

      toast.success('Exchange rates updated successfully');
      fetchRates();
    } catch (error) {
      console.error('Error saving currency rates:', error);
      toast.error('Failed to save currency rates');
    } finally {
      setSaving(false);
    }
  };

  // Example Conversion Preview
  const exampleINR = 10000;
  const convertExample = (rate: number) => {
    return rate > 0 ? (exampleINR / rate).toFixed(2) : 'N/A';
  };

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Currency Management</h1>
          <p className="text-neutral-600 mt-2">
            Manage exchange rates for INR → USD, AED, GBP, CAD
          </p>
        </div>

        {/* Update Form */}
        <Card>
          <CardHeader className="border-b bg-neutral-50">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <CardTitle>Update Exchange Rates</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* USD */}
            <div>
              <Label>USD Rate (1 USD = ? INR)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 83.50"
                value={usdRate}
                onChange={(e) => setUsdRate(e.target.value)}
              />
            </div>

            {/* AED */}
            <div>
              <Label>AED Rate (1 AED = ? INR)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 22.75"
                value={aedRate}
                onChange={(e) => setAedRate(e.target.value)}
              />
            </div>

            {/* GBP */}
            <div>
              <Label>GBP Rate (1 GBP = ? INR)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 105.20"
                value={gbpRate}
                onChange={(e) => setGbpRate(e.target.value)}
              />
            </div>

            {/* CAD */}
            <div>
              <Label>CAD Rate (1 CAD = ? INR)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 61.50"
                value={cadRate}
                onChange={(e) => setCadRate(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSaveRates}
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Exchange Rates'}
            </Button>
          </CardContent>
        </Card>

        {/* Conversion Preview */}
        <Card>
          <CardHeader className="border-b bg-neutral-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <CardTitle>Conversion Preview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {[
              { name: 'USD', rate: usdRate },
              { name: 'AED', rate: aedRate },
              { name: 'GBP', rate: gbpRate },
              { name: 'CAD', rate: cadRate },
            ].map((r) => (
              <div
                key={r.name}
                className="flex justify-between bg-amber-50 px-4 py-2 rounded border border-amber-200"
              >
                <span className="font-medium text-neutral-700">
                  {r.name} for ₹{exampleINR.toLocaleString('en-IN')}
                </span>
                <span className="font-bold text-amber-700">
                  {convertExample(parseFloat(r.rate))} {r.name}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current Rates Table */}
        <Card>
          <CardHeader className="border-b bg-neutral-50">
            <CardTitle>Current Exchange Rates</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Base</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-neutral-500">
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>{rate.base_currency}</TableCell>
                      <TableCell>{rate.target_currency}</TableCell>
                      <TableCell>
                        1 {rate.target_currency} = ₹{rate.rate.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(rate.updated_at), 'PPp')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
