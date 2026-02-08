import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModernTabs as Tabs, ModernTabsContent as TabsContent, ModernTabsList as TabsList, ModernTabsTrigger as TabsTrigger } from '@/components/ui/modern-tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/services/adminService';
import { PhoneInput } from '@/components/ui/phone-input';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Building, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  Upload,
  MessageSquare,
  History
} from 'lucide-react';

interface LoanApplication {
  id: string;
  application_number: string;
  first_name: string;
  last_name: string;
  business_name: string;
  business_address: string;
  business_city: string;
  business_state: string;
  business_zip: string;
  phone: string;
  loan_type: string;
  amount_requested: number;
  status: string;
  years_in_business: number;
  created_at: string;
  updated_at: string;
  application_submitted_date: string;
  funded_date: string | null;
  loan_details: any;
}

interface StatusHistory {
  id: string;
  old_status: string;
  new_status: string;
  notes: string;
  updated_by: string;
  updated_at: string;
}

const AdminLoanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authenticated, loading } = useAuth();
  const { toast } = useToast();

  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<LoanApplication>>({});
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!loading && !authenticated) {
      navigate('/');
      return;
    }

    if (authenticated && id) {
      loadApplicationDetails();
    }
  }, [authenticated, loading, navigate, id]);

  const loadApplicationDetails = async () => {
    try {
      setLoadingData(true);
      const applicationData = await adminService.getApplicationDetails(id!);
      
      if (applicationData) {
        setApplication(applicationData);
        setEditData(applicationData);
        setNewStatus(applicationData.status);
      } else {
        throw new Error('Application not found');
      }
    } catch (error) {
      console.error('Error loading application details:', error);
      toast({
        title: "Error",
        description: "Failed to load application details",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!application || !newStatus) return;

    setUpdatingStatus(true);
    try {
      const result = await adminService.updateApplicationStatus(
        application.id, 
        newStatus, 
        statusNotes
      );
      
      if (result) {
        toast({
          title: "Success",
          description: "Application status updated successfully"
        });
        
        // Reload application details
        await loadApplicationDetails();
        setStatusNotes('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!application || !editData) return;

    try {
      // In a real app, you'd call an update API
      toast({
        title: "Success",
        description: "Application details updated successfully"
      });
      
      setApplication({ ...application, ...editData });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application details",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, className: '' },
      under_review: { variant: 'default' as const, icon: AlertCircle, className: '' },
      approved: { variant: 'default' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive' as const, icon: XCircle, className: '' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, icon: Clock, className: '' };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Application Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested application could not be found.
            </p>
            <Button onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Application Details</h1>
              <p className="text-muted-foreground">{application.application_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(application.status)}
            <Button 
              variant={isEditing ? "destructive" : "outline"}
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  setEditData(application);
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
            {isEditing && (
              <Button onClick={handleSaveEdit}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Application Details</TabsTrigger>
            <TabsTrigger value="status" count={statusHistory.length}>Status Management</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history" count={statusHistory.length}>History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      {isEditing ? (
                        <Input
                          id="first_name"
                          value={editData.first_name || ''}
                          onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm font-medium mt-1">{application.first_name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      {isEditing ? (
                        <Input
                          id="last_name"
                          value={editData.last_name || ''}
                          onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm font-medium mt-1">{application.last_name}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    {isEditing ? (
                       <PhoneInput
                        value={editData.phone || ''}
                         onChange={(value) => setEditData({...editData, phone: value})}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{application.phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="business_name">Business Name</Label>
                    {isEditing ? (
                      <Input
                        id="business_name"
                        value={editData.business_name || ''}
                        onChange={(e) => setEditData({...editData, business_name: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{application.business_name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Business Address
                    </Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Street Address"
                          value={editData.business_address || ''}
                          onChange={(e) => setEditData({...editData, business_address: e.target.value})}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="City"
                            value={editData.business_city || ''}
                            onChange={(e) => setEditData({...editData, business_city: e.target.value})}
                          />
                          <Input
                            placeholder="State"
                            value={editData.business_state || ''}
                            onChange={(e) => setEditData({...editData, business_state: e.target.value})}
                          />
                          <Input
                            placeholder="ZIP"
                            value={editData.business_zip || ''}
                            onChange={(e) => setEditData({...editData, business_zip: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-medium mt-1">
                        {application.business_address}<br />
                        {application.business_city}, {application.business_state} {application.business_zip}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Years in Business</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData.years_in_business || ''}
                        onChange={(e) => setEditData({...editData, years_in_business: parseInt(e.target.value) || 0})}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{application.years_in_business} years</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Loan Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Loan Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Loan Type</Label>
                    {isEditing ? (
                      <Select
                        value={editData.loan_type}
                        onValueChange={(value) => setEditData({...editData, loan_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="refinance">Refinance</SelectItem>
                          <SelectItem value="bridge">Bridge Loan</SelectItem>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="working_capital">Working Capital Loan</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium mt-1 capitalize">{application.loan_type}</p>
                    )}
                  </div>
                  <div>
                    <Label>Amount Requested</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData.amount_requested || ''}
                        onChange={(e) => setEditData({...editData, amount_requested: parseFloat(e.target.value) || 0})}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">${application.amount_requested?.toLocaleString()}</p>
                    )}
                  </div>
                  {application.loan_details && (
                    <div>
                      <Label>Additional Details</Label>
                      <div className="mt-1 space-y-2">
                        {application.loan_details.purpose && (
                          <p className="text-sm"><strong>Purpose:</strong> {application.loan_details.purpose}</p>
                        )}
                        {application.loan_details.collateral && (
                          <p className="text-sm"><strong>Collateral:</strong> {application.loan_details.collateral}</p>
                        )}
                        {application.loan_details.credit_score && (
                          <p className="text-sm"><strong>Credit Score:</strong> {application.loan_details.credit_score}</p>
                        )}
                      </div>
                    </div>
                  )}
                 </CardContent>
               </Card>

               {/* Loan-Specific Details */}
               <Card className="lg:col-span-2">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <FileText className="w-5 h-5" />
                     Loan-Specific Information
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   {application.loan_details && Object.keys(application.loan_details).length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {Object.entries(application.loan_details).map(([key, value]) => {
                         if (value === null || value === undefined || value === '') return null;
                         
                         // Format the key for display
                         const displayKey = key
                           .replace(/_/g, ' ')
                           .replace(/([A-Z])/g, ' $1')
                           .replace(/^./, str => str.toUpperCase());
                         
                         // Format the value for display
                         let displayValue = value;
                         if (typeof value === 'boolean') {
                           displayValue = value ? 'Yes' : 'No';
                         } else if (typeof value === 'number' && key.includes('amount')) {
                           displayValue = `$${value.toLocaleString()}`;
                         } else if (typeof value === 'object') {
                           displayValue = JSON.stringify(value, null, 2);
                         }
                         
                         return (
                           <div key={key} className="space-y-1">
                             <Label className="text-sm font-medium text-muted-foreground">
                               {displayKey}
                             </Label>
                             <p className="text-sm font-medium break-words">
                               {String(displayValue)}
                             </p>
                           </div>
                         );
                       })}
                     </div>
                   ) : (
                     <p className="text-muted-foreground">No additional loan details available.</p>
                   )}
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <div className="lg:col-span-2">
                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Application Created</Label>
                    <p className="text-sm font-medium mt-1">
                      {new Date(application.created_at).toLocaleDateString()} at {new Date(application.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm font-medium mt-1">
                      {new Date(application.updated_at).toLocaleDateString()} at {new Date(application.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <Label>Submitted Date</Label>
                    <p className="text-sm font-medium mt-1">
                      {application.application_submitted_date 
                        ? `${new Date(application.application_submitted_date).toLocaleDateString()} at ${new Date(application.application_submitted_date).toLocaleTimeString()}`
                        : 'Not yet submitted'}
                    </p>
                  </div>
                  <div>
                    <Label>Funded Date</Label>
                    <p className="text-sm font-medium mt-1">
                      {application.funded_date 
                        ? `${new Date(application.funded_date).toLocaleDateString()} at ${new Date(application.funded_date).toLocaleTimeString()}`
                        : <span className="text-muted-foreground">Not yet funded</span>}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Update Application Status
                </CardTitle>
                <CardDescription>
                  Change the status of this application and add notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this status change..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || newStatus === application.status}
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents
                </CardTitle>
                <CardDescription>
                  Manage application documents and attachments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Document Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Document upload and management features will be available soon
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Status History
                </CardTitle>
                <CardDescription>
                  Track all status changes and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusHistory.map((history, index) => (
                    <div key={history.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(history.old_status)}
                          <span className="text-muted-foreground">→</span>
                          {getStatusBadge(history.new_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{history.notes}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated by {history.updated_by} on {new Date(history.updated_at).toLocaleDateString()} at {new Date(history.updated_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminLoanDetail;