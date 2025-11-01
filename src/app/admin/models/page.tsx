"use client";

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, LogOut, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface Field {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url';
  label: string;
  required: boolean;
}

interface Model {
  name: string;
  fields: Field[];
  ownerField?: string;
  permissions: {
    create: string[];
    read: string[];
    update: string[];
    delete: string[];
  };
}

export default function ModelsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelName, setModelName] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [ownerField, setOwnerField] = useState('');
  const [permissions, setPermissions] = useState({
    create: ['Admin'] as string[],
    read: ['Admin', 'Manager', 'Viewer'] as string[],
    update: ['Admin'] as string[],
    delete: ['Admin'] as string[],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    fetchModels();
  }, []);
  
  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const addField = () => {
    setFields([...fields, { name: '', type: 'string', label: '', required: false }]);
  };
  
  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };
  
  const updateField = (index: number, updates: Partial<Field>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!modelName || fields.length === 0) {
      setError('Model name and at least one field are required');
      return;
    }
    
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modelName,
          fields,
          ownerField: ownerField || undefined,
          permissions,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create model');
      }
      
      setSuccess('Model created successfully!');
      setModelName('');
      setFields([]);
      setOwnerField('');
      fetchModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create model');
    }
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  return (
    <AuthGuard requiredRole="Admin">
      <div className="min-h-screen bg-muted/30">
        <header className="bg-background border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Model Definition</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.name} ({user?.role})
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/data')}>
                Data Management
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Model Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Model</CardTitle>
                <CardDescription>
                  Define a new data model with fields and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="modelName">Model Name</Label>
                    <Input
                      id="modelName"
                      placeholder="e.g., Product, User, Post"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ownerField">Owner Field (Optional)</Label>
                    <Input
                      id="ownerField"
                      placeholder="e.g., userId, ownerId"
                      value={ownerField}
                      onChange={(e) => setOwnerField(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Field name that stores the owner's user ID for RBAC ownership checks
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Fields</Label>
                      <Button type="button" size="sm" onClick={addField}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                    
                    {fields.map((field, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Field Name</Label>
                              <Input
                                size={1}
                                placeholder="name"
                                value={field.name}
                                onChange={(e) => updateField(index, { name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Label</Label>
                              <Input
                                size={1}
                                placeholder="Name"
                                value={field.label}
                                onChange={(e) => updateField(index, { label: e.target.value })}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value: any) => updateField(index, { type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="url">URL</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-5">
                              <Checkbox
                                id={`required-${index}`}
                                checked={field.required}
                                onCheckedChange={(checked) => 
                                  updateField(index, { required: checked as boolean })
                                }
                              />
                              <Label htmlFor={`required-${index}`} className="text-xs">
                                Required
                              </Label>
                            </div>
                            
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeField(index)}
                              className="mt-5"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {(['create', 'read', 'update', 'delete'] as const).map((action) => (
                        <div key={action} className="space-y-2">
                          <Label className="text-xs capitalize">{action}</Label>
                          <div className="space-y-1">
                            {['Admin', 'Manager', 'Viewer'].map((role) => (
                              <div key={role} className="flex items-center gap-2">
                                <Checkbox
                                  id={`${action}-${role}`}
                                  checked={permissions[action].includes(role)}
                                  onCheckedChange={(checked) => {
                                    setPermissions((prev) => ({
                                      ...prev,
                                      [action]: checked
                                        ? [...prev[action], role]
                                        : prev[action].filter((r) => r !== role),
                                    }));
                                  }}
                                />
                                <Label htmlFor={`${action}-${role}`} className="text-xs">
                                  {role}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full">
                    Create Model
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Existing Models List */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Existing Models</CardTitle>
                  <CardDescription>
                    {models.length} model(s) defined
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : models.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No models created yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {models.map((model) => (
                        <Card key={model.name} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{model.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {model.fields.length} field(s)
                              </p>
                              {model.ownerField && (
                                <p className="text-xs text-muted-foreground">
                                  Owner field: {model.ownerField}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 space-y-1">
                            {model.fields.map((field) => (
                              <div key={field.name} className="text-sm flex justify-between">
                                <span className="text-muted-foreground">
                                  {field.label || field.name}
                                </span>
                                <span className="text-xs">
                                  {field.type}
                                  {field.required && ' *'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
