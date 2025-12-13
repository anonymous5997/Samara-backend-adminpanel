'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: 'customer' | 'admin';
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }

    setLoading(false);
  };

  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(term) ||
      (user.name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-neutral-600 mt-2">
          View all registered customers and admins.
        </p>
      </div>

      {/* Search + stats */}
      <Card>
        <CardHeader className="border-b bg-neutral-50 flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">All Users</CardTitle>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="outline" className="whitespace-nowrap">
              {users.length} user{users.length !== 1 && 's'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-neutral-500 gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              No users found{search ? ' for this search' : ''}.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.name || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'admin' ? 'default' : 'outline'}
                        className="capitalize"
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      {user.created_at
                        ? format(new Date(user.created_at), 'dd/MM/yyyy')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
