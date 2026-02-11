import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { callRpc } from '@/services/supabaseHttp';

// Extended role types for granular access control
export type UserRole = 'super_admin' | 'admin' | 'underwriter' | 'customer_service' | 'moderator' | 'user';

// Role hierarchy levels for comparison
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'user': 1,
  'moderator': 2,
  'customer_service': 3,
  'underwriter': 4,
  'admin': 5,
  'super_admin': 6
};

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [allRoles, setAllRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, authenticated } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!authenticated || !user) {
        setRole('user');
        setAllRoles(['user']);
        setLoading(false);
        return;
      }

      try {
        const rolesToCheck: UserRole[] = ['super_admin', 'admin', 'underwriter', 'customer_service', 'moderator'];
        const userRoles: UserRole[] = [];
        let highestRole: UserRole = 'user';

        for (const roleToCheck of rolesToCheck) {
          try {
            const hasThisRole = await callRpc<boolean>('has_app_role', { _user_id: user.id, _role: roleToCheck });

            if (hasThisRole) {
              userRoles.push(roleToCheck);
              if (ROLE_HIERARCHY[roleToCheck] > ROLE_HIERARCHY[highestRole]) {
                highestRole = roleToCheck;
              }
            }
          } catch (error) {
            console.error(`Error checking ${roleToCheck} role:`, error);
            continue;
          }
        }

        userRoles.push('user');
        
        setRole(highestRole);
        setAllRoles(userRoles);
      } catch (error) {
        console.error('Error determining user role:', error);
        setRole('user');
        setAllRoles(['user']);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, authenticated]);

  // Check if user has at least the required role level
  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
  };

  // Check if user has a specific role (exact match or in their role list)
  const hasSpecificRole = (specificRole: UserRole): boolean => {
    return allRoles.includes(specificRole);
  };

  // Convenience methods
  const isSuperAdmin = () => hasSpecificRole('super_admin');
  const isAdmin = () => hasRole('admin'); // admin or super_admin
  const isUnderwriter = () => hasSpecificRole('underwriter') || isSuperAdmin();
  const isCustomerService = () => hasSpecificRole('customer_service') || isSuperAdmin();
  const isModerator = () => hasRole('moderator');

  // Check if user can access admin panel (any admin-level role)
  const canAccessAdminPanel = () => {
    return isSuperAdmin() || hasSpecificRole('admin') || hasSpecificRole('underwriter') || hasSpecificRole('customer_service');
  };

  // Check if user can modify data (not just view)
  const canModifyData = () => {
    return isSuperAdmin() || hasSpecificRole('admin') || hasSpecificRole('underwriter');
  };

  // Check if user can manage users and roles
  const canManageUsers = () => {
    return isSuperAdmin();
  };

  return {
    role,
    allRoles,
    loading,
    hasRole,
    hasSpecificRole,
    isSuperAdmin,
    isAdmin,
    isUnderwriter,
    isCustomerService,
    isModerator,
    canAccessAdminPanel,
    canModifyData,
    canManageUsers
  };
};
