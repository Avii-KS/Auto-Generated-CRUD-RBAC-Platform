"use client";

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, LogOut, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';

interface Model {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required?: boolean;
  }>;
  ownerField?: string;
}

interface DataRecord {
  id: string;
  [key: string]: any;
}

export default function DataManagementPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [data, setData] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DataRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchModels();
  }, []);
  
  useEffect(() => {
    if (selectedModel) {
      fetchData();
    }
  }, [selectedModel]);
  
  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const result = await response.json();
        setModels(result.models);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };
  
  const fetchData = async () => {
    if (!selectedModel) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/data/${selectedModel}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAdd = () => {
    setEditingRecord(null);
    setFormData({});
    setError('');
    setDialogOpen(true);
  };
  
  const handleEdit = (record: DataRecord) => {
    setEditingRecord(record);
    setFormData({ ...record });
    setError('');
    setDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/data/${selectedModel}/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchData();
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete record');
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
      alert('Failed to delete record');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const url = editingRecord
        ? `/api/data/${selectedModel}/${editingRecord.id}`
        : `/api/data/${selectedModel}`;
      
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save record');
      }
      
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
    }
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const currentModel = models.find((m) => m.name === selectedModel);
  
  const renderInput = (field: Model['fields'][0]) => {
    const value = formData[field.name] ?? '';
    
    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.name}
              checked={value}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, [field.name]: checked })
              }
            />
            <Label htmlFor={field.name}>{field.label || field.name}</Label>
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label || field.name}
              {field.required && ' *'}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
            />
          </div>
        );
      
      case 'date':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label || field.name}
              {field.required && ' *'}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
            />
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label || field.name}
              {field.required && ' *'}
            </Label>
            <Input
              id={field.name}
              type={field.type === 'email' ? 'email' : 'text'}
              value={value}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
            />
          </div>
        );
    }
  };
  
  return (
    <AuthGuard>
      <div className="min-h-screen bg-muted/30">
        <header className="bg-background border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Data Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.name} ({user?.role})
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/models')}>
                Model Definition
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                Home
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Records</CardTitle>
                  <CardDescription>
                    View and manage your data
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.length === 0 ? (
                        <SelectItem value="none" disabled>No models available</SelectItem>
                      ) : (
                        models.map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedModel && (
                    <Button onClick={handleAdd}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedModel ? (
                <div className="text-center py-12 text-muted-foreground">
                  {models.length === 0 ? (
                    <>
                      <p>No models defined yet.</p>
                      <Button
                        variant="link"
                        onClick={() => router.push('/admin/models')}
                        className="mt-2"
                      >
                        Create your first model
                      </Button>
                    </>
                  ) : (
                    <p>Select a model to view and manage data</p>
                  )}
                </div>
              ) : loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading data...</p>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No records found</p>
                  <Button variant="link" onClick={handleAdd} className="mt-2">
                    Add your first record
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        {currentModel?.fields.map((field) => (
                          <TableHead key={field.name}>
                            {field.label || field.name}
                          </TableHead>
                        ))}
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono text-xs">
                            {record.id.substring(0, 8)}...
                          </TableCell>
                          {currentModel?.fields.map((field) => (
                            <TableCell key={field.name}>
                              {field.type === 'boolean'
                                ? record[field.name]
                                  ? '✓'
                                  : '✗'
                                : String(record[field.name] ?? '-')}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(record.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Record' : 'Add Record'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? 'Update the record details below'
                : 'Fill in the details to create a new record'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentModel?.fields
              .filter((field) => field.name !== currentModel?.ownerField)
              .map((field) => (
                <div key={field.name}>{renderInput(field)}</div>
              ))}
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRecord ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
