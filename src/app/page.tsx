"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Shield, Zap, Code, Lock, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            <h1 className="text-xl font-bold">Auto-Generated CRUD + RBAC</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/admin/models">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-5xl font-bold tracking-tight">
            Build Data-Driven Apps
            <span className="block text-primary">Without Writing Code</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Define your data models, configure permissions, and get a fully functional
            CRUD API with role-based access control instantly.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/login">
              <Button size="lg">
                Start Building
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Powerful Features</h3>
          <p className="text-muted-foreground">
            Everything you need to build secure, scalable applications
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Auto-Generated APIs</CardTitle>
              <CardDescription>
                Define your data model once and get complete REST APIs with full CRUD operations automatically.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Role-Based Access Control</CardTitle>
              <CardDescription>
                Configure granular permissions for create, read, update, and delete operations per role.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Ownership Control</CardTitle>
              <CardDescription>
                Define owner fields to ensure users can only access their own data while admins see everything.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Dynamic Forms</CardTitle>
              <CardDescription>
                UI forms are automatically generated from your model definitions with proper validation.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>JWT Authentication</CardTitle>
              <CardDescription>
                Secure authentication system with JWT tokens and session management built-in.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Database className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Flexible Data Types</CardTitle>
              <CardDescription>
                Support for string, number, boolean, date, email, URL fields with custom validations.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Quick Start Guide</h3>
            <p className="text-muted-foreground">
              Get up and running in minutes
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </span>
                  Login to Your Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Use one of the demo accounts to get started:
                </p>
                <ul className="space-y-2 text-sm">
                  <li><strong>Admin:</strong> admin@example.com / admin123 - Full access</li>
                  <li><strong>Manager:</strong> manager@example.com / manager123 - Limited management</li>
                  <li><strong>Viewer:</strong> viewer@example.com / viewer123 - Read-only access</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </span>
                  Define Your Data Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Go to the Model Definition page and create your first model. Add fields, set types,
                  configure validations, and define who can perform which operations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </span>
                  Manage Your Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Switch to the Data Management interface to add, edit, and delete records.
                  The interface is dynamically generated based on your model definition.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    4
                  </span>
                  Use the REST API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Your APIs are automatically available at:
                </p>
                <ul className="space-y-2 text-sm font-mono bg-muted p-4 rounded-md">
                  <li>GET /api/data/[modelName] - List all records</li>
                  <li>POST /api/data/[modelName] - Create a record</li>
                  <li>GET /api/data/[modelName]/[id] - Get one record</li>
                  <li>PUT /api/data/[modelName]/[id] - Update a record</li>
                  <li>DELETE /api/data/[modelName]/[id] - Delete a record</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-3xl font-bold">Ready to Get Started?</h3>
          <p className="text-xl text-muted-foreground">
            Log in now and create your first data model in seconds
          </p>
          <Link href="/login">
            <Button size="lg" className="mt-4">
              Login Now
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Auto-Generated CRUD + RBAC Platform</p>
          <p className="mt-2">Built with Next.js, TypeScript, and Shadcn/UI</p>
        </div>
      </footer>
    </div>
  );
}
