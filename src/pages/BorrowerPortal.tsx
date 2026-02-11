/**
 * MY ACCOUNT PAGE (Route: /my-account)
 * User profile and account settings management page
 * Displays:
 * - Personal information (name, email, phone)
 * - Account editing functionality
 * - Logout option
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { restQuery, invokeEdgeFunction } from '@/services/supabaseHttp';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  AlertCircle,
  User,
  Mail,
  Edit,
  Save,
  X,
  LogOut
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageHeader } from '@/components/PageHeader';
import { PhoneInput, isValidPhoneNumber } from '@/components/ui/phone-input';

const profileSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  last_name: z.string().trim().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  phone: z.string().trim().refine((val) => val === '' || isValidPhoneNumber(val), { message: "Phone number must be exactly 10 digits" }).optional().or(z.literal('')),
});

const BorrowerPortal = () => {
  const { authenticated, loading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loadingData, setLoadingData] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<{ 
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (!loading && !authenticated) {
      navigate('/');
      return;
    }

    if (authenticated) {
      loadPortalData();
    }
  }, [authenticated, loading, navigate]);

  const loadPortalData = async () => {
    try {
      // Fetch user profile
      if (user) {
        const params = new URLSearchParams();
        params.set('id', `eq.${user.id}`);
        params.set('select', 'first_name,last_name,phone');
        const { data: profileArr } = await restQuery<any[]>('profiles', { params });
        const profileData = profileArr?.[0] ?? null;
        
        if (profileData) {
          setUserProfile({
            ...profileData,
            email: user.email || null
          });
          form.reset({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            phone: profileData.phone || '',
          });
        } else {
          // If no profile exists, use user email
          setUserProfile({
            first_name: null,
            last_name: null,
            email: user.email || null,
            phone: null,
          });
          form.reset({
            first_name: '',
            last_name: '',
            phone: '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading portal data:', error);
      toast({
        title: "Error",
        description: "Failed to load portal data",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      await invokeEdgeFunction('update_profile', {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone || '',
      });

      setUserProfile({
        ...userProfile,
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone || null,
      });

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${error?.message || JSON.stringify(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    form.reset({
      first_name: userProfile?.first_name || '',
      last_name: userProfile?.last_name || '',
      phone: userProfile?.phone || '',
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      navigate('/');
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        {/* Loading skeleton with banner */}
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-blue-950 animate-pulse">
          <div className="max-w-7xl mx-auto sm:px-6 md:py-[30px] lg:px-[34px] px-[30px] py-[15px]">
            <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-64"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-center">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="My Account" 
        subtitle="Manage your account information and preferences"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader className="px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Personal Information</span>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-8 px-2 sm:px-3"
                    >
                      <Edit className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">First Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                disabled={!isEditing}
                                className={`h-10 sm:h-9 ${!isEditing ? "bg-muted/50" : ""}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                disabled={!isEditing}
                                className={`h-10 sm:h-9 ${!isEditing ? "bg-muted/50" : ""}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input 
                        value={userProfile?.email || user?.email || ''} 
                        readOnly 
                        className="bg-muted/50 h-10 sm:h-9"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                    </div>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                           <FormLabel className="text-sm">Phone</FormLabel>
                          <FormControl>
                             <PhoneInput 
                               value={field.value}
                               onChange={field.onChange}
                              disabled={!isEditing}
                              className={`h-10 sm:h-9 ${!isEditing ? "bg-muted/50" : ""}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {isEditing && (
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                        <Button 
                          type="submit" 
                          className="flex-1 h-11 sm:h-10"
                          disabled={isSaving}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="h-11 sm:h-10"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="text-base sm:text-lg">Account Settings</CardTitle>
                <CardDescription className="text-sm">Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-2 sm:space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 sm:h-10 text-sm"
                  onClick={() => navigate('/change-email')}
                >
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  Change Email
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 sm:h-10 text-sm"
                  onClick={() => navigate('/change-password')}
                >
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  Change Password
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 sm:h-10 text-sm"
                  onClick={() => navigate('/two-factor-auth')}
                >
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  Two-Factor Authentication
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 sm:h-10 text-sm"
                  onClick={() => toast({
                    title: "Coming Soon",
                    description: "Notification preferences will be available soon."
                  })}
                >
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  Notification Preferences
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start h-11 sm:h-10 text-sm mt-4"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
                  Log Out
                </Button>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default BorrowerPortal;
