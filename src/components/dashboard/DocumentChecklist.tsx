import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Circle, FileText, Upload, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
interface DocumentItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  category: string;
}
interface DocumentChecklistProps {
  userId?: string;
  className?: string;
}
export const DocumentChecklist = ({
  userId,
  className
}: DocumentChecklistProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requiredDocuments: DocumentItem[] = [{
    id: 'tax-returns',
    name: 'Business Tax Returns',
    description: 'Last 2-3 years of business tax returns',
    required: true,
    uploaded: false,
    category: 'Financial'
  }, {
    id: 'bank-statements',
    name: 'Bank Statements',
    description: 'Last 3-6 months of business bank statements',
    required: true,
    uploaded: false,
    category: 'Financial'
  }, {
    id: 'profit-loss',
    name: 'Profit & Loss Statement',
    description: 'Year-to-date P&L statement',
    required: true,
    uploaded: false,
    category: 'Financial'
  }, {
    id: 'balance-sheet',
    name: 'Balance Sheet',
    description: 'Current balance sheet',
    required: true,
    uploaded: false,
    category: 'Financial'
  }, {
    id: 'business-license',
    name: 'Business License',
    description: 'Current business license or registration',
    required: true,
    uploaded: false,
    category: 'Legal'
  }, {
    id: 'id-verification',
    name: 'Owner ID',
    description: 'Government-issued photo ID',
    required: true,
    uploaded: false,
    category: 'Identity'
  }];
  useEffect(() => {
    const fetchUploadedDocuments = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      try {
        const {
          data
        } = await supabase.from('borrower_documents').select('document_category').eq('user_id', userId);
        if (data) {
          setUploadedDocs(data.map(d => d.document_category.toLowerCase()));
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUploadedDocuments();
  }, [userId]);
  const documents = requiredDocuments.map(doc => ({
    ...doc,
    uploaded: uploadedDocs.some(uploaded => uploaded.includes(doc.id.replace('-', ' ')) || doc.id.includes(uploaded.replace(' ', '-')))
  }));
  const uploadedCount = documents.filter(d => d.uploaded).length;
  const totalRequired = documents.filter(d => d.required).length;
  const progress = totalRequired > 0 ? uploadedCount / totalRequired * 100 : 0;
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, DocumentItem[]>);
  if (isLoading) {
    return <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-6">
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <div className="h-2 bg-muted rounded w-full mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className={cn("border border-border", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-left">
              <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Document Checklist
              </CardTitle>
              {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </button>
          </CollapsibleTrigger>
          
          {/* Progress summary always visible */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Completion</span>
              <span className={cn("font-medium", progress === 100 ? "text-green-600" : "text-primary")}>
                {uploadedCount}/{totalRequired} uploaded
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {Object.entries(groupedDocs).map(([category, docs]) => <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {docs.map(doc => <div key={doc.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all duration-200", doc.uploaded ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-background border-border hover:border-primary/30")}>
                        {doc.uploaded ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" /> : doc.required ? <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", doc.uploaded && "text-green-700 dark:text-green-400")}>
                            {doc.name}
                            {doc.required && !doc.uploaded && <span className="text-destructive ml-1">*</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.description}
                          </p>
                        </div>
                        {!doc.uploaded && <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate('/my-documents')}>
                            <Upload className="h-3 w-3 mr-1" />
                            Upload
                          </Button>}
                      </div>)}
                  </div>
                </div>)}
            </div>

            {uploadedCount < totalRequired && <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  {totalRequired - uploadedCount} required document(s) still needed
                </p>
              </div>}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>;
};