import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * Available user roles in the system
 * - Admin: Full access to all features and data
 * - Manager: Can create and manage data with some restrictions
 * - Viewer: Read-only access to authorized data
 */
export type UserRole = 'Admin' | 'Manager' | 'Viewer';

/**
 * User object representing an authenticated user
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name: string;
  /** User's role determining access permissions */
  role: UserRole;
}

/**
 * JWT secret key for signing and verifying tokens
 * Should be set via JWT_SECRET environment variable in production
 */
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

/**
 * Create a JWT token for an authenticated user
 * 
 * @param user The user object to encode in the token
 * @returns Promise resolving to the JWT token string
 * 
 * @remarks
 * - Token expires after 24 hours
 * - Uses HS256 algorithm for signing
 * - Token contains the full user object in the payload
 * 
 * @example
 * ```typescript
 * const user = { id: '123', email: 'admin@example.com', name: 'Admin', role: 'Admin' };
 * const token = await createToken(user);
 * // Store token in cookie or return to client
 * ```
 */
export async function createToken(user: User): Promise<string> {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 * 
 * @param token The JWT token string to verify
 * @returns Promise resolving to User object if valid, null if invalid/expired
 * 
 * @remarks
 * - Returns null for expired tokens
 * - Returns null for tokens with invalid signatures
 * - Returns null for malformed tokens
 * 
 * @example
 * ```typescript
 * const user = await verifyToken(token);
 * if (user) {
 *   console.log(`Authenticated as ${user.name}`);
 * } else {
 *   console.log('Invalid or expired token');
 * }
 * ```
 */
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.user as User;
  } catch (error) {
    return null;
  }
}

/**
 * Get the currently authenticated user from the request
 * 
 * @param request Optional NextRequest object (for API routes)
 * @returns Promise resolving to User object if authenticated, null otherwise
 * 
 * @remarks
 * - Checks Authorization header first (Bearer token)
 * - Falls back to auth_token cookie if header not present
 * - For server components, omit request parameter to use cookies()
 * - For API routes, pass the NextRequest object
 * 
 * @example
 * ```typescript
 * // In API route
 * export async function GET(request: NextRequest) {
 *   const user = await getCurrentUser(request);
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // ... handle authenticated request
 * }
 * 
 * // In server component
 * export default async function ProtectedPage() {
 *   const user = await getCurrentUser();
 *   if (!user) redirect('/login');
 *   // ... render protected content
 * }
 * ```
 */
export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  let token: string | undefined;
  
  if (request) {
    // Try to get token from Authorization header (Bearer token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If not in header, try cookie
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }
  } else {
    // Server component - get from cookies
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value;
  }
  
  if (!token) {
    return null;
  }
  
  return await verifyToken(token);
}

/**
 * Set the authentication cookie with a JWT token
 * 
 * @param token The JWT token to store in the cookie
 * 
 * @remarks
 * - Cookie is httpOnly for security (not accessible via JavaScript)
 * - Cookie is secure in production (HTTPS only)
 * - Cookie uses sameSite: 'lax' to prevent CSRF
 * - Cookie expires after 24 hours
 * 
 * @example
 * ```typescript
 * const token = await createToken(user);
 * await setAuthCookie(token);
 * ```
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Clear the authentication cookie (logout)
 * 
 * @example
 * ```typescript
 * // In logout API route
 * await clearAuthCookie();
 * return NextResponse.json({ message: 'Logged out' });
 * ```
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

/**
 * Check if a user role has permission to access a resource requiring a specific role
 * 
 * @param userRole The role of the user
 * @param requiredRole The minimum role required to access the resource
 * @returns true if user has sufficient permissions, false otherwise
 * 
 * @remarks
 * Role hierarchy (high to low): Admin > Manager > Viewer
 * - Admin can access Admin, Manager, and Viewer resources
 * - Manager can access Manager and Viewer resources
 * - Viewer can only access Viewer resources
 * 
 * @example
 * ```typescript
 * hasPermission('Admin', 'Manager');   // true (Admin >= Manager)
 * hasPermission('Manager', 'Admin');   // false (Manager < Admin)
 * hasPermission('Viewer', 'Viewer');   // true (Viewer >= Viewer)
 * ```
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    Admin: 3,
    Manager: 2,
    Viewer: 1,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}