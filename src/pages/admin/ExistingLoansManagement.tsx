import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  DollarSign,
  Calendar,
  Building2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ExistingLoan {
  id: string;
  user_id: string;
  loan_name: string;
  loan_type: string;
  lender: string;
  loan_balance: number;
  original_amount: number;
  monthly_payment: number;
  interest_rate: number;
  term_months: number;
  remaining_months: number;
  maturity_date: string;
  origination_date: string;
  status: string;
  loan_purpose: string;
  has_prepayment_penalty: boolean;
  prepayment_period_end_date?: string;
}

interface LoanFormData {
  user_id: string;
  loan_name: string;
  loan_type: string;
  lender: string;
  loan_balance: string;
  original_amount: string;
  monthly_payment: string;
  interest_rate: string;
  term_months: string;
  remaining_months: string;
  maturity_date: string;
  origination_date: string;
  status: string;
  loan_purpose: string;
  has_prepayment_penalty: boolean;
  prepayment_period_end_date?: string;
}

const ExistingLoansManagement = () => {
  const { toast } = useToast();
  const [loans, setLoans] = useState<ExistingLoan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<ExistingLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<ExistingLoan | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);

  const emptyForm: LoanFormData = {
    user_id: '',
    loan_name: '',
    loan_type: 'term_loan',
    lender: '',
    loan_balance: '',
    original_amount: '',
    monthly_payment: '',
    interest_rate: '',
    term_months: '',
    remaining_months: '',
    maturity_date: '',
    origination_date: '',
    status: 'current',
    loan_purpose: '',
    has_prepayment_penalty: false,
    prepayment_period_end_date: ''
  };

  const [formData, setFormData] = useState<LoanFormData>(emptyForm);

  useEffect(() => {
    loadLoans();
    loadUsers();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [loans, searchTerm, statusFilter]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('existing_loans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error loading loans:', error);
      toast({
        title: "Error",
        description: "Failed to load existing loans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLoans = () => {
    let filtered = loans;

    if (searchTerm) {
      filtered = filtered.filter(loan => 
        loan.loan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.lender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loan_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    setFilteredLoans(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loanData = {
      user_id: formData.user_id,
      loan_name: formData.loan_name,
      loan_type: formData.loan_type,
      lender: formData.lender,
      loan_balance: parseFloat(formData.loan_balance),
      original_amount: parseFloat(formData.original_amount),
      monthly_payment: parseFloat(formData.monthly_payment),
      interest_rate: parseFloat(formData.interest_rate),
      term_months: parseInt(formData.term_months),
      remaining_months: parseInt(formData.remaining_months),
      maturity_date: formData.maturity_date,
      origination_date: formData.origination_date,
      status: formData.status,
      loan_purpose: formData.loan_purpose,
      has_prepayment_penalty: formData.has_prepayment_penalty,
      prepayment_period_end_date: formData.prepayment_period_end_date || null
    };

    try {
      if (editingLoan) {
        const { error } = await supabase
          .from('existing_loans')
          .update(loanData)
          .eq('id', editingLoan.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Loan updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('existing_loans')
          .insert([loanData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Loan created successfully"
        });
      }

      setDialogOpen(false);
      setEditingLoan(null);
      setFormData(emptyForm);
      loadLoans();
    } catch (error: any) {
      console.error('Error saving loan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save loan",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (loan: ExistingLoan) => {
    setEditingLoan(loan);
    setFormData({
      user_id: loan.user_id,
      loan_name: loan.loan_name,
      loan_type: loan.loan_type,
      lender: loan.lender,
      loan_balance: loan.loan_balance.toString(),
      original_amount: loan.original_amount.toString(),
      monthly_payment: loan.monthly_payment.toString(),
      interest_rate: loan.interest_rate.toString(),
      term_months: loan.term_months.toString(),
      remaining_months: loan.remaining_months.toString(),
      maturity_date: loan.maturity_date,
      origination_date: loan.origination_date,
      status: loan.status,
      loan_purpose: loan.loan_purpose,
      has_prepayment_penalty: loan.has_prepayment_penalty,
      prepayment_period_end_date: loan.prepayment_period_end_date || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (loanId: string) => {
    if (!confirm('Are you sure you want to delete this loan?')) return;

    try {
      const { error } = await supabase
        .from('existing_loans')
        .delete()
        .eq('id', loanId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Loan deleted successfully"
      });

      loadLoans();
    } catch (error: any) {
      console.error('Error deleting loan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete loan",
        variant: "destructive"
      });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingLoan(null);
    setFormData(emptyForm);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      current: "default",
      paid_off: "secondary",
      defaulted: "destructive",
      refinanced: "secondary"
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Existing Loans Management" 
        subtitle="Create and manage existing loans for all users"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <div className="flex justify-end mb-4">
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingLoan(null); setFormData(emptyForm); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Loan
              </Button>
            </DialogTrigger>
          </div>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
                <DialogDescription>
                  {editingLoan ? 'Update the loan information below' : 'Enter the loan details below'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_id">User *</Label>
                    <Select value={formData.user_id} onValueChange={(value) => setFormData({...formData, user_id: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loan_name">Loan Name *</Label>
                    <Input
                      id="loan_name"
                      value={formData.loan_name}
                      onChange={(e) => setFormData({...formData, loan_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loan_type">Loan Type *</Label>
                    <Select value={formData.loan_type} onValueChange={(value) => setFormData({...formData, loan_type: value})} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="term_loan">Term Loan</SelectItem>
                        <SelectItem value="sba_7a">SBA 7(a)</SelectItem>
                        <SelectItem value="sba_504">SBA 504</SelectItem>
                        <SelectItem value="equipment_financing">Equipment Financing</SelectItem>
                        <SelectItem value="working_capital">Working Capital Loan</SelectItem>
                        <SelectItem value="bridge_loan">Bridge Loan</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lender">Lender *</Label>
                    <Input
                      id="lender"
                      value={formData.lender}
                      onChange={(e) => setFormData({...formData, lender: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original_amount">Original Amount *</Label>
                    <Input
                      id="original_amount"
                      type="number"
                      step="0.01"
                      value={formData.original_amount}
                      onChange={(e) => setFormData({...formData, original_amount: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loan_balance">Current Balance *</Label>
                    <Input
                      id="loan_balance"
                      type="number"
                      step="0.01"
                      value={formData.loan_balance}
                      onChange={(e) => setFormData({...formData, loan_balance: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_payment">Monthly Payment *</Label>
                    <Input
                      id="monthly_payment"
                      type="number"
                      step="0.01"
                      value={formData.monthly_payment}
                      onChange={(e) => setFormData({...formData, monthly_payment: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({...formData, interest_rate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="term_months">Term (Months) *</Label>
                    <Input
                      id="term_months"
                      type="number"
                      value={formData.term_months}
                      onChange={(e) => setFormData({...formData, term_months: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remaining_months">Remaining Months *</Label>
                    <Input
                      id="remaining_months"
                      type="number"
                      value={formData.remaining_months}
                      onChange={(e) => setFormData({...formData, remaining_months: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="origination_date">Origination Date *</Label>
                    <Input
                      id="origination_date"
                      type="date"
                      value={formData.origination_date}
                      onChange={(e) => setFormData({...formData, origination_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maturity_date">Maturity Date *</Label>
                    <Input
                      id="maturity_date"
                      type="date"
                      value={formData.maturity_date}
                      onChange={(e) => setFormData({...formData, maturity_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="paid_off">Paid Off</SelectItem>
                        <SelectItem value="defaulted">Defaulted</SelectItem>
                        <SelectItem value="refinanced">Refinanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loan_purpose">Loan Purpose *</Label>
                    <Input
                      id="loan_purpose"
                      value={formData.loan_purpose}
                      onChange={(e) => setFormData({...formData, loan_purpose: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="has_prepayment_penalty"
                      checked={formData.has_prepayment_penalty}
                      onChange={(e) => setFormData({...formData, has_prepayment_penalty: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="has_prepayment_penalty">Has Prepayment Penalty</Label>
                  </div>
                  {formData.has_prepayment_penalty && (
                    <div className="space-y-2">
                      <Label htmlFor="prepayment_period_end_date">Prepayment Period End Date</Label>
                      <Input
                        id="prepayment_period_end_date"
                        type="date"
                        value={formData.prepayment_period_end_date}
                        onChange={(e) => setFormData({...formData, prepayment_period_end_date: e.target.value})}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
                  <Button type="submit">{editingLoan ? 'Update' : 'Create'} Loan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search loans..."
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
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="paid_off">Paid Off</SelectItem>
                  <SelectItem value="defaulted">Defaulted</SelectItem>
                  <SelectItem value="refinanced">Refinanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Loans ({filteredLoans.length})</CardTitle>
            <CardDescription>
              Manage all existing loans in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading loans...</p>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No loans found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Lender</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Monthly Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Maturity Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.loan_name}</TableCell>
                        <TableCell>{loan.loan_type.replace('_', ' ')}</TableCell>
                        <TableCell>{loan.lender}</TableCell>
                        <TableCell>${loan.loan_balance.toLocaleString()}</TableCell>
                        <TableCell>${loan.monthly_payment.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell>{new Date(loan.maturity_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(loan)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(loan.id)}>
                              <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  );
};

export default ExistingLoansManagement;
