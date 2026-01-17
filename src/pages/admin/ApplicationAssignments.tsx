import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  assignmentService, 
  ApplicationAssignment, 
  Underwriter, 
  UnassignedApplication 
} from '@/services/assignmentService';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Users,
  FileText,
  Home,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ApplicationAssignments = () => {
  const { authenticated, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<ApplicationAssignment[]>([]);
  const [underwriters, setUnderwriters] = useState<Underwriter[]>([]);
  const [unassignedApplications, setUnassignedApplications] = useState<UnassignedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form states
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [selectedUnderwriter, setSelectedUnderwriter] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [editingAssignment, setEditingAssignment] = useState<ApplicationAssignment | null>(null);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      navigate('/');
      return;
    }

    if (!roleLoading && !isSuperAdmin()) {
      toast({
        title: "Access Denied",
        description: "Only super admins can manage application assignments",
        variant: "destructive"
      });
      navigate('/admin');
      return;
    }

    if (authenticated && !roleLoading) {
      loadData();
    }
  }, [authenticated, authLoading, roleLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentsData, underwritersData, unassignedData] = await Promise.all([
        assignmentService.getAssignments(),
        assignmentService.getUnderwriters(),
        assignmentService.getUnassignedApplications()
      ]);
      
      setAssignments(assignmentsData);
      setUnderwriters(underwritersData);
      setUnassignedApplications(unassignedData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load assignment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedApplication || !selectedUnderwriter) {
      toast({
        title: "Validation Error",
        description: "Please select both an application and an underwriter",
        variant: "destructive"
      });
      return;
    }

    try {
      await assignmentService.createAssignment(
        selectedApplication,
        selectedUnderwriter,
        assignmentNotes
      );
      
      toast({
        title: "Success",
        description: "Application assigned successfully"
      });
      
      setIsAssignDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;

    try {
      await assignmentService.updateAssignment(editingAssignment.id, {
        admin_id: selectedUnderwriter,
        notes: assignmentNotes
      });
      
      toast({
        title: "Success",
        description: "Assignment updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setEditingAssignment(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await assignmentService.deleteAssignment(id);
      
      toast({
        title: "Success",
        description: "Assignment removed successfully"
      });
      
      setDeleteConfirmId(null);
      loadData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to remove assignment",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setSelectedApplication('');
    setSelectedUnderwriter('');
    setAssignmentNotes('');
  };

  const openEditDialog = (assignment: ApplicationAssignment) => {
    setEditingAssignment(assignment);
    setSelectedUnderwriter(assignment.admin_id);
    setAssignmentNotes(assignment.notes || '');
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle; className: string }> = {
      submitted: { variant: 'default', icon: Clock, className: 'bg-blue-100 text-blue-800' },
      under_review: { variant: 'default', icon: Search, className: 'bg-yellow-100 text-yellow-800' },
      approved: { variant: 'default', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive', icon: AlertCircle, className: '' },
      funded: { variant: 'default', icon: CheckCircle, className: 'bg-emerald-100 text-emerald-800' }
    };

    const config = statusConfig[status] || { variant: 'secondary' as const, icon: FileText, className: '' };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { className: string }> = {
      super_admin: { className: 'bg-purple-100 text-purple-800' },
      admin: { className: 'bg-red-100 text-red-800' },
      underwriter: { className: 'bg-blue-100 text-blue-800' }
    };

    const config = roleConfig[role] || { className: '' };

    return (
      <Badge variant="secondary" className={config.className}>
        <Shield className="w-3 h-3 mr-1" />
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === '' || 
      assignment.application?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.application?.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.admin?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.admin?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assignment.application?.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Application Assignments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold">Application Assignments</h1>
            <p className="text-muted-foreground">Assign underwriters to loan applications for review</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setIsAssignDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              New Assignment
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assignments</p>
                  <p className="text-2xl font-bold">{assignments.length}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unassigned Apps</p>
                  <p className="text-2xl font-bold">{unassignedApplications.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Underwriters</p>
                  <p className="text-2xl font-bold">{underwriters.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Under Review</p>
                  <p className="text-2xl font-bold">
                    {assignments.filter(a => a.application?.status === 'under_review').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search by business, application #, or underwriter..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Assignments ({filteredAssignments.length})</CardTitle>
            <CardDescription>
              Manage which underwriters are reviewing which loan applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No assignments found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAssignDialogOpen(true)}
                >
                  Create First Assignment
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Loan Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.application?.application_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {assignment.application?.first_name} {assignment.application?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.application?.business_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {assignment.application?.loan_type?.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        ${assignment.application?.amount_requested?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(assignment.application?.status || 'unknown')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {assignment.admin?.first_name} {assignment.admin?.last_name}
                          </p>
                          {assignment.notes && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={assignment.notes}>
                              {assignment.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(assignment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirmId(assignment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Unassigned Applications */}
        {unassignedApplications.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                Unassigned Applications ({unassignedApplications.length})
              </CardTitle>
              <CardDescription>
                These applications need to be assigned to an underwriter for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unassignedApplications.slice(0, 5).map((app) => (
                  <div 
                    key={app.id} 
                    className="flex items-center justify-between p-3 bg-background rounded-lg border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{app.application_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {app.first_name} {app.last_name} • {app.business_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">${app.amount_requested?.toLocaleString()}</span>
                      {getStatusBadge(app.status)}
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(app.id);
                          setIsAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
                {unassignedApplications.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    And {unassignedApplications.length - 5} more unassigned applications...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Application to Underwriter</DialogTitle>
            <DialogDescription>
              Select an application and assign it to an underwriter for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="application">Application</Label>
              <Select value={selectedApplication} onValueChange={setSelectedApplication}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an application" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedApplications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.application_number} - {app.business_name} (${app.amount_requested?.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="underwriter">Underwriter</Label>
              <Select value={selectedUnderwriter} onValueChange={setSelectedUnderwriter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an underwriter" />
                </SelectTrigger>
                <SelectContent>
                  {underwriters.map((uw) => (
                    <SelectItem key={uw.id} value={uw.id}>
                      <div className="flex items-center gap-2">
                        <span>{uw.first_name} {uw.last_name}</span>
                        {getRoleBadge(uw.role)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add any notes about this assignment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAssignDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Reassign the application or update notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Application</Label>
              <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                {editingAssignment?.application?.application_number} - {editingAssignment?.application?.business_name}
              </p>
            </div>
            <div>
              <Label htmlFor="underwriter">Underwriter</Label>
              <Select value={selectedUnderwriter} onValueChange={setSelectedUnderwriter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an underwriter" />
                </SelectTrigger>
                <SelectContent>
                  {underwriters.map((uw) => (
                    <SelectItem key={uw.id} value={uw.id}>
                      <div className="flex items-center gap-2">
                        <span>{uw.first_name} {uw.last_name}</span>
                        {getRoleBadge(uw.role)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add any notes about this assignment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingAssignment(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAssignment}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the underwriter from this application. The application will need to be reassigned for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDeleteAssignment(deleteConfirmId)}
            >
              Remove Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApplicationAssignments;
